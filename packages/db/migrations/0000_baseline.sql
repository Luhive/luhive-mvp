-- Squashed baseline: production's public schema as of Stage 0 task #8.
-- A fixed snapshot from pg_dump --schema-only. Do not regenerate it; schema
-- changes belong in a new migration beside this file.
-- Pre-baseline history is kept, unexecuted, in migrations/archive/.
-- Supabase-managed objects are excluded; see migrations/README.md.

--
-- PostgreSQL database dump
--

--
-- Name: event_approval_statuses; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.event_approval_statuses AS ENUM (
    'pending',
    'approved',
    'rejected'
);

--
-- Name: event_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.event_status AS ENUM (
    'draft',
    'published',
    'cancelled'
);

--
-- Name: event_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.event_type AS ENUM (
    'in-person',
    'online',
    'hybrid'
);

--
-- Name: reminder_time; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.reminder_time AS ENUM (
    '1-hour',
    '3-hours',
    '1-day',
    '5-hours',
    '3-days',
    '5-days'
);

--
-- Name: rsvp_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.rsvp_status AS ENUM (
    'going',
    'not_going',
    'maybe'
);

--
-- Name: get_user_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_role(p_community_id uuid) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role
  INTO v_role
  FROM public.community_members
  WHERE user_id = auth.uid()
    AND community_id = p_community_id;

  RETURN v_role; -- This will be NULL if no row is found
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

--
-- Name: set_community_announcement_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_community_announcement_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

--
-- Name: slugify_event_title(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.slugify_event_title(title text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $_$
DECLARE
  s text;
  base_slug text;
BEGIN
  s := trim(title);

  IF s IS NULL OR s = '' THEN
    RETURN NULL;
  END IF;

  s := replace(s, 'İ', 'i');
  s := replace(s, 'I', 'ı');
  s := lower(s);
  s := translate(s, 'əğıöüşç', 'egiousc');

  base_slug := regexp_replace(
    regexp_replace(s, '[^a-z0-9]+', '-', 'g'),
    '(^-+|-+$)',
    '',
    'g'
  );
  base_slug := left(base_slug, 60);

  IF base_slug IS NULL OR base_slug = '' THEN
    RETURN NULL;
  END IF;

  IF base_slug IN ('events', 'announcements') THEN
    base_slug := base_slug || '-event';
  END IF;

  RETURN base_slug;
END;
$_$;

--
-- Name: update_event_collaborations_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_event_collaborations_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

--
-- Name: update_google_forms_tokens_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_google_forms_tokens_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

--
-- Name: announcement_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcement_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    announcement_id uuid NOT NULL,
    user_id uuid,
    view_source text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    session_id text,
    CONSTRAINT announcement_views_view_source_check CHECK ((view_source = ANY (ARRAY['email'::text, 'web'::text])))
);

--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    community_id uuid,
    name text NOT NULL,
    key_id text NOT NULL,
    key_hash text NOT NULL,
    key_type text NOT NULL,
    key_kind text DEFAULT 'community'::text NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    allowed_origins text[] DEFAULT '{}'::text[] NOT NULL,
    last_used_at timestamp with time zone,
    expires_at timestamp with time zone,
    revoked_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT api_keys_community_scope CHECK ((((key_kind = 'community'::text) AND (community_id IS NOT NULL)) OR ((key_kind = 'partner'::text) AND (community_id IS NULL)))),
    CONSTRAINT api_keys_key_kind_check CHECK ((key_kind = ANY (ARRAY['community'::text, 'partner'::text]))),
    CONSTRAINT api_keys_key_type_check CHECK ((key_type = ANY (ARRAY['publishable'::text, 'secret'::text])))
);

--
-- Name: communities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.communities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text,
    logo_url text,
    verified boolean DEFAULT false,
    parent_community_id uuid,
    created_by uuid NOT NULL,
    page_config jsonb DEFAULT '{"theme": {"primaryColor": "#4285F4", "secondaryColor": "#34A853"}, "layout": "bento", "sections": []}'::jsonb,
    settings jsonb DEFAULT '{"features": {"requireApproval": false, "allowMemberPosts": true}, "integrations": {}, "notifications": {"newMember": true, "eventReminders": true}}'::jsonb,
    stats jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    tagline text,
    social_links jsonb,
    cover_url text,
    is_show boolean DEFAULT true NOT NULL,
    CONSTRAINT communities_is_show_check CHECK ((is_show = ANY (ARRAY[true, false])))
);

--
-- Name: COLUMN communities.is_show; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.communities.is_show IS 'for front to show community on hub or not';

--
-- Name: community_announcement_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_announcement_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    announcement_id uuid NOT NULL,
    image_url text NOT NULL,
    storage_path text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: community_announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_announcements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    community_id uuid NOT NULL,
    created_by uuid NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    published boolean DEFAULT true NOT NULL,
    email_sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT community_announcements_description_check CHECK (((char_length(description) >= 1) AND (char_length(description) <= 5000))),
    CONSTRAINT community_announcements_title_check CHECK (((char_length(title) >= 1) AND (char_length(title) <= 180)))
);

--
-- Name: community_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    community_id uuid,
    user_id uuid,
    role text DEFAULT 'member'::text,
    custom_title text,
    metadata jsonb DEFAULT '{}'::jsonb,
    joined_at timestamp without time zone DEFAULT now(),
    email_opt_out boolean DEFAULT false NOT NULL,
    notify_registrations boolean DEFAULT true NOT NULL,
    CONSTRAINT community_members_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text, 'moderator'::text, 'member'::text])))
);

