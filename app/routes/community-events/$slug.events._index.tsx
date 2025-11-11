import type { Route } from "./+types/$slug.events._index";
import { useOutletContext } from 'react-router';
import { EventsContent } from '~/components/events/events-content';
import type { Database } from '~/models/database.types';

type Community = Database['public']['Tables']['communities']['Row'];

interface OutletContext {
	community: Community | null;
	loading: boolean;
	slug: string;
}

export function meta({ params }: Route.MetaArgs) {
	const slug = params.slug;
	
	return [
		{ title: `Events - ${slug.toLocaleUpperCase()} Community | Build Communities that Matter` },
		{ name: "description", content: `Discover upcoming events and activities in the ${slug} community. Join engaging meetups, workshops, and networking opportunities.` },
		{ name: "keywords", content: `${slug} events, community events, meetups, workshops, networking, activities, ${slug} community` },
		
		// Open Graph
		{ property: "og:title", content: `Events - ${slug} Community` },
		{ property: "og:description", content: `Discover upcoming events and activities in the ${slug} community. Join engaging meetups, workshops, and networking opportunities.` },
		{ property: "og:type", content: "website" },
		{ property: "og:site_name", content: "Community Platform" },
		
		// Twitter Card
		{ name: "twitter:card", content: "summary_large_image" },
		{ name: "twitter:title", content: `Events - ${slug} Community` },
		{ name: "twitter:description", content: `Discover upcoming events and activities in the ${slug} community. Join engaging meetups, workshops, and networking opportunities.` },
		
		// Additional SEO
		{ name: "robots", content: "index, follow" },
		{ name: "author", content: `${slug} Community` },
		{ name: "viewport", content: "width=device-width, initial-scale=1" },
		
		// Schema.org structured data
		{
			"script:ld+json": {
				"@context": "https://schema.org",
				"@type": "CollectionPage",
				"name": `Events - ${slug} Community`,
				"description": `Discover upcoming events and activities in the ${slug} community. Join engaging meetups, workshops, and networking opportunities.`,
				"url": `https://luhive.com/c/${slug}/events`,
				"isPartOf": {
					"@type": "WebSite",
					"name": "Community Platform",
					"url": "https://luhive.com"
				},
				"about": {
					"@type": "Organization",
					"name": `${slug} Community`,
					"description": `Community events and activities for ${slug}`
				}
			}
		}
	];
}

export default function EventsIndex() {
	const { community, loading, slug } = useOutletContext<OutletContext>();

	return <EventsContent community={community} loading={loading} slug={slug} />;
}
