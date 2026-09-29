import { z } from 'zod';

// Exactly the body Checkila sends. Their `userId` is the registration id we
// passed when creating the payment.
export const PaymentCallbackRequest = z.object({
  userId: z.uuid(),
  status: z.literal('success'),
  amount: z.number().positive(),
  checkilaRequestId: z.string().min(1).max(128),
  transactionId: z.string().min(1).max(128).nullish(),
});
export type PaymentCallbackRequest = z.infer<typeof PaymentCallbackRequest>;

export const TicketOrderRow = z.object({
  id: z.string(),
  registration_id: z.string(),
  community_id: z.string(),
  amount_minor: z.number().int(),
  currency: z.string(),
  status: z.enum(['pending', 'paid', 'refunded']),
  partner_reference: z.string().nullable(),
});
export type TicketOrderRow = z.infer<typeof TicketOrderRow>;

// What confirm_ticket_order() returns.
export const ConfirmTicketOrderResult = z.enum([
  'confirmed',
  'already_paid',
  'not_found',
  'conflict',
]);
export type ConfirmTicketOrderResult = z.infer<typeof ConfirmTicketOrderResult>;

export const PaymentConfirmationResponse = z.object({
  registration_id: z.uuid(),
  status: z.literal('paid'),
});
export type PaymentConfirmationResponse = z.infer<
  typeof PaymentConfirmationResponse
>;
