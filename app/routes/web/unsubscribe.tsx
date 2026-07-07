import { Form, Link, useLoaderData } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { createServiceRoleClient } from "~/shared/lib/supabase/server";
import {
  verifyUnsubscribeSig,
} from "~/shared/lib/email/unsubscribe-token.server";
import { Routes } from "~/shared/lib/routing/routes";
import { Button } from "~/shared/components/ui/button";

export function meta() {
  return [{ title: "Email preferences — Luhive" }];
}

type UnsubscribeLoaderData = {
  status: "invalid" | "unsubscribed" | "subscribed";
  communityName: string | null;
  communitySlug: string | null;
  communityId: string | null;
  userId: string | null;
  sig: string | null;
};

async function fetchCommunityName(communityId: string): Promise<{
  name: string | null;
  slug: string | null;
}> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("communities")
    .select("name, slug")
    .eq("id", communityId)
    .maybeSingle();

  return {
    name: data?.name ?? null,
    slug: data?.slug ?? null,
  };
}

async function setEmailOptOut(
  communityId: string,
  userId: string,
  optOut: boolean,
): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("community_members")
    .update({ email_opt_out: optOut })
    .eq("community_id", communityId)
    .eq("user_id", userId);

  return !error;
}

function readFormValue(formData: FormData | undefined, key: string): string {
  const value = formData?.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseUnsubscribeParams(request: Request, formData?: FormData) {
  const url = new URL(request.url);
  const communityId =
    url.searchParams.get("c")?.trim() || readFormValue(formData, "c");
  const userId =
    url.searchParams.get("u")?.trim() || readFormValue(formData, "u");
  const sig =
    url.searchParams.get("sig")?.trim() || readFormValue(formData, "sig");
  return { communityId, userId, sig };
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { communityId, userId, sig } = parseUnsubscribeParams(request);

  if (!verifyUnsubscribeSig(communityId, userId, sig)) {
    return {
      status: "invalid",
      communityName: null,
      communitySlug: null,
      communityId: null,
      userId: null,
      sig: null,
    } satisfies UnsubscribeLoaderData;
  }

  const { name, slug } = await fetchCommunityName(communityId);
  await setEmailOptOut(communityId, userId, true);

  return {
    status: "unsubscribed",
    communityName: name,
    communitySlug: slug,
    communityId,
    userId,
    sig,
  } satisfies UnsubscribeLoaderData;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const { communityId, userId, sig } = parseUnsubscribeParams(request, formData);

  if (!verifyUnsubscribeSig(communityId, userId, sig)) {
    return {
      status: "invalid",
      communityName: null,
      communitySlug: null,
      communityId: null,
      userId: null,
      sig: null,
    } satisfies UnsubscribeLoaderData;
  }

  const listUnsubscribeHeader = request.headers.get("List-Unsubscribe");
  const isOneClickPost =
    request.method === "POST" &&
    (listUnsubscribeHeader === "One-Click" ||
      listUnsubscribeHeader === "List-Unsubscribe=One-Click");

  const intent = formData.get("intent");

  const optOut = isOneClickPost || intent !== "resubscribe";
  await setEmailOptOut(communityId, userId, optOut);

  const { name, slug } = await fetchCommunityName(communityId);

  if (isOneClickPost) {
    return new Response(null, { status: 200 });
  }

  return {
    status: optOut ? "unsubscribed" : "subscribed",
    communityName: name,
    communitySlug: slug,
    communityId,
    userId,
    sig,
  } satisfies UnsubscribeLoaderData;
}

export default function UnsubscribePage() {
  const data = useLoaderData<UnsubscribeLoaderData>();

  if (data.status === "invalid") {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center px-5">
        <div className="max-w-md w-full rounded-xl border border-border bg-background p-8 text-center space-y-4">
          <h1 className="text-xl font-semibold">Invalid link</h1>
          <p className="text-sm text-muted-foreground">
            This unsubscribe link is invalid or has expired.
          </p>
          <Button asChild variant="outline">
            <Link to={Routes.home}>Go to Luhive</Link>
          </Button>
        </div>
      </div>
    );
  }

  const communityLabel = data.communityName ?? "this community";
  const isUnsubscribed = data.status === "unsubscribed";

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center px-5">
      <div className="max-w-md w-full rounded-xl border border-border bg-background p-8 text-center space-y-4">
        <h1 className="text-xl font-semibold">
          {isUnsubscribed ? "You're unsubscribed" : "You're resubscribed"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isUnsubscribed
            ? `You will no longer receive announcement and event update emails from ${communityLabel}. You are still a member of the community.`
            : `You will receive announcement and event update emails from ${communityLabel} again.`}
        </p>

        {data.communityId && data.userId && data.sig ? (
          <Form method="post">
            <input type="hidden" name="c" value={data.communityId} />
            <input type="hidden" name="u" value={data.userId} />
            <input type="hidden" name="sig" value={data.sig} />
            <Button
              type="submit"
              name="intent"
              value={isUnsubscribed ? "resubscribe" : "unsubscribe"}
              variant="outline"
            >
              {isUnsubscribed ? "Resubscribe to emails" : "Unsubscribe again"}
            </Button>
          </Form>
        ) : null}

        {data.communitySlug ? (
          <Button asChild variant="ghost" className="w-full">
            <Link to={Routes.community.detail(data.communitySlug)}>
              Visit {communityLabel}
            </Link>
          </Button>
        ) : (
          <Button asChild variant="ghost" className="w-full">
            <Link to={Routes.home}>Go to Luhive</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
