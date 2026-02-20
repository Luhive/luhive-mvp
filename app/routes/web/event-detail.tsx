export { loader } from "~/modules/events/server/event-detail-loader.server";
export { action } from "~/modules/events/server/event-detail-action.server";
export { meta } from "~/modules/events/model/event-detail-meta";

import { useLoaderData } from "react-router";
import type { EventDetailLoaderData } from "~/modules/events/server/event-detail-loader.server";
import { EventDetail } from "~/modules/events/components/event-detail/event-detail";

export default function EventPublicView() {

	const loaderData = useLoaderData<EventDetailLoaderData>();

	return <EventDetail {...loaderData} />;
}
