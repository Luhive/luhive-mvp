import type { Event } from "~/shared/models/entity.types";
import { toast } from "sonner";

export const handleShare = async (event: Event) => {
	if (navigator.share) {
		try {
			await navigator.share({
				title: event.title,
				text: `Join ${event.title}`,
				url: window.location.href,
			});
		} catch (err) {
			console.error("Share failed:", err);
		}
	} else {
		navigator.clipboard.writeText(window.location.href);
		toast.success("Link copied to clipboard!");
	}
};