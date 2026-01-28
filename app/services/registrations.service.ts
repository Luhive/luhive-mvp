import type { Database } from "~/models/database.types";
import { createClient as createServerClient } from "~/lib/supabase.server";

type EventRegistration =
  Database["public"]["Tables"]["event_registrations"]["Row"];

export async function getRegistrationsByEventServer(
  request: Request,
  eventId: string
) {
  const { supabase } = createServerClient(request);

  const { data, error } = await supabase
    .from("event_registrations")
    .select("*")
    .eq("event_id", eventId)
    .order("registered_at", { ascending: false });

  return { registrations: (data || []) as EventRegistration[], error };
}

