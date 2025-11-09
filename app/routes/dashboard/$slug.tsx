import { Suspense, lazy } from "react"
import { useRouteLoaderData, useLoaderData } from "react-router"
import type { Route } from "./+types/$slug"
import type { DashboardLoaderData } from "./layout"
import { createClient } from "~/lib/supabase.server"

import { SectionCardsSkeleton } from "~/components/section-cards-skeleton"
import { DataTableSkeleton } from "~/components/data-table-skeleton"

// Lazy load heavy components
const SectionCards = lazy(() => import("~/components/section-cards").then(m => ({ default: m.SectionCards })))
const DataTable = lazy(() => import("~/components/data-table").then(m => ({ default: m.DataTable })))

type Member = {
  id: string
  full_name: string
  avatar_url: string | null
  joined_at: string
  role: string
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request)

  const slug = params.slug

  if (!slug) {
    return { members: [] }
  }

  // Get community ID from slug first
  const { data: community } = await supabase
    .from('communities')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!community) {
    return { members: [] }
  }

  // Fetch community members with their profile data
  const { data: members, error } = await supabase
    .from('community_members')
    .select(`
      id,
      role,
      joined_at,
      user_id,
      profiles (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('community_id', community.id)
    .order('joined_at', { ascending: false })

  if (error) {
    console.error('Error fetching members:', error)
    return { members: [] }
  }

  // Transform data to match DataTable schema
  const transformedMembers: Member[] = members?.map((member: any) => {
    const profile = member.profiles

    return {
      id: member.id,
      full_name: profile?.full_name || 'Unknown User',
      avatar_url: profile?.avatar_url || null,
      joined_at: member.joined_at,
      role: member.role || 'member',
    }
  }) || []

  return { members: transformedMembers }
}

export function meta() {
  return [
    { title: "Dashboard Overview - Luhive" },
    { name: "description", content: "Manage your community dashboard" },
  ];
}

export default function DashboardOverview() {
  // Access parent layout loader data
  const parentData = useRouteLoaderData<DashboardLoaderData>('routes/dashboard/layout')
  const { members } = useLoaderData<typeof loader>()

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <Suspense fallback={<SectionCardsSkeleton />}>
        <SectionCards />
      </Suspense>
      <div className="px-4 lg:px-6">
        {/* Charts will be loaded later */}
      </div>
      <Suspense fallback={<DataTableSkeleton />}>
        <DataTable data={members} />
      </Suspense>
    </div>
  )
}

