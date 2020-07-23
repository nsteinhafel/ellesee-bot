import { expect } from "chai";
import "mocha";

import { Util } from "../util";

// Test our logging funciton.
describe("Util.log", () => {
  it("handles no input", () => {
    Util.log();
  });

  it("handles null", () => {
    Util.log(null);
  });

  it("handles a valid argument", () => {
    Util.log("test");
  });

  it("handles multiple arguments", () => {
    const two = 2;
    Util.log("test", 1, { two }, { three: 3 });
  });
});

// Test our id from string function.
describe("Util.id", () => {
  it("handles null", () => {
    expect(Util.id(null)).is.null;
  });

  it("handles invalid strings", () => {
    expect(Util.id("invalid identifier")).is.null;
  });

  it("parses a normal id", () => {
    const id = "000000000000000000";
    expect(Util.id(`<@!${id}>`)).to.eql(id);
  });

  it("parses an admin id", () => {
    const id = "000000000000000000";
    expect(Util.id(`<@!${id}>`)).to.eql(id);
  });
});

// Test our nameof funciton.
describe("Util.nameof", () => {
  it("handles null object", () => {
    expect(Util.nameof(null)).is.null;
  });

  it("returns variable name when null", () => {
    const test = null;
    expect(Util.nameof({ test })).to.eql("test");
  });

  it("returns variable name when has content", () => {
    const test = "*";
    expect(Util.nameof({ test })).to.eql("test");
  });
});
