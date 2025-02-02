import Course from "../../../models/course.js";

const parameters = [
  {
    name: "code",
    in: "path",
    schema: {
      type: "string",
    },
    example: "MUSICISGREAT101",
    required: true,
    description: "Referral code of the course",
  },
];

export default {
  POST: POST,
  DELETE: DELETE,
  parameters,
};

async function POST(req, res) {
  const course = await Course.addMember(req.params.code, req.userId);

  res.status(200).json(course);
}
POST.apiDoc = {
  summary: "Join a course",
  description: "Joins the course via code.",
  operationId: "joinCourse",
  tags: ["Course"],
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/Course",
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

async function DELETE(req, res) {
  await Course.deleteMember(req.params.code, req.userId);
  res.status(200).json({ result: "OK" });
}

DELETE.apiDoc = {
  summary: "Leaves a course",
  description: "Leaves a course, if you are not owner of the course.",
  operationId: "leaveCourse",
  tags: ["Course"],
  responses: {
    200: {
      $ref: "#/components/responses/VoidResult",
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
    default: {
      $ref: "#/components/responses/Error",
    },
  },
};