--
-- Name: community_visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_visits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    community_id uuid,
    session_id text NOT NULL,
    user_id uuid,
    visited_at timestamp without time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
);

--
-- Name: event_collaborations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_collaborations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    community_id uuid NOT NULL,
    role text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    invited_by uuid NOT NULL,
    invited_at timestamp with time zone DEFAULT now() NOT NULL,
    accepted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT event_collaborations_role_check CHECK ((role = ANY (ARRAY['host'::text, 'co-host'::text]))),
    CONSTRAINT event_collaborations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])))
);

--
-- Name: event_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_registrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    user_id uuid,
    anonymous_email text,
    anonymous_name text,
    anonymous_phone text,
    rsvp_status public.rsvp_status DEFAULT 'going'::public.rsvp_status NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    registered_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    verification_token text,
    token_expires_at timestamp with time zone,
    approval_status public.event_approval_statuses,
    custom_answers jsonb DEFAULT '{}'::jsonb,
    registration_source_community_id uuid,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_content text,
    utm_term text,
    registration_session_id text,
    registration_country text,
    registration_city text,
    time_to_register_seconds integer,
    registration_ip text,
    checkin_token uuid,
    is_attended boolean DEFAULT false NOT NULL,
    attended_at timestamp with time zone,
    invited_by_user_id uuid,
    registration_type text DEFAULT 'self'::text NOT NULL,
    CONSTRAINT chk_registration_identity CHECK (((user_id IS NOT NULL) OR ((user_id IS NULL) AND (anonymous_email IS NOT NULL)))),
    CONSTRAINT event_registrations_registration_type_check CHECK ((registration_type = ANY (ARRAY['self'::text, 'invited'::text])))
);

--
-- Name: COLUMN event_registrations.custom_answers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_registrations.custom_answers IS 'Stores user answers to custom questions';

--
-- Name: event_reminders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_reminders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    reminder_times public.reminder_time[] DEFAULT ARRAY[]::public.reminder_time[] NOT NULL,
    custom_message text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

--
-- Name: event_visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_visits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    community_id uuid NOT NULL,
    user_id uuid,
    session_id text NOT NULL,
    visited_at timestamp with time zone DEFAULT now() NOT NULL,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_content text,
    utm_term text,
    referrer_url text,
    referrer_domain text,
    country text,
    city text,
    region text,
    timezone text,
    device_type text,
    browser text,
    os text,
    is_mobile boolean,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    ip text
);

--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    community_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    event_type public.event_type NOT NULL,
    location_address text,
    online_meeting_link text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone,
    timezone text NOT NULL,
    capacity integer,
    registration_deadline timestamp with time zone,
    status public.event_status DEFAULT 'draft'::public.event_status NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    cover_url text,
    slug text NOT NULL,
    discussion_link text,
    is_approve_required boolean DEFAULT false NOT NULL,
    custom_questions jsonb DEFAULT '{"phone": {"enabled": false, "required": false}, "custom": []}'::jsonb,
    registration_type text DEFAULT 'native'::text,
    external_registration_url text,
    external_platform text,
    external_registration_count integer DEFAULT 0,
    location_name text,
    location_lat double precision,
    location_lng double precision,
    location_place_id text,
    CONSTRAINT events_capacity_check CHECK ((capacity > 0)),
    CONSTRAINT events_external_platform_check CHECK ((external_platform = ANY (ARRAY['google_forms'::text, 'microsoft_forms'::text, 'luma'::text, 'eventbrite'::text, 'other'::text]))),
    CONSTRAINT events_registration_type_check CHECK ((registration_type = ANY (ARRAY['native'::text, 'external'::text, 'both'::text])))
);

--
-- Name: COLUMN events.location_address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.events.location_address IS 'Formatted address from Google Places';

--
-- Name: COLUMN events.slug; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.events.slug IS 'URL-friendly slug for public event pages';

--
-- Name: COLUMN events.custom_questions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.events.custom_questions IS 'Stores custom registration questions configuration';

--
-- Name: COLUMN events.registration_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.events.registration_type IS 'Where users can register: native (Luhive), external (Google Forms etc), or both';

--
-- Name: COLUMN events.external_registration_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.events.external_registration_url IS 'URL to external registration form';

--
-- Name: COLUMN events.external_platform; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.events.external_platform IS 'Which external platform is used';

--
-- Name: COLUMN events.external_registration_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.events.external_registration_count IS 'Manually tracked registration count from external platform';

--
-- Name: COLUMN events.location_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.events.location_name IS 'Venue or place name from Google Places';

--
-- Name: COLUMN events.location_lat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.events.location_lat IS 'Latitude from Google Places';

--
-- Name: COLUMN events.location_lng; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.events.location_lng IS 'Longitude from Google Places';

--
-- Name: COLUMN events.location_place_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.events.location_place_id IS 'Google Place ID for deep links and embed';

--
-- Name: google_forms_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.google_forms_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    access_token text NOT NULL,
    refresh_token text,
    token_type text DEFAULT 'Bearer'::text,
    expiry_date timestamp with time zone,
    scope text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    avatar_url text,
    bio text,
    gamification jsonb DEFAULT '{"level": 1, "badges": [], "points": 0, "streaks": {"current": 0, "longest": 0}}'::jsonb,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
);

