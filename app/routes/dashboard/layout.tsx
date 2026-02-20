import {
  Outlet,
  redirect,
  useLocation,
  useLoaderData,
  useNavigation,
} from "react-router";
import { useEffect } from "react";
import { setUser, setCommunityContext } from "~/shared/lib/monitoring/sentry";
import type {
  DashboardCommunityData,
  Profile,
} from "~/modules/dashboard/model/dashboard-types";
import { createClient } from "~/shared/lib/supabase/client";
import { getCommunityBySlugClient } from "~/modules/dashboard/data/dashboard-repo.client";
import { AppSidebar } from "~/modules/dashboard/components/app-sidebar";
import { SiteHeader } from "~/modules/dashboard/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "~/shared/components/ui/sidebar";
import { DashboardLayoutSkeleton } from "~/modules/dashboard/components/dashboard-layout-skeleton";
import { DashboardContentSkeleton } from "~/modules/dashboard/components/dashboard-content-skeleton";
import { DashboardOverviewSkeleton } from "~/modules/dashboard/components/dashboard-overview-skeleton";
import { DashboardEventsListSkeleton } from "~/modules/dashboard/components/dashboard-events-list-skeleton";
import { DashboardFormsSkeleton } from "~/modules/dashboard/components/dashboard-forms-skeleton";
import { DashboardFormDetailSkeleton } from "~/modules/dashboard/components/dashboard-form-detail-skeleton";
import { DashboardEditSkeleton } from "~/modules/dashboard/components/dashboard-edit-skeleton";
import { DashboardAttendersSkeleton } from "~/modules/dashboard/components/dashboard-attenders-skeleton";

async function clientLoader({
  params,
}: {
  params: { slug?: string };
}): Promise<DashboardCommunityData> {
  const slug = params.slug;
  if (!slug) {
    throw redirect("/");
  }

  const supabase = createClient();

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    throw redirect("/login");
  }

  const { community, error: communityError } =
    await getCommunityBySlugClient(slug);

  if (communityError || !community) {
    throw redirect(slug ? `/c/${slug}` : "/");
  }

  const isOwner = community.created_by === authUser.id;
  let role: "owner" | "admin" | null = null;

  if (isOwner) {
    role = "owner";
  } else {
    const { data: membership } = await supabase
      .from("community_members")
      .select("role")
      .eq("community_id", community.id)
      .eq("user_id", authUser.id)
      .single();

    if (
      membership &&
      (membership.role === "admin" || membership.role === "owner")
    ) {
      role = membership.role === "owner" ? "owner" : "admin";
    }
  }

  if (!role) {
    throw redirect(`/c/${slug}`);
  }

  const userEmail = authUser.email || "user@example.com";

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (profileError || !profile) {
    const defaultProfile: Profile = {
      id: authUser.id,
      full_name: authUser.email?.split("@")[0] || "User",
      avatar_url: null,
      bio: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      settings: null,
      gamification: null,
      metadata: null,
    } as Profile;

    return {
      community,
      user: defaultProfile,
      userEmail,
      role,
    };
  }

  return {
    community,
    user: profile,
    userEmail,
    role,
  };
}
clientLoader.hydrate = true as const;

export { clientLoader };

export function shouldRevalidate({
  currentParams,
  nextParams,
}: {
  currentParams: Record<string, string | undefined>;
  nextParams: Record<string, string | undefined>;
}) {
  // Only revalidate when switching to a different community (slug changes)
  if (currentParams?.slug !== nextParams?.slug) return true;
  // Skip parent revalidation when navigating between child tabs (same slug)
  return false;
}

function getHeaderTitle(pathname: string): string {
  if (pathname.includes("/profile")) return "Edit Community Profile";
  if (pathname.includes("/events")) return "Events Management";
  if (pathname.includes("/forms")) return "Google Forms";
  if (pathname.includes("/settings")) return "Settings";
  return "Dashboard Overview";
}

/**
 * Returns the tab-specific skeleton for the target pathname during navigation.
 * Uses navigation.location (target) when loading, else falls back to current pathname.
 */
function getTabSkeleton(pathname: string): React.ReactNode {
  // Overview: /dashboard/:slug with no child path
  if (/^\/dashboard\/[^/]+\/?$/.test(pathname.replace(/\/$/, ""))) {
    return <DashboardOverviewSkeleton />;
  }
  if (pathname.includes("/profile")) {
    return <DashboardEditSkeleton />;
  }
  if (pathname.includes("/events")) {
    return <DashboardEventsListSkeleton />;
  }
  if (pathname.includes("/forms/") && pathname.split("/forms/")[1]?.length > 0) {
    return <DashboardFormDetailSkeleton />;
  }
  if (pathname.includes("/forms")) {
    return <DashboardFormsSkeleton />;
  }
  if (pathname.includes("/attenders")) {
    return <DashboardAttendersSkeleton />;
  }
  return <DashboardContentSkeleton />;
}

export default function DashboardLayoutPage() {
  const location = useLocation();
  const data = useLoaderData<DashboardCommunityData | undefined>();

  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const targetPathname =
    navigation.location?.pathname ?? location.pathname;

  useEffect(() => {
    if (data) {
      setUser({
        id: data.user.id,
        email: data.userEmail,
        username: data.user.full_name || undefined,
      });
      setCommunityContext({
        id: data.community.id,
        slug: data.community.slug,
        name: data.community.name,
      });
    }
  }, [data]);

  if (data === undefined) {
    return <DashboardLayoutSkeleton />;
  }

  const { community, user, userEmail, role } = data;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        variant="inset"
        community={community}
        user={user}
        userEmail={userEmail}
        role={role}
      />
      <SidebarInset>
        <SiteHeader
          title={getHeaderTitle(isLoading ? targetPathname : location.pathname)}
        />
        <div className="flex flex-1 flex-col">
          {isLoading ? (
            <div className="@container/main flex flex-1 flex-col gap-2">
              {getTabSkeleton(targetPathname)}
            </div>
          ) : (
            <div className="@container/main flex flex-1 flex-col gap-2">
              <Outlet context={{ dashboardData: data }} />
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

