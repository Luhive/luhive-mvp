import type { Route } from "./+types/navigation-layout";
import { Outlet, useLoaderData } from "react-router";
import { TopNavigation } from "~/components/hub-navigation";
import { createClient } from "~/lib/supabase.server";
import type { Database } from "~/models/database.types";
import Footer from "~/components/common/Footer";

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

export default function TopNavigationLayout() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen container mx-auto bg-background flex flex-col">
      <TopNavigation user={user} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