--
-- Name: sent_reminders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sent_reminders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    registration_id uuid NOT NULL,
    reminder_time public.reminder_time NOT NULL,
    sent_at timestamp with time zone DEFAULT now(),
    recipient_email text NOT NULL
);

--
-- Name: telegram_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.telegram_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    telegram_id bigint NOT NULL,
    user_id uuid NOT NULL,
    chat_id bigint NOT NULL,
    username text,
    created_at timestamp with time zone DEFAULT now()
);

--
-- Name: announcement_views announcement_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcement_views
    ADD CONSTRAINT announcement_views_pkey PRIMARY KEY (id);

--
-- Name: api_keys api_keys_key_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_key_id_key UNIQUE (key_id);

--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);

--
-- Name: communities communities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_pkey PRIMARY KEY (id);

--
-- Name: communities communities_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_slug_key UNIQUE (slug);

--
-- Name: community_announcement_images community_announcement_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_announcement_images
    ADD CONSTRAINT community_announcement_images_pkey PRIMARY KEY (id);

--
-- Name: community_announcements community_announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_announcements
    ADD CONSTRAINT community_announcements_pkey PRIMARY KEY (id);

--
-- Name: community_members community_members_community_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_members
    ADD CONSTRAINT community_members_community_id_user_id_key UNIQUE (community_id, user_id);

--
-- Name: community_members community_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_members
    ADD CONSTRAINT community_members_pkey PRIMARY KEY (id);

--
-- Name: community_visits community_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_visits
    ADD CONSTRAINT community_visits_pkey PRIMARY KEY (id);

--
-- Name: event_collaborations event_collaborations_event_id_community_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_collaborations
    ADD CONSTRAINT event_collaborations_event_id_community_id_key UNIQUE (event_id, community_id);

--
-- Name: event_collaborations event_collaborations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_collaborations
    ADD CONSTRAINT event_collaborations_pkey PRIMARY KEY (id);

--
-- Name: event_registrations event_registrations_checkin_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_checkin_token_key UNIQUE (checkin_token);

--
-- Name: event_registrations event_registrations_event_id_anonymous_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_event_id_anonymous_email_key UNIQUE (event_id, anonymous_email);

--
-- Name: event_registrations event_registrations_event_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_event_id_user_id_key UNIQUE (event_id, user_id);

--
-- Name: event_registrations event_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_pkey PRIMARY KEY (id);

--
-- Name: event_reminders event_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_reminders
    ADD CONSTRAINT event_reminders_pkey PRIMARY KEY (id);

--
-- Name: event_visits event_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_visits
    ADD CONSTRAINT event_visits_pkey PRIMARY KEY (id);

--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);

--
-- Name: events events_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_slug_key UNIQUE (slug);

--
-- Name: google_forms_tokens google_forms_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_forms_tokens
    ADD CONSTRAINT google_forms_tokens_pkey PRIMARY KEY (id);

--
-- Name: google_forms_tokens google_forms_tokens_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_forms_tokens
    ADD CONSTRAINT google_forms_tokens_user_id_key UNIQUE (user_id);

--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

--
-- Name: sent_reminders sent_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sent_reminders
    ADD CONSTRAINT sent_reminders_pkey PRIMARY KEY (id);

--
-- Name: telegram_users telegram_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_users
    ADD CONSTRAINT telegram_users_pkey PRIMARY KEY (id);

--
-- Name: telegram_users telegram_users_telegram_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_users
    ADD CONSTRAINT telegram_users_telegram_id_key UNIQUE (telegram_id);

--
-- Name: event_reminders unique_event_reminders; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_reminders
    ADD CONSTRAINT unique_event_reminders UNIQUE (event_id);

--
-- Name: sent_reminders unique_sent_reminder; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sent_reminders
    ADD CONSTRAINT unique_sent_reminder UNIQUE (registration_id, reminder_time);

--
-- Name: event_registrations_invited_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX event_registrations_invited_by_idx ON public.event_registrations USING btree (invited_by_user_id);

--
-- Name: events_community_id_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX events_community_id_slug_key ON public.events USING btree (community_id, slug);

--
-- Name: idx_announcement_images_announcement_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcement_images_announcement_order ON public.community_announcement_images USING btree (announcement_id, sort_order);

--
-- Name: idx_announcement_views_announcement_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcement_views_announcement_created ON public.announcement_views USING btree (announcement_id, created_at);

--
-- Name: idx_announcement_views_announcement_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcement_views_announcement_id ON public.announcement_views USING btree (announcement_id);

--
-- Name: idx_announcement_views_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcement_views_session ON public.announcement_views USING btree (announcement_id, session_id) WHERE (session_id IS NOT NULL);

--
-- Name: idx_announcement_views_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcement_views_source ON public.announcement_views USING btree (announcement_id, view_source);

--
-- Name: idx_announcements_community_published_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcements_community_published_created_at ON public.community_announcements USING btree (community_id, published, created_at DESC);

--
-- Name: idx_api_keys_community; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_keys_community ON public.api_keys USING btree (community_id);

--
-- Name: idx_api_keys_key_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_keys_key_id ON public.api_keys USING btree (key_id);

--
-- Name: idx_communities_creator; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_communities_creator ON public.communities USING btree (created_by);

