import { createClient } from "~/shared/lib/supabase/server";
import {
  createOAuth2Client,
  setCredentials,
  listForms,
} from "~/modules/integrations/providers/google-forms/data/google-forms-repo.server";
import type { LoaderFunctionArgs } from "react-router";
import type { IntegrationFormData } from "~/modules/integrations/model/integration-types";

export type GoogleFormsLoaderData = {
  connected: boolean;
  forms: IntegrationFormData[];
  error?: string;
  communitySlug: string;
};

export async function loader({
  request,
  params,
}: LoaderFunctionArgs): Promise<GoogleFormsLoaderData> {
  const { supabase } = createClient(request);
  const slug = (params as { slug?: string }).slug ?? "";

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      connected: false,
      forms: [],
      error: "Not authenticated",
      communitySlug: slug,
    };
  }

  try {
    const { data: tokenData, error: tokenError } = await supabase
      .from("google_forms_tokens")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (tokenError || !tokenData) {
      return {
        connected: false,
        forms: [],
        communitySlug: slug,
      };
    }

    const oauth2Client = createOAuth2Client();
    setCredentials(oauth2Client, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: tokenData.expiry_date
        ? new Date(tokenData.expiry_date).getTime()
        : null,
    });

    const forms = await listForms(oauth2Client);

    return {
      connected: true,
      forms: forms.map((form) => ({
        id: form.id!,
        name: form.name!,
        createdTime: form.createdTime!,
        modifiedTime: form.modifiedTime!,
        webViewLink: form.webViewLink || undefined,
      })),
      communitySlug: slug,
    };
  } catch (err: unknown) {
    console.error("Google Forms loader error:", err);
    const error = err as { code?: number; message?: string };
    if (error.code === 401 || error.message?.includes("invalid_grant")) {
      return {
        connected: false,
        forms: [],
        error: "token_expired",
        communitySlug: slug,
      };
    }
    return {
      connected: true,
      forms: [],
      error: error.message || "Failed to load forms",
      communitySlug: slug,
    };
  }
}
