export type EventRevenue = {
  revenueMinor: number;
  paidCount: number;
  pendingCount: number;
  currency: string;
  priced: boolean;
};

export type EventListRevenueRow = {
  revenueMinor: number;
  paidCount: number;
};

export type EventListRevenue = {
  currency: string;
  totalRevenueMinor: number;
  byEventId: Record<string, EventListRevenueRow>;
};
