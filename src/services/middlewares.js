import jwt from "jsonwebtoken";
import winston from "winston";
import multer from "multer";
import swaggerUi from "swagger-ui-express";
export function generateAccessToken(id) {
  return jwt.sign({ id: id }, process.env.TOKEN_SECRET, {
    expiresIn: Number(process.env.TOKEN_DURATION_SECONDS),
  });
}

export function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null)
    throw {
      status: 401,
      message: "Token for request needed.",
    };

  return new Promise(function (resolve, reject) {
    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
      if (err)
        reject({
          status: 403,
          message: "Token invalid",
        });

      req.userId = user.id;
      resolve(true);
    });
  });
}

const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [
    new winston.transports.File({
      filename: "./logging/yalp_error.log",
      level: "error",
    }),
    new winston.transports.File({ filename: "./logging/yalp.log" }),
    new winston.transports.Console({ level: "error" }),
  ],
});

export function handleError(err, req, res, next) {
  res.status(err.status || 500);
  logger.error(
    `${new Date().toUTCString()} - ${req.originalUrl} + ${
      typeof req.body === "object" ? JSON.stringify(req.body) : req.body || ""
    } = status: ${err.status || 500}, code: ${err.code}, message: ${
      err.message
    }`
  );
  if (typeof err === "string") {
    res.send(err);
  } else {
    res.json(err);
  }
}

export function logInfo(req, res, next) {
  let send = res.send;
  res.send = (c) => {
    logger.info(
      `${req.originalUrl}: ${req.method} params: ${JSON.stringify(
        req.params
      )} body: ${JSON.stringify(req.body || {})} response: ${c} `
    );
    res.send = send;
    return res.send(c);
  };
  next();
}

export const consumesMiddleware = {
  "multipart/form-data": function (req, res, next) {
    multer().any()(req, res, function (err) {
      if (err) return next(err);
      const filesMap = req.files.reduce(
        (acc, f) =>
          Object.assign(acc, {
            [f.fieldname]: (acc[f.fieldname] || []).concat(f),
          }),
        {}
      );
      Object.keys(filesMap).forEach((fieldname) => {
        const files = filesMap[fieldname];
        req.body[fieldname] = files.length > 1 ? files.map(() => "") : "";
      });
      return next();
    });
  },
};

export const swaggerUiParams = [
  "/api/api-documentation",
  swaggerUi.serve,
  swaggerUi.setup(null, {
    swaggerOptions: {
      url: `${process.env.BACKEND_URL}/api-docs`,
      //Automatisches Eintragen des Token in die Authorisierung, wenn man den login erfolgreich aufruft
      responseInterceptor: function (res) {
        if (/login$/.test(res.url) && res.status === 200)
          ui.preauthorizeApiKey("bearerAuth", res.obj.token);
      },
    },
  }),
];
