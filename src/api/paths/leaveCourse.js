import { CourseModel } from "../models/course.js";

export default {
  POST: POST,
};

async function POST(req, res, next) {
  const course = await CourseModel.findOne({ code: req.body.code });
  if (!course.userIds.includes(req.userId))
    throw {
      status: 400,
      message: "You are not in the course.",
    };

  if (course.owner === req.userId)
    throw {
      status: 400,
      message: "You are the owner of the course. You cant leave it (yet)",
    };

  if (course.userIds.length < 1)
    throw {
      status: 500,
      message:
        "Internal error, there should be more useres than one in the course (You and the owner).",
    };

  course.userIds.splice(course.userIds.indexOf(req.userId), 1);
  await course.save();
  res.status(200).json({ result: "OK" });
}

POST.apiDoc = {
  summary: "Leaves a course",
  description: "Leaves a course, if you are not owner of the course.",
  operationId: "leaveCourse",
  tags: ["Course"],
  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            code: {
              type: String,
            },
          },
          required: ["code"],
        },
      },
    },
  },
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              result: {
                type: String,
                default: "OK",
              },
            },
          },
        },
      },
    },
    400: {
      $ref: "#/components/responses/InvalidRequest",
    },
    401: {
      $ref: "#/components/responses/MissingToken",
    },
    403: {
      $ref: "#/components/responses/InvalidToken",
    },
  },
};