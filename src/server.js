import express from "express";
import { initialize } from "express-openapi";
import v1WorldsService from "./api/services/worldsService.js";
import v1ApiDoc from "./api/api-doc.js";
import swaggerUi from "swagger-ui-express";

const app = express();
app.use(
  "/api-documentation",
  swaggerUi.serve,
  swaggerUi.setup(null, {
    swaggerOptions: {
      url: "http://localhost:3000/api-docs",
    },
  })
);
initialize({
  app,
  apiDoc: v1ApiDoc,
  dependencies: {
    worldsService: v1WorldsService,
  },

  paths: "src/api/paths",
});
//
app.listen(3000);
