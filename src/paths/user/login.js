import User from "../../models/user.js";

export default {
  parameters: [],
  // method handlers may just be the method handler...
  POST: POST,
};

async function POST(req, res) {
  const {mail, password } = req.body;

  const loginResult = await User.login(mail, password);

  res.status(200).json(loginResult);
}

POST.apiDoc = {
  summary: "Generate JWT Token",
  description:
    "Looks the user up in the database (needs registering) and returns a jwt token if he exits.",
  operationId: "login",
  tags: ["User"],
  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",
          // required: ["login"],
          properties: {
            mail: {
              type: String,
              example: "john@doemail.com",
            },
            password: {
              type: String,
              example: "password",
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successfull login, token",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              profile: {
                $ref: "#/components/schemas/User",
              },
              token: {
                type: String,
              },
              expiresInSeconds: {
                type: "number",
                example: 1800
              },
              timestamp: {
                type: "number",
                example: new Date().valueOf()
              },
            },
          },
        },
      },
    },
    400: {
      $ref: "#/components/responses/InvalidRequest",
    },
    default: {
      $ref: "#/components/responses/Error",
    },
  },
};
