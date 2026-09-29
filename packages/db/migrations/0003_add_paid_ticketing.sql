-- Paid ticketing pilot: event price, payment orders, callback audit log.
-- The per-community switch needs no column: it lives in
-- communities.settings.features (key `paid_ticketing`, absent means off).

ALTER TABLE public.events
  ADD COLUMN price_minor integer,
  ADD COLUMN currency text DEFAULT 'AZN' NOT NULL,
  ADD CONSTRAINT events_price_minor_positive
    CHECK (price_minor IS NULL OR price_minor > 0),
  ADD CONSTRAINT events_currency_format
    CHECK (currency ~ '^[A-Z]{3}$');

COMMENT ON COLUMN public.events.price_minor IS
  'Ticket price in minor units (qəpik). NULL means the event is free.';

CREATE TABLE public.ticket_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    community_id uuid NOT NULL,
    event_id uuid NOT NULL,
    registration_id uuid NOT NULL,
    amount_minor integer NOT NULL,
    currency text NOT NULL,
    status text DEFAULT 'pending' NOT NULL,
    payment_url text,
    partner_reference text,
    transaction_id text,
    paid_via text,
    paid_at timestamp with time zone,
    marked_paid_by uuid,
    confirmation_email_sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ticket_orders_pkey PRIMARY KEY (id),
    CONSTRAINT ticket_orders_registration_id_key UNIQUE (registration_id),
    CONSTRAINT ticket_orders_amount_minor_positive CHECK (amount_minor > 0),
    CONSTRAINT ticket_orders_currency_format CHECK (currency ~ '^[A-Z]{3}$'),
    CONSTRAINT ticket_orders_status_check
      CHECK (status IN ('pending', 'paid', 'refunded')),
    CONSTRAINT ticket_orders_paid_via_check
      CHECK (paid_via IS NULL OR paid_via IN ('partner_callback', 'manual')),
    -- A paid or refunded order always says how and when it was paid.
    CONSTRAINT ticket_orders_paid_fields_check
      CHECK (status = 'pending' OR (paid_via IS NOT NULL AND paid_at IS NOT NULL))
);

COMMENT ON TABLE public.ticket_orders IS
  'One payment attempt per paid registration. amount_minor/currency are a snapshot of the event price at purchase time.';
COMMENT ON COLUMN public.ticket_orders.partner_reference IS
  'Checkila paymentId, stored when the payment link is created. The callback must echo it as checkilaRequestId.';
COMMENT ON COLUMN public.ticket_orders.transaction_id IS
  'Epoint transaction id from the callback, for reconciliation. NULL for manual payments.';

-- A Checkila payment and an Epoint transaction can each belong to one order.
CREATE UNIQUE INDEX ticket_orders_partner_reference_key
  ON public.ticket_orders (partner_reference)
  WHERE partner_reference IS NOT NULL;

CREATE UNIQUE INDEX ticket_orders_transaction_id_key
  ON public.ticket_orders (transaction_id)
  WHERE transaction_id IS NOT NULL;

CREATE INDEX ticket_orders_event_id_status_idx
  ON public.ticket_orders (event_id, status);

CREATE INDEX ticket_orders_community_id_status_idx
  ON public.ticket_orders (community_id, status);

-- RESTRICT, never CASCADE: deleting a registration or event must not silently
-- erase payment history. Cancelling an unpaid registration deletes its pending
-- order first, in application code; a paid registration cannot be deleted.
ALTER TABLE ONLY public.ticket_orders
  ADD CONSTRAINT ticket_orders_community_id_fkey
  FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE RESTRICT;

ALTER TABLE ONLY public.ticket_orders
  ADD CONSTRAINT ticket_orders_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE RESTRICT;

ALTER TABLE ONLY public.ticket_orders
  ADD CONSTRAINT ticket_orders_registration_id_fkey
  FOREIGN KEY (registration_id) REFERENCES public.event_registrations(id) ON DELETE RESTRICT;

CREATE TABLE public.payment_callbacks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    received_at timestamp with time zone DEFAULT now() NOT NULL,
    key_id text,
    registration_id uuid,
    payload jsonb NOT NULL,
    outcome text NOT NULL,
    CONSTRAINT payment_callbacks_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.payment_callbacks IS
  'Append-only audit of every payment callback, including rejected ones. registration_id has no foreign key on purpose: forged or stale ids must still be recorded.';

CREATE INDEX payment_callbacks_registration_id_idx
  ON public.payment_callbacks (registration_id, received_at DESC);

-- The one place an order becomes paid. Shared by the partner callback and the
-- admin "mark as paid" action so both reach the same end state atomically.
-- Returns: confirmed | already_paid | not_found | conflict.
CREATE FUNCTION public.confirm_ticket_order(
  p_registration_id uuid,
  p_paid_via text,
  p_transaction_id text,
  p_marked_paid_by uuid
) RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_updated integer;
  v_status text;
BEGIN
  UPDATE public.ticket_orders
  SET status = 'paid',
      paid_via = p_paid_via,
      paid_at = now(),
      transaction_id = p_transaction_id,
      marked_paid_by = p_marked_paid_by,
      updated_at = now()
  WHERE registration_id = p_registration_id AND status = 'pending';
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 1 THEN
    UPDATE public.event_registrations
    SET approval_status = 'approved',
        checkin_token = COALESCE(checkin_token, gen_random_uuid()),
        updated_at = now()
    WHERE id = p_registration_id;
    RETURN 'confirmed';
  END IF;

  SELECT status INTO v_status
  FROM public.ticket_orders
  WHERE registration_id = p_registration_id;

  IF v_status IS NULL THEN RETURN 'not_found'; END IF;
  IF v_status = 'paid' THEN RETURN 'already_paid'; END IF;
  RETURN 'conflict';
END;
$$;

-- Scoping lives in application code, same as people/person_events. Web and
-- integration-api reach these objects with the service-role client only.
ALTER TABLE public.ticket_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_callbacks DISABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.ticket_orders FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.payment_callbacks FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.confirm_ticket_order(uuid, text, text, uuid)
  FROM PUBLIC, anon, authenticated;