--
-- Name: idx_communities_page_config; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_communities_page_config ON public.communities USING gin (page_config);

--
-- Name: idx_communities_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_communities_parent ON public.communities USING btree (parent_community_id);

--
-- Name: idx_communities_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_communities_slug ON public.communities USING btree (slug);

--
-- Name: idx_communities_verified; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_communities_verified ON public.communities USING btree (verified) WHERE (verified = true);

--
-- Name: idx_event_collaborations_community_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_collaborations_community_id ON public.event_collaborations USING btree (community_id);

--
-- Name: idx_event_collaborations_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_collaborations_event_id ON public.event_collaborations USING btree (event_id);

--
-- Name: idx_event_collaborations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_collaborations_status ON public.event_collaborations USING btree (status);

--
-- Name: idx_event_registrations_checkin_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_registrations_checkin_token ON public.event_registrations USING btree (checkin_token) WHERE (checkin_token IS NOT NULL);

--
-- Name: idx_event_registrations_custom_answers; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_registrations_custom_answers ON public.event_registrations USING gin (custom_answers);

--
-- Name: idx_event_registrations_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_registrations_event_id ON public.event_registrations USING btree (event_id);

--
-- Name: idx_event_registrations_event_registered_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_registrations_event_registered_at ON public.event_registrations USING btree (event_id, registered_at DESC);

--
-- Name: idx_event_registrations_event_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_registrations_event_session ON public.event_registrations USING btree (event_id, registration_session_id);

--
-- Name: idx_event_registrations_event_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_registrations_event_source ON public.event_registrations USING btree (event_id, utm_source);

--
-- Name: idx_event_registrations_source_community; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_registrations_source_community ON public.event_registrations USING btree (registration_source_community_id);

--
-- Name: idx_event_registrations_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_registrations_user_id ON public.event_registrations USING btree (user_id);

--
-- Name: idx_event_reminders_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_reminders_event_id ON public.event_reminders USING btree (event_id);

--
-- Name: idx_event_visits_event_country_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_visits_event_country_city ON public.event_visits USING btree (event_id, country, city);

--
-- Name: idx_event_visits_event_ip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_visits_event_ip ON public.event_visits USING btree (event_id, ip);

--
-- Name: idx_event_visits_event_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_visits_event_session ON public.event_visits USING btree (event_id, session_id);

--
-- Name: idx_event_visits_event_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_visits_event_source ON public.event_visits USING btree (event_id, utm_source);

--
-- Name: idx_event_visits_event_visited_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_visits_event_visited_at ON public.event_visits USING btree (event_id, visited_at DESC);

--
-- Name: idx_events_community_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_community_id ON public.events USING btree (community_id);

--
-- Name: idx_events_custom_questions; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_custom_questions ON public.events USING gin (custom_questions);

--
-- Name: idx_events_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_slug ON public.events USING btree (slug);

--
-- Name: idx_events_start_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_start_time ON public.events USING btree (start_time);

--
-- Name: idx_events_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_status ON public.events USING btree (status);

--
-- Name: idx_google_forms_tokens_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_google_forms_tokens_user_id ON public.google_forms_tokens USING btree (user_id);

--
-- Name: idx_members_community; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_members_community ON public.community_members USING btree (community_id);

--
-- Name: idx_members_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_members_role ON public.community_members USING btree (community_id, role);

--
-- Name: idx_members_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_members_user ON public.community_members USING btree (user_id);

--
-- Name: idx_sent_reminders_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sent_reminders_event_id ON public.sent_reminders USING btree (event_id);

--
-- Name: idx_sent_reminders_sent_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sent_reminders_sent_at ON public.sent_reminders USING btree (sent_at);

--
-- Name: idx_telegram_users_telegram_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_telegram_users_telegram_id ON public.telegram_users USING btree (telegram_id);

--
-- Name: idx_telegram_users_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_telegram_users_user_id ON public.telegram_users USING btree (user_id);

--
-- Name: idx_visits_community; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visits_community ON public.community_visits USING btree (community_id, visited_at DESC);

--
-- Name: idx_visits_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visits_session ON public.community_visits USING btree (session_id);

--
-- Name: community_announcements trg_set_community_announcement_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_set_community_announcement_updated_at BEFORE UPDATE ON public.community_announcements FOR EACH ROW EXECUTE FUNCTION public.set_community_announcement_updated_at();

--
-- Name: event_collaborations trigger_update_event_collaborations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_event_collaborations_updated_at BEFORE UPDATE ON public.event_collaborations FOR EACH ROW EXECUTE FUNCTION public.update_event_collaborations_updated_at();

--
-- Name: google_forms_tokens trigger_update_google_forms_tokens_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_google_forms_tokens_updated_at BEFORE UPDATE ON public.google_forms_tokens FOR EACH ROW EXECUTE FUNCTION public.update_google_forms_tokens_updated_at();

--
-- Name: announcement_views announcement_views_announcement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcement_views
    ADD CONSTRAINT announcement_views_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES public.community_announcements(id) ON DELETE CASCADE;

--
-- Name: announcement_views announcement_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcement_views
    ADD CONSTRAINT announcement_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

--
-- Name: api_keys api_keys_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;

--
-- Name: api_keys api_keys_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

--
-- Name: communities communities_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

--
-- Name: communities communities_parent_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_parent_community_id_fkey FOREIGN KEY (parent_community_id) REFERENCES public.communities(id) ON DELETE CASCADE;

