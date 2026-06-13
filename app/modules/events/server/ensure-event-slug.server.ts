import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/shared/models/database.types";
import { slugifyEventTitle } from "~/modules/events/utils/event-slug";

type Supabase = SupabaseClient<Database>;

export async function ensureUniqueEventSlug(
  supabase: Supabase,
  communityId: string,
  title: string,
  excludeEventId?: string,
): Promise<string> {
  let base = slugifyEventTitle(title);
  if (!base) {
    base = `event-${crypto.randomUUID().slice(0, 8)}`;
  }

  let candidate = base;
  let counter = 2;

  while (await slugTaken(supabase, communityId, candidate, excludeEventId)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }

  return candidate;
}

async function slugTaken(
  supabase: Supabase,
  communityId: string,
  slug: string,
  excludeEventId?: string,
): Promise<boolean> {
  let query = supabase
    .from("events")
    .select("id")
    .eq("community_id", communityId)
    .eq("slug", slug);

  if (excludeEventId) {
    query = query.neq("id", excludeEventId);
  }

  const { data } = await query.maybeSingle();
  return Boolean(data);
}
