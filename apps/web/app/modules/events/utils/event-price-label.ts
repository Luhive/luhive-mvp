import { formatMoney } from "@luhive/domain/v1/money";

type EventPrice = {
  price_minor: number | null;
  currency: string;
};

export function isPaidEvent(event: EventPrice): event is EventPrice & {
  price_minor: number;
} {
  return event.price_minor !== null && event.price_minor > 0;
}

export function getEventPriceLabel(event: EventPrice): string {
  return isPaidEvent(event)
    ? formatMoney(event.price_minor, event.currency)
    : "Free";
}
