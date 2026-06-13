import { useLoaderData } from "react-router";
import { getCommunityBySlugClient } from "~/modules/dashboard/data/dashboard-repo.client";
import { getCommunityCollaborationInvitesClient } from "~/modules/events/data/events-repo.client";
import type { Database } from "~/shared/models/database.types";
import { Routes } from "~/shared/lib/routing/routes";

type Community = Database["public"]["Tables"]["communities"]["Row"];

type CollabRequestsLoaderData = {
  community: Community;
  invites: {
    id: string;
    event:
      | ({
          id: string;
          title: string;
          start_time: string | null;
          community_id: string;
          community?: { id: string; name: string; slug: string };
        })
      | null;
    invited_at: string | null;
  }[];
};

async function clientLoader({
  params,
}: {
  params: { slug?: string };
}): Promise<CollabRequestsLoaderData> {
  const slug = params.slug;
  if (!slug) {
    throw new Error("Missing slug");
  }

  const { community, error: communityError } =
    await getCommunityBySlugClient(slug);

  if (communityError || !community) {
    throw new Error("Community not found");
  }

  const { invites, error: invitesError } =
    await getCommunityCollaborationInvitesClient(community.id);

  if (invitesError) {
    console.error("Failed to load collaboration invites:", invitesError);
  }

  return { community, invites: invites || [] };
}

export { clientLoader };

export function meta() {
  return [
    { title: "Collab Requests - Dashboard" },
    {
      name: "description",
      content: "Manage incoming collaboration invitations",
    },
  ];
}

export default function CollabRequestsPage() {
  const { community, invites } = useLoaderData<CollabRequestsLoaderData>();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Collab Requests</h2>
          <p className="text-sm text-muted-foreground">
            Manage incoming collaboration invitations
          </p>
        </div>

        {invites.length === 0 ? (
          <p className="text-center text-gray-500">No pending invites.</p>
        ) : (
          <ul className="space-y-4">
            {invites.map((invite) => {
              const ev = invite.event;
              if (!ev) return null;
              const eventDate = ev.start_time
                ? new Date(ev.start_time).toLocaleDateString()
                : "TBD";
              const hostName = ev.community?.name;
              return (
                <li
                  key={invite.id}
                  className="p-4 border rounded-md flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{ev.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {eventDate}
                      {hostName ? ` · Hosted by ${hostName}` : ""}
                    </p>
                  </div>
                  <a
                    href={Routes.community.collaborationInvite(
                      community.slug,
                      invite.id,
                    )}
                    className="text-orange-500 underline"
                  >
                    Respond
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
