import type { Route } from "./+types/layout";
import { Outlet, useLoaderData, useMatches } from "react-router";
import { useEffect } from "react";
import { TopNavigation } from "~/shared/components/navigation";
import { createClient } from "~/shared/lib/supabase/server";
import type { Database } from "~/shared/models/database.types";
import Footer from "~/shared/components/footer";
import { setUser, clearUser } from "~/shared/lib/monitoring/sentry";

type Profile = Database['public']['Tables']['profiles']['Row'];

interface TopNavigationLayoutData {
  user: Profile | null;
}

export async function loader({ request }: Route.LoaderArgs): Promise<TopNavigationLayoutData> {
  const { supabase } = createClient(request);

  // Get current user session
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return { user: null };
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();

  return {
    user: profile || null,
  };
}

export function shouldRevalidate({
  formMethod,
  defaultShouldRevalidate,
}: {
  formMethod?: string;
  defaultShouldRevalidate: boolean;
}) {
  // Skip layout revalidation on link navigations - navbar user data is stable.
  // Revalidate only on form submissions (login, profile updates, etc.).
  if (formMethod === "GET" || formMethod === undefined) return false;
  return defaultShouldRevalidate;
}

export default function TopNavigationLayout() {
  const { user } = useLoaderData<typeof loader>();
  const matches = useMatches();
  const isEditorRoute = matches.some(
    (m) => typeof m.id === "string" && m.id.includes("announcement-new"),
  );

  // Set Sentry user context when user is available
  useEffect(() => {
    if (user) {
      setUser({
        id: user.id,
        username: user.full_name || undefined,
      });
    } else {
      clearUser();
    }
  }, [user]);

  return (
    <div className="min-h-screen container mx-auto px-5 bg-background flex flex-col">
      {!isEditorRoute && <TopNavigation user={user} />}
      <main className="flex-1 pb-5 lg:pb-0">
        <Outlet />
      </main>
      {!isEditorRoute && <Footer />}
    </div>
  );
}
