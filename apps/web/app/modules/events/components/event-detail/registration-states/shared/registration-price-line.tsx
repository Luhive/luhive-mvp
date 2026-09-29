import { Ticket } from "lucide-react";
import type { Event } from "~/shared/models/entity.types";
import {
  getEventPriceLabel,
  isPaidEvent,
} from "~/modules/events/utils/event-price-label";

export function RegistrationPriceLine({ event }: { event: Event }) {
  if (!isPaidEvent(event)) return null;

  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-3 py-2">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Ticket className="h-4 w-4" />
        Ticket price
      </span>
      <span className="text-sm font-semibold">{getEventPriceLabel(event)}</span>
    </div>
  );
}
