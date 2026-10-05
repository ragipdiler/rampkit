import { expect, it } from "vitest";
import { parseArgs } from "./args";
it("supports the documented CLI and export formats", () => {
  expect(parseArgs(["https://example.com"])).toEqual({
    url: "https://example.com",
    format: undefined,
    out: "rampkit",
    help: false,
    anchors: [],
  });
  expect(parseArgs(["https://example.com", "--format", "css"]).format).toBe(
    "css",
  );
  expect(parseArgs(["--help"]).help).toBe(true);
});
it("rejects bad options and missing values", () => {
  expect(() => parseArgs(["--format", "garbage"])).toThrow();
  expect(() => parseArgs(["--out"])).toThrow();
  expect(() => parseArgs(["--unknown"])).toThrow();
  expect(() => parseArgs([])).toThrow();
});
