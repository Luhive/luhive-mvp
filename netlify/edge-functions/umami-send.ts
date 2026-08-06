import type { Config, Context } from "@netlify/edge-functions";

const UMAMI_COLLECT_URL = "https://cloud.umami.is/api/send";
const STRIPPED_HEADERS = ["host", "cookie", "x-forwarded-for", "x-forwarded-host"];

// Umami decodes location headers as latin1 bytes, so pass UTF-8 bytes verbatim.
const toHeaderValue = (value: string) =>
  String.fromCharCode(...new TextEncoder().encode(value));

export default async (request: Request, context: Context) => {
  const headers = new Headers(request.headers);
  STRIPPED_HEADERS.forEach((name) => headers.delete(name));

  headers.set("x-umami-client-ip", context.ip);
  if (context.geo.country?.code) {
    headers.set("x-umami-client-country", context.geo.country.code);
  }
  if (context.geo.subdivision?.code) {
    headers.set("x-umami-client-region", context.geo.subdivision.code);
  }
  if (context.geo.city) {
    headers.set("x-umami-client-city", toHeaderValue(context.geo.city));
  }

  return fetch(UMAMI_COLLECT_URL, {
    method: request.method,
    headers,
    body: request.method === "POST" ? await request.text() : undefined,
  });
};

export const config: Config = { path: "/api/send" };
