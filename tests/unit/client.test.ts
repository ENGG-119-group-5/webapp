import { describe, expect, it, vi } from "vitest";
import { ApiError, api, buildUrl, getApiBase, isUsingMock } from "@/lib/api/client";

describe("API base URL", () => {
  it("defaults to the built-in mock", () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
    expect(getApiBase()).toBe("/api/mock");
    expect(isUsingMock()).toBe(true);
  });

  it("uses NEXT_PUBLIC_API_BASE_URL without trailing slashes", () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://backend.example.com/");
    expect(getApiBase()).toBe("https://backend.example.com");
    expect(isUsingMock()).toBe(false);
  });
});

describe("buildUrl", () => {
  it("adds only non-empty query params", () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
    expect(buildUrl("/search", { q: "battery coating", type: "all", limit: undefined, x: "" })).toBe(
      "/api/mock/search?q=battery+coating&type=all",
    );
    expect(buildUrl("technology/tech-a")).toBe("/api/mock/technology/tech-a");
  });
});

describe("request errors", () => {
  it("surfaces FastAPI-style `detail` messages with the status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ detail: "Technology not found" }, { status: 404 })));
    const err = await api.getTechnology("nope").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe("Technology not found");
    expect(err.isNotFound).toBe(true);
  });

  it("reports status 0 when the server is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    const err = await api.search("x").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
  });

  it("URL-encodes ids", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({}));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
    await api.getPatent("US 1/2");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/mock/patent/US%201%2F2");
  });
});
