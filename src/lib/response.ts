import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

// The single wire envelope for every endpoint, discriminated by `ok`.
// Payloads themselves are still schema-defined DTOs; this is the generic
// container around them, so it is a TS type rather than a Zod schema.

export type ApiFieldError = { path: string; message: string };
export type ApiMeta = { next_cursor?: string | null };

export type ApiSuccess<T> = { ok: true; data: T; meta?: ApiMeta };
export type ApiFailure = {
  ok: false;
  error: { code: string; fields?: ApiFieldError[] };
};
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function successBody<T>(data: T, meta?: ApiMeta): ApiSuccess<T> {
  return meta ? { ok: true, data, meta } : { ok: true, data };
}

export function failureBody(code: string, fields?: ApiFieldError[]): ApiFailure {
  return { ok: false, error: fields?.length ? { code, fields } : { code } };
}

export function fail(
  c: Context,
  status: ContentfulStatusCode,
  code: string,
  fields?: ApiFieldError[],
) {
  return c.json(failureBody(code, fields), status);
}
