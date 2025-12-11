import type { Route } from "./+types/$slug.events._index";
import { useOutletContext, useLocation } from 'react-router';
import { useEffect, useRef } from 'react';
import { EventsContent } from '~/components/events/events-content';
import type { Database } from '~/models/database.types';

type Community = Database['public']['Tables']['communities']['Row'];
type Event = Database['public']['Tables']['events']['Row'];

interface OutletContext {
	community: Community | null;
	loading: boolean;
	slug: string;
	onEventClick?: (event: Event) => void;
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
	const { community, loading, slug, onEventClick } = useOutletContext<OutletContext>();
	const location = useLocation();
	const hasRestoredScrollRef = useRef(false);
	const savedScrollRef = useRef<number | null>(null);

	// Get events passed from navigation state (for instant display)
	const navigationState = location.state as { events?: Event[] } | null;
	const initialEvents = navigationState?.events || [];

	// Listen for scroll position from overlay before it unmounts
	useEffect(() => {
		const handleScrollSave = ((event: CustomEvent<number>) => {
			savedScrollRef.current = event.detail;
		}) as EventListener;
		window.addEventListener('saveOverlayScroll', handleScrollSave);
		return () => {
			window.removeEventListener('saveOverlayScroll', handleScrollSave);
		};
	}, []);

	// Prevent scroll reset when page loads with initial events (came from overlay)
	useEffect(() => {
		if (initialEvents.length > 0 && !hasRestoredScrollRef.current) {
			// If we have a saved scroll position, restore it after content renders
			if (savedScrollRef.current !== null) {
				// Wait for content to be ready, then restore scroll
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						window.scrollTo(0, savedScrollRef.current!);
						hasRestoredScrollRef.current = true;
						savedScrollRef.current = null;
					});
				});
			} else {
				// No saved scroll, but prevent default reset - maintain current position
				hasRestoredScrollRef.current = true;
			}
		}
	}, [initialEvents.length]);

	return (
		<EventsContent 
			community={community} 
			loading={loading} 
			slug={slug}
			initialEvents={initialEvents}
			onEventClick={onEventClick}
		/>
	);
}