--
-- Name: community_announcement_images community_announcement_images_announcement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_announcement_images
    ADD CONSTRAINT community_announcement_images_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES public.community_announcements(id) ON DELETE CASCADE;

--
-- Name: community_announcements community_announcements_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_announcements
    ADD CONSTRAINT community_announcements_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;

--
-- Name: community_announcements community_announcements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_announcements
    ADD CONSTRAINT community_announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

--
-- Name: community_members community_members_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_members
    ADD CONSTRAINT community_members_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;

--
-- Name: community_members community_members_user_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_members
    ADD CONSTRAINT community_members_user_id_fkey1 FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: community_visits community_visits_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_visits
    ADD CONSTRAINT community_visits_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;

--
-- Name: community_visits community_visits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_visits
    ADD CONSTRAINT community_visits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: event_collaborations event_collaborations_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_collaborations
    ADD CONSTRAINT event_collaborations_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;

--
-- Name: event_collaborations event_collaborations_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_collaborations
    ADD CONSTRAINT event_collaborations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: event_collaborations event_collaborations_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_collaborations
    ADD CONSTRAINT event_collaborations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id);

--
-- Name: event_registrations event_registrations_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

--
-- Name: event_registrations event_registrations_invited_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_invited_by_user_id_fkey FOREIGN KEY (invited_by_user_id) REFERENCES public.profiles(id);

--
-- Name: event_registrations event_registrations_registration_source_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_registration_source_community_id_fkey FOREIGN KEY (registration_source_community_id) REFERENCES public.communities(id);

--
-- Name: event_registrations event_registrations_user_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_user_id_fkey1 FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: event_reminders event_reminders_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_reminders
    ADD CONSTRAINT event_reminders_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

--
-- Name: event_visits event_visits_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_visits
    ADD CONSTRAINT event_visits_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;

--
-- Name: event_visits event_visits_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_visits
    ADD CONSTRAINT event_visits_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

--
-- Name: event_visits event_visits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_visits
    ADD CONSTRAINT event_visits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

--
-- Name: events events_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id);

--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

--
-- Name: google_forms_tokens google_forms_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_forms_tokens
    ADD CONSTRAINT google_forms_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: sent_reminders sent_reminders_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sent_reminders
    ADD CONSTRAINT sent_reminders_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

--
-- Name: sent_reminders sent_reminders_registration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sent_reminders
    ADD CONSTRAINT sent_reminders_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.event_registrations(id) ON DELETE CASCADE;

--
-- Name: telegram_users telegram_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_users
    ADD CONSTRAINT telegram_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

--
-- Name: community_members Admins can delete memberships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete memberships" ON public.community_members FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.community_members cm
  WHERE ((cm.community_id = community_members.community_id) AND (cm.user_id = auth.uid()) AND (cm.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));

--
-- Name: community_members Admins can update memberships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update memberships" ON public.community_members FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.community_members cm
  WHERE ((cm.community_id = community_members.community_id) AND (cm.user_id = auth.uid()) AND (cm.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));

--
-- Name: events Allow admins or creator to delete events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow admins or creator to delete events" ON public.events FOR DELETE USING (((created_by = auth.uid()) OR (public.get_user_role(community_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'moderator'::text]))));

--
-- Name: events Allow admins or creator to update events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow admins or creator to update events" ON public.events FOR UPDATE USING (((created_by = auth.uid()) OR (public.get_user_role(community_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'moderator'::text])))) WITH CHECK (((created_by = auth.uid()) OR (public.get_user_role(community_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'moderator'::text]))));

--
-- Name: events Allow admins to create events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow admins to create events" ON public.events FOR INSERT WITH CHECK ((public.get_user_role(community_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'moderator'::text])));

--
-- Name: event_registrations Allow community admins to see all registrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow community admins to see all registrations" ON public.event_registrations FOR SELECT USING (((public.get_user_role(( SELECT events.community_id
   FROM public.events
  WHERE (events.id = event_registrations.event_id))) = ANY (ARRAY['owner'::text, 'admin'::text, 'moderator'::text])) OR (EXISTS ( SELECT 1
   FROM public.events e
  WHERE ((e.id = event_registrations.event_id) AND (e.created_by = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (public.event_collaborations ec
     JOIN public.community_members cm ON ((cm.community_id = ec.community_id)))
  WHERE ((ec.event_id = event_registrations.event_id) AND (cm.user_id = auth.uid()) AND (cm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'moderator'::text])))))));

--
-- Name: events Allow members to see draft events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow members to see draft events" ON public.events FOR SELECT USING ((public.get_user_role(community_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'moderator'::text])));

--
-- Name: events Allow public read access for published events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access for published events" ON public.events FOR SELECT USING ((status = 'published'::public.event_status));

--
-- Name: event_registrations Allow user or admin to delete registration; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow user or admin to delete registration" ON public.event_registrations FOR DELETE USING (((user_id = auth.uid()) OR (public.get_user_role(( SELECT events.community_id
   FROM public.events
  WHERE (events.id = event_registrations.event_id))) = ANY (ARRAY['owner'::text, 'admin'::text, 'moderator'::text]))));

