import { Result, type Failure, type Result as ApiResult } from "@luhive/domain";

/**
 * Runs before every request, like an axios request interceptor. It adds
 * headers, or returns a failure to stop the request before it reaches core.
 */
export type RequestInterceptor<TContext> = (
  headers: Headers,
  context: TContext,
) => Promise<Failure | undefined>;

/**
 * Calls core and returns its envelope as-is, including failures. A 409 whose
 * body says `conflict` must reach the caller as that code, not as a thrown error.
 *
 * Interceptors are fixed at construction and run in order, so every one of
 * them is visible where the client is created.
 */
export class ApiClient<TContext> {
  constructor(
    private readonly baseUrl: string,
    private readonly interceptors: RequestInterceptor<TContext>[],
  ) {}

  get<T>(path: string, context: TContext): Promise<ApiResult<T>> {
    return this.send("GET", path, context);
  }

  post<T>(path: string, body: unknown, context: TContext): Promise<ApiResult<T>> {
    return this.send("POST", path, context, body);
  }

  delete<T>(path: string, context: TContext): Promise<ApiResult<T>> {
    return this.send("DELETE", path, context);
  }

  private async send<T>(
    method: string,
    path: string,
    context: TContext,
    body?: unknown,
  ): Promise<ApiResult<T>> {
    const headers = new Headers();
    if (body !== undefined) headers.set("Content-Type", "application/json");

    for (const intercept of this.interceptors) {
      const failure = await intercept(headers, context);
      if (failure) return failure;
    }

    let response: Response;
    try {
      response = await fetch(new URL(path, this.baseUrl), {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      return Result.failure("internal_error", { message: "core API request failed" });
    }

    return readResult<T>(response);
  }
}

async function readResult<T>(response: Response): Promise<ApiResult<T>> {
  try {
    return (await response.json()) as ApiResult<T>;
  } catch {
    return Result.failure("internal_error", { message: "core API returned an unreadable body" });
  }
}
