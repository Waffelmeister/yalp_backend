import errorCodes from "../src/services/errorCodes.js";
import { expect } from "chai";
import {
  generateAccessToken,
  verifyToken,
} from "../src/services/middlewares.js";
import user from "../src/models/user.js";

describe("Others", function () {
  it("should error obj without", function (done) {
    const error = errorCodes(0);
    expect(error).to.be.an("object");
    expect(error).to.have.property("code", 0);
    expect(error).to.have.property("message", "Unknown Error");
    done();
  });

  it("should error obj with errormsg", function (done) {
    const error = errorCodes(1000, "failed");
    expect(error).to.be.an("object");
    expect(error).to.have.property("code", 1000);
    expect(error).to.have.property("message", "Missing parameter : failed");
    done();
  });

  it("should error obj without code", function (done) {
    const error = errorCodes();
    expect(error).to.be.an("object");
    expect(error).to.have.property("code", 0);
    expect(error).to.have.property("message", "Unknown Error");
    done();
  });

  it("should throw invalid token", function (done) {
    const token = generateAccessToken(1) + 1;
    verifyToken({ headers: { authorization: `Bearer ${token}` } }, {}).catch(
      (err) => {
        expect(err).to.be.an("object");
        expect(err).to.have.property("code", 200);
        expect(err).to.have.property("status", 403);

        done();
      }
    );
  });

  it("should throw missing token", function (done) {
    verifyToken({ headers: { authorization: `` } }, {}).catch((err) => {
      expect(err).to.be.an("object");
      expect(err).to.have.property("code", 100);
      expect(err).to.have.property("status", 401);

      done();
    });
  });

  it("should parse mongoose to api schema", function (done) {
    const api = user.getApiSchema("User", "reducedInfo");
    expect(api).to.be.an("object");
    expect(api).to.have.property("title", "User");
    done();
  });
});