--
-- Name: event_registrations Allow user or admin to update registration; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow user or admin to update registration" ON public.event_registrations FOR UPDATE USING (((user_id = auth.uid()) OR (public.get_user_role(( SELECT events.community_id
   FROM public.events
  WHERE (events.id = event_registrations.event_id))) = ANY (ARRAY['owner'::text, 'admin'::text, 'moderator'::text])))) WITH CHECK (((user_id = auth.uid()) OR (public.get_user_role(( SELECT events.community_id
   FROM public.events
  WHERE (events.id = event_registrations.event_id))) = ANY (ARRAY['owner'::text, 'admin'::text, 'moderator'::text]))));

--
-- Name: event_registrations Allow user to see their own registration; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow user to see their own registration" ON public.event_registrations FOR SELECT USING ((user_id = auth.uid()));

--
-- Name: event_registrations Allow users to register; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow users to register" ON public.event_registrations FOR INSERT WITH CHECK ((((auth.role() = 'authenticated'::text) AND (user_id = auth.uid())) OR ((auth.role() = 'anon'::text) AND (user_id IS NULL))));

--
-- Name: announcement_views Anonymous views with session id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anonymous views with session id" ON public.announcement_views FOR INSERT WITH CHECK (((user_id IS NULL) AND (session_id IS NOT NULL)));

--
-- Name: event_visits Anyone can insert event visits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert event visits" ON public.event_visits FOR INSERT WITH CHECK (((session_id IS NOT NULL) AND (char_length(session_id) > 0) AND ((user_id IS NULL) OR (user_id = auth.uid())) AND (EXISTS ( SELECT 1
   FROM public.events e
  WHERE (e.id = event_visits.event_id))) AND (EXISTS ( SELECT 1
   FROM public.communities c
  WHERE (c.id = event_visits.community_id)))));

--
-- Name: announcement_views Anyone can read announcement view stats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read announcement view stats" ON public.announcement_views FOR SELECT USING (true);

--
-- Name: community_visits Anyone can track visits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can track visits" ON public.community_visits FOR INSERT WITH CHECK (true);

--
-- Name: communities Authenticated users can create communities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create communities" ON public.communities FOR INSERT WITH CHECK ((created_by = auth.uid()));

--
-- Name: announcement_views Authenticated users can insert their own announcement views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert their own announcement views" ON public.announcement_views FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (user_id IS NOT NULL)));

--
-- Name: communities Communities are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Communities are viewable by everyone" ON public.communities FOR SELECT USING (true);

--
-- Name: community_visits Community admins can view community visits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Community admins can view community visits" ON public.community_visits FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.communities c
  WHERE ((c.id = community_visits.community_id) AND (c.created_by = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.community_members cm
  WHERE ((cm.community_id = community_visits.community_id) AND (cm.user_id = auth.uid()) AND (cm.role = ANY (ARRAY['owner'::text, 'admin'::text])))))));

--
-- Name: event_visits Community admins can view event visits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Community admins can view event visits" ON public.event_visits FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.communities c
  WHERE ((c.id = event_visits.community_id) AND (c.created_by = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.community_members cm
  WHERE ((cm.community_id = event_visits.community_id) AND (cm.user_id = auth.uid()) AND (cm.role = ANY (ARRAY['owner'::text, 'admin'::text]))))) OR (EXISTS ( SELECT 1
   FROM public.event_collaborations ec
  WHERE ((ec.event_id = event_visits.event_id) AND (ec.community_id = event_visits.community_id) AND (EXISTS ( SELECT 1
           FROM public.community_members cm
          WHERE ((cm.community_id = ec.community_id) AND (cm.user_id = auth.uid()) AND (cm.role = ANY (ARRAY['owner'::text, 'admin'::text]))))))))));

--
-- Name: communities Community members with roles can update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Community members with roles can update" ON public.communities FOR UPDATE USING (((created_by = auth.uid()) OR (public.get_user_role(id) = ANY (ARRAY['owner'::text, 'admin'::text, 'moderator'::text]))));

--
-- Name: community_announcement_images Community owner/admin can delete announcement images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Community owner/admin can delete announcement images" ON public.community_announcement_images FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ((public.community_announcements ca
     JOIN public.communities c ON ((c.id = ca.community_id)))
     LEFT JOIN public.community_members cm ON (((cm.community_id = c.id) AND (cm.user_id = auth.uid()))))
  WHERE ((ca.id = community_announcement_images.announcement_id) AND ((c.created_by = auth.uid()) OR (cm.role = ANY (ARRAY['owner'::text, 'admin'::text])))))));

--
-- Name: community_announcements Community owner/admin can delete announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Community owner/admin can delete announcements" ON public.community_announcements FOR DELETE USING ((EXISTS ( SELECT 1
   FROM (public.communities c
     LEFT JOIN public.community_members cm ON (((cm.community_id = c.id) AND (cm.user_id = auth.uid()))))
  WHERE ((c.id = community_announcements.community_id) AND ((c.created_by = auth.uid()) OR (cm.role = ANY (ARRAY['owner'::text, 'admin'::text])))))));

--
-- Name: community_announcement_images Community owner/admin can insert announcement images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Community owner/admin can insert announcement images" ON public.community_announcement_images FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ((public.community_announcements ca
     JOIN public.communities c ON ((c.id = ca.community_id)))
     LEFT JOIN public.community_members cm ON (((cm.community_id = c.id) AND (cm.user_id = auth.uid()))))
  WHERE ((ca.id = community_announcement_images.announcement_id) AND ((c.created_by = auth.uid()) OR (cm.role = ANY (ARRAY['owner'::text, 'admin'::text])))))));

