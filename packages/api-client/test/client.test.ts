import { Result } from "@luhive/domain";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClient, type RequestInterceptor } from "../src/client";

const baseUrl = "https://core.example";

const addTestToken: RequestInterceptor<void> = async (headers) => {
  headers.set("Authorization", "Bearer session-token");
  return undefined;
};

function client(interceptors: RequestInterceptor<void>[] = [addTestToken]) {
  return new ApiClient<void>(baseUrl, interceptors);
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sentHeaders(fetchMock: ReturnType<typeof vi.fn>): Headers {
  const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
  return init.headers as Headers;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ApiClient", () => {
  it("returns a success body as-is, with the headers the interceptors added", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true, data: { id: "person-1" } }, 200));
    vi.stubGlobal("fetch", fetchMock);

    const result = await client().get("/people/person-1");

    expect(result).toEqual({ ok: true, data: { id: "person-1" } });
    expect(fetchMock.mock.calls[0]?.[0]).toEqual(new URL("/people/person-1", baseUrl));
    expect(sentHeaders(fetchMock).get("Authorization")).toBe("Bearer session-token");
    expect(sentHeaders(fetchMock).get("Content-Type")).toBeNull();
  });

  it("keeps a conflict from a 409 instead of throwing", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ ok: false, error: { code: "conflict", message: "already a member" } }, 409),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await client().post("/community/join", { communitySlug: "gdg-baku" });

    expect(result).toEqual({
      ok: false,
      error: { code: "conflict", message: "already a member" },
    });
    expect(sentHeaders(fetchMock).get("Content-Type")).toBe("application/json");
  });

  it("returns internal_error when the request cannot be sent", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const result = await client().delete("/community/membership");

    expect(result).toEqual({
      ok: false,
      error: { code: "internal_error", message: "core API request failed" },
    });
  });

  it("stops before calling core when an interceptor returns a failure", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const rejectSignedOut: RequestInterceptor<void> = async () => Result.failure("unauthorized");
    const neverReached = vi.fn<RequestInterceptor<void>>();

    const result = await client([rejectSignedOut, neverReached]).post("/people", {});

    expect(result).toEqual({ ok: false, error: { code: "unauthorized" } });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(neverReached).not.toHaveBeenCalled();
  });
});
