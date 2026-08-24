import { describe, expect, it } from "vitest";
import { isTvAppId, tvAppLink } from "../apps.js";

describe("tv apps", () => {
  it("accepts the three remote apps", () => {
    expect(isTvAppId("youtube")).toBe(true);
    expect(isTvAppId("prime-video")).toBe(true);
    expect(isTvAppId("hotstar")).toBe(true);
    expect(isTvAppId("netflix")).toBe(false);
  });

  it("uses a single https deep link per app", () => {
    expect(tvAppLink("youtube")).toBe("https://www.youtube.com");
    expect(tvAppLink("prime-video")).toBe("https://app.primevideo.com");
    expect(tvAppLink("hotstar")).toBe("https://www.hotstar.com/in");
  });
});