--
-- Name: community_announcements Community owner/admin can insert announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Community owner/admin can insert announcements" ON public.community_announcements FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.communities c
     LEFT JOIN public.community_members cm ON (((cm.community_id = c.id) AND (cm.user_id = auth.uid()))))
  WHERE ((c.id = community_announcements.community_id) AND ((c.created_by = auth.uid()) OR (cm.role = ANY (ARRAY['owner'::text, 'admin'::text])))))));

--
-- Name: community_announcement_images Community owner/admin can update announcement images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Community owner/admin can update announcement images" ON public.community_announcement_images FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ((public.community_announcements ca
     JOIN public.communities c ON ((c.id = ca.community_id)))
     LEFT JOIN public.community_members cm ON (((cm.community_id = c.id) AND (cm.user_id = auth.uid()))))
  WHERE ((ca.id = community_announcement_images.announcement_id) AND ((c.created_by = auth.uid()) OR (cm.role = ANY (ARRAY['owner'::text, 'admin'::text]))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ((public.community_announcements ca
     JOIN public.communities c ON ((c.id = ca.community_id)))
     LEFT JOIN public.community_members cm ON (((cm.community_id = c.id) AND (cm.user_id = auth.uid()))))
  WHERE ((ca.id = community_announcement_images.announcement_id) AND ((c.created_by = auth.uid()) OR (cm.role = ANY (ARRAY['owner'::text, 'admin'::text])))))));

--
-- Name: community_announcements Community owner/admin can update announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Community owner/admin can update announcements" ON public.community_announcements FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (public.communities c
     LEFT JOIN public.community_members cm ON (((cm.community_id = c.id) AND (cm.user_id = auth.uid()))))
  WHERE ((c.id = community_announcements.community_id) AND ((c.created_by = auth.uid()) OR (cm.role = ANY (ARRAY['owner'::text, 'admin'::text]))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.communities c
     LEFT JOIN public.community_members cm ON (((cm.community_id = c.id) AND (cm.user_id = auth.uid()))))
  WHERE ((c.id = community_announcements.community_id) AND ((c.created_by = auth.uid()) OR (cm.role = ANY (ARRAY['owner'::text, 'admin'::text])))))));

--
-- Name: event_collaborations Community owners can invite collaborations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Community owners can invite collaborations" ON public.event_collaborations FOR INSERT WITH CHECK (((invited_by = auth.uid()) AND ((EXISTS ( SELECT 1
   FROM (public.events e
     JOIN public.community_members cm ON ((cm.community_id = e.community_id)))
  WHERE ((e.id = event_collaborations.event_id) AND (cm.user_id = auth.uid()) AND (cm.role = ANY (ARRAY['owner'::text, 'admin'::text]))))) OR (EXISTS ( SELECT 1
   FROM (public.events e
     JOIN public.communities c ON ((c.id = e.community_id)))
  WHERE ((e.id = event_collaborations.event_id) AND (c.created_by = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.events e
  WHERE ((e.id = event_collaborations.event_id) AND (e.created_by = auth.uid())))))));

--
-- Name: event_collaborations Community owners can update their collaborations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Community owners can update their collaborations" ON public.event_collaborations FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM public.community_members cm
  WHERE ((cm.community_id = event_collaborations.community_id) AND (cm.user_id = auth.uid()) AND (cm.role = ANY (ARRAY['owner'::text, 'admin'::text]))))) OR (EXISTS ( SELECT 1
   FROM public.communities c
  WHERE ((c.id = event_collaborations.community_id) AND (c.created_by = auth.uid())))))) WITH CHECK (((EXISTS ( SELECT 1
   FROM public.community_members cm
  WHERE ((cm.community_id = event_collaborations.community_id) AND (cm.user_id = auth.uid()) AND (cm.role = ANY (ARRAY['owner'::text, 'admin'::text]))))) OR (EXISTS ( SELECT 1
   FROM public.communities c
  WHERE ((c.id = event_collaborations.community_id) AND (c.created_by = auth.uid()))))));

--
-- Name: event_reminders Host communities can insert reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Host communities can insert reminders" ON public.event_reminders FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.event_collaborations ec
  WHERE ((ec.event_id = event_reminders.event_id) AND (ec.role = 'host'::text) AND (ec.status = 'accepted'::text) AND (ec.community_id IN ( SELECT cm.id
           FROM public.community_members cm
          WHERE (cm.user_id = auth.uid())))))));

--
-- Name: event_reminders Host communities can update reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Host communities can update reminders" ON public.event_reminders FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.event_collaborations ec
  WHERE ((ec.event_id = event_reminders.event_id) AND (ec.role = 'host'::text) AND (ec.status = 'accepted'::text) AND (ec.community_id IN ( SELECT cm.id
           FROM public.community_members cm
          WHERE (cm.user_id = auth.uid())))))));

--
-- Name: event_collaborations Host community can remove collaborations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Host community can remove collaborations" ON public.event_collaborations FOR DELETE USING (((EXISTS ( SELECT 1
   FROM (public.events e
     JOIN public.community_members cm ON ((cm.community_id = e.community_id)))
  WHERE ((e.id = event_collaborations.event_id) AND (cm.user_id = auth.uid()) AND (cm.role = ANY (ARRAY['owner'::text, 'admin'::text]))))) OR (EXISTS ( SELECT 1
   FROM (public.events e
     JOIN public.communities c ON ((c.id = e.community_id)))
  WHERE ((e.id = event_collaborations.event_id) AND (c.created_by = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.events e
  WHERE ((e.id = event_collaborations.event_id) AND (e.created_by = auth.uid()))))));

