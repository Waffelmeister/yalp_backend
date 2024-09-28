import mongoose from "mongoose";
import m2s from "mongoose-to-swagger";
import referralCodeGenerator from "referral-code-generator";
import ErrorCodes from "../services/errorCodes.js";

function generateInviteCode() {
  return referralCodeGenerator.alphaNumeric("lowercase", 3, 3);
}

// TODO: Testabdeckung verbessern
export default {
  model: mongoose.model("Course", {
    name: {
      type: String,
      description: "Anzeigename des Kurses.",
      min: 3,
      required: true,
    },
    members: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      description: "Ids der User",
      required: true,
    },
    scripts: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Script" }],
      description: "Ids von Skripten zu einer Kurs.",
      required: true,
    },
    code: {
      type: String,
      description: "Invite Code für andere User",
      required: true,
      min: 10,
      undefined: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      description: "Owner of the Course",
      required: true,
    },
  }),

  async create({ name, owner, code, members }) {
    let newCourse;
    try {
      newCourse = await this.model.create({
        name,
        members: members || [owner],
        scripts: [],
        code: code || generateInviteCode(),
        owner: owner,
      });
    } catch (e) {
      throw ErrorCodes(2000, e);
    }

    const obj = await newCourse.toObject();
    return { name: obj.name, code: obj.code };
  },

  async getCourseForUser(code, userId) {
    const course = await this.model
      .findOne(
        {
          code,
          members: userId,
        },
        { _id: 0, __v: 0 }
      )
      .populate({
        path: "members",
        select: "name -_id",
      })
      .populate("owner", "name -_id")
      .lean();
    if (!course) throw ErrorCodes(2001());
    return course;
  },

  async update(code, owner, { name }) {
    let course;
    try {
      course = await this.model
        .findOneAndUpdate({ code, owner }, { name }, { new: true })
        .select("name code -_id")
        .lean();
      if (!course)
        throw "Could not find course/you are not owner of the course";
    } catch (e) {
      throw ErrorCodes(2002, e);
    }
    return course;
  },

  async delete(code, owner) {
    const course = await this.model.findOne({ code, owner });

    if (!course) throw ErrorCodes(2002);

    if (course.members.length > 1 || !course.members[0].equals(owner)) {
      throw ErrorCodes(2003);
    }
    return await course.deleteOne();
  },

  async getReducedCoursesForUser(userId) {
    return await this.model
      .find({ members: userId }, { name: 1, code: 1, _id: 0 })
      .lean();
  },

  async addMember(code, userId) {
    const course = await this.model.findOne({ code });

    if (!course) throw ErrorCodes(2001);

    if (course.members.includes(userId)) throw ErrorCodes(2004);

    course.members.push(userId);
    await course.save();
    return this.getCourseForUser(code, userId);
  },

  async deleteMember(code, userId) {
    const course = await this.model.findOne({ code });
    if (!course.members.includes(userId)) throw ErrorCodes(2001);

    if (course.owner === userId) throw ErrorCodes(2005);

    if (course.members.length < 1) throw ErrorCodes(2006);

    course.members.splice(course.members.indexOf(userId), 1);
    await course.save();
  },

  async changeOwner(code, userId, newOwner) {
    const course = await this.model.getCourse({ code: code });

    if (!course.owner.equals(userId)) throw ErrorCodes(2005);

    const candidate = await this.findUserByName({
      name: newOwner,
    });

    if (!candidate) throw ErrorCodes(2007);

    if (course.owner.equals(candidate._id)) throw ErrorCodes(2008);

    course.owner = candidate._id;
    return await course.save();
  },

  getReducedSchema() {
    return m2s(this.model, {
      props: ["name", "code"],
      omitMongooseInternals: true,
    });
  },
};
