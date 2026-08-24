import { describe, expect, it } from "vitest";
import { diffTypedText } from "./keyboardText.js";

describe("diffTypedText", () => {
  it("inserts a suffix", () => {
    expect(diffTypedText("hel", "hello")).toEqual({ backspaces: 0, insert: "lo" });
  });

  it("counts backspaces for a deletion", () => {
    expect(diffTypedText("hello", "he")).toEqual({ backspaces: 3, insert: "" });
  });

  it("replaces from the first difference", () => {
    expect(diffTypedText("cat", "car")).toEqual({ backspaces: 1, insert: "r" });
  });

  it("treats emoji as one character", () => {
    expect(diffTypedText("hi👍", "hi")).toEqual({ backspaces: 1, insert: "" });
    expect(diffTypedText("hi", "hi👍")).toEqual({ backspaces: 0, insert: "👍" });
  });
});
