import { z } from "zod";
import type { RSVPStatus, EventApprovalStatus } from "~/shared/models/entity.types";

export const attenderSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  avatar_url: z.string().nullable(),
  rsvp_status: z.enum(["going", "not_going", "maybe"]),
  approval_status: z.enum(["pending", "approved", "rejected"]).nullable().optional(),
  is_verified: z.boolean(),
  registered_at: z.string().nullable(),
  is_anonymous: z.boolean(),
  custom_answers: z.any().nullable().optional(),
});

export type Attender = z.infer<typeof attenderSchema>;

export const rsvpStatusConfig: Record<
  RSVPStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  going: { label: "Going", variant: "default" },
  not_going: { label: "Not Going", variant: "destructive" },
  maybe: { label: "Maybe", variant: "secondary" },
};

export const approvalStatusConfig: Record<
  EventApprovalStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline" | "warning";
    className?: string;
  }
> = {
  approved: { label: "Approved", variant: "default", className: "bg-green-500 hover:bg-green-600" },
  rejected: { label: "Rejected", variant: "destructive", className: "bg-red-400/50 hover:bg-red-400/60 text-red-800" },
  pending: { label: "Pending", variant: "secondary", className: "bg-amber-500 hover:bg-amber-600 text-white" },
};
