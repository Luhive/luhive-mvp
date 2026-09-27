import { Result } from "@luhive/domain";
import type { RequestInterceptor } from "@luhive/api-client";
import { createClient } from "./supabase/server";

/** Forwards the signed-in user's Supabase access token to core, or stops the call when nobody is signed in. */
export const addSessionToken: RequestInterceptor<Request> = async (headers, request) => {
  const { supabase } = createClient(request);
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return Result.failure("unauthorized");

  headers.set("Authorization", `Bearer ${token}`);
  return undefined;
};
