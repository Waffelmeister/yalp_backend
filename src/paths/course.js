import {
  CourseModel,
  createCourse,
  inviteCodeGenerator,
} from "../models/course.js";
import { reduceObject } from "../services/utils.js";

export default {
  POST: POST,
};

async function POST(req, res, next) {
  const courseName = req.body.name;
  if (await CourseModel.findOne({ name: courseName })) {
    throw { status: 400, message: "Course with name already existing." };
  }

  const newCourse = await createCourse({ name: courseName, owner: req.userId });

  res.status(200).json(reduceObject(newCourse, ["name", "code"]));
}

POST.apiDoc = {
  summary: "Create new course",
  description: "Writes a new Course to the database",
  operationId: "createCourse",
  tags: ["Course"],
  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            name: {
              type: String,
            },
          },
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
              name: {
                type: String,
              },
              code: {
                type: String,
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