--
-- Name: community_members Memberships are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Memberships are viewable by everyone" ON public.community_members FOR SELECT USING (true);

--
-- Name: profiles Profiles are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

--
-- Name: community_announcement_images Public can view announcement images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view announcement images" ON public.community_announcement_images FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.community_announcements ca
  WHERE ((ca.id = community_announcement_images.announcement_id) AND (ca.published = true)))));

--
-- Name: event_collaborations Public can view collaborations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view collaborations" ON public.event_collaborations FOR SELECT USING (true);

--
-- Name: community_announcements Public can view published announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view published announcements" ON public.community_announcements FOR SELECT USING ((published = true));

--
-- Name: announcement_views Service role can insert email views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert email views" ON public.announcement_views FOR INSERT WITH CHECK ((( SELECT count(*) AS count
   FROM public.community_announcements
  WHERE (community_announcements.id = announcement_views.announcement_id)) > 0));

--
-- Name: sent_reminders Service role can insert sent reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert sent reminders" ON public.sent_reminders FOR INSERT WITH CHECK ((auth.role() = 'service_role'::text));

--
-- Name: telegram_users Service role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access" ON public.telegram_users USING (true) WITH CHECK (true);

--
-- Name: profiles Users can create profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create profile" ON public.profiles FOR INSERT WITH CHECK (true);

--
-- Name: google_forms_tokens Users can delete their own tokens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own tokens" ON public.google_forms_tokens FOR DELETE USING ((auth.uid() = user_id));

--
-- Name: google_forms_tokens Users can insert their own tokens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own tokens" ON public.google_forms_tokens FOR INSERT WITH CHECK ((auth.uid() = user_id));

--
-- Name: community_members Users can join communities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can join communities" ON public.community_members FOR INSERT WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

--
-- Name: community_members Users can leave communities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can leave communities" ON public.community_members FOR DELETE USING ((auth.uid() = user_id));

--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));

--
-- Name: google_forms_tokens Users can update their own tokens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own tokens" ON public.google_forms_tokens FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));

--
-- Name: event_collaborations Users can view collaborations for their communities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view collaborations for their communities" ON public.event_collaborations FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.community_members cm
  WHERE ((cm.community_id = event_collaborations.community_id) AND (cm.user_id = auth.uid()) AND ((cm.role = 'owner'::text) OR (cm.role = 'admin'::text))))) OR (EXISTS ( SELECT 1
   FROM public.communities c
  WHERE ((c.id = event_collaborations.community_id) AND (c.created_by = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (public.events e
     JOIN public.community_members cm ON ((cm.community_id = e.community_id)))
  WHERE ((e.id = event_collaborations.event_id) AND (cm.user_id = auth.uid()) AND ((cm.role = 'owner'::text) OR (cm.role = 'admin'::text))))) OR (EXISTS ( SELECT 1
   FROM (public.events e
     JOIN public.communities c ON ((c.id = e.community_id)))
  WHERE ((e.id = event_collaborations.event_id) AND (c.created_by = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.events e
  WHERE ((e.id = event_collaborations.event_id) AND (e.created_by = auth.uid()))))));

--
-- Name: event_reminders Users can view reminders for their community events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view reminders for their community events" ON public.event_reminders FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.event_collaborations ec
  WHERE ((ec.event_id = event_reminders.event_id) AND (ec.community_id IN ( SELECT cm.id
           FROM public.community_members cm
          WHERE (cm.user_id = auth.uid())))))));

--
-- Name: sent_reminders Users can view sent_reminders for their events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view sent_reminders for their events" ON public.sent_reminders FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.event_collaborations ec
  WHERE ((ec.event_id = sent_reminders.event_id) AND (ec.community_id IN ( SELECT cm.id
           FROM public.community_members cm
          WHERE (cm.user_id = auth.uid())))))));

--
-- Name: google_forms_tokens Users can view their own tokens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tokens" ON public.google_forms_tokens FOR SELECT USING ((auth.uid() = user_id));

--
-- Name: event_reminders allow_view_event_reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_view_event_reminders ON public.event_reminders FOR SELECT USING ((auth.uid() IS NOT NULL));

--
-- Name: announcement_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.announcement_views ENABLE ROW LEVEL SECURITY;

--
-- Name: api_keys; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: communities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

--
-- Name: community_announcement_images; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.community_announcement_images ENABLE ROW LEVEL SECURITY;

--
-- Name: community_announcements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.community_announcements ENABLE ROW LEVEL SECURITY;

--
-- Name: community_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

--
-- Name: community_visits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.community_visits ENABLE ROW LEVEL SECURITY;

--
-- Name: event_collaborations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_collaborations ENABLE ROW LEVEL SECURITY;

--
-- Name: event_registrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

--
-- Name: event_reminders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;

--
-- Name: event_visits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_visits ENABLE ROW LEVEL SECURITY;

--
-- Name: events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

--
-- Name: google_forms_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.google_forms_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: sent_reminders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sent_reminders ENABLE ROW LEVEL SECURITY;

--
-- Name: telegram_users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--
