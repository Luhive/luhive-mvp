import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  // Landing page (standalone, no navigation layout)
  index("routes/web/index.tsx"),

  // Routes with top navigation layout
  layout("routes/web/layout.tsx", [
    route("hub", "routes/web/hub.tsx"),
    route("profile", "routes/web/profile.tsx"),
    route("c/:slug", "routes/web/community.tsx"),
    route("create-community", "routes/web/create-community.tsx"),
    route(
      "create-community/success",
      "routes/web/create-community-success.tsx",
    ),

    // Events routes with nested layout
    route("c/:slug/events", "routes/web/events-layout.tsx", [
      index("routes/web/events-index.tsx"),
    ]),

    route("c/:slug/events/:eventId", "routes/web/event-detail.tsx"),
    route("c/:slug/events/:eventId/collaboration", "routes/c.$slug.events.$eventId.collaboration.tsx"),
    route("c/:slug/collaboration-invite/:collaborationId", "routes/c.$slug.collaboration-invite.$collaborationId.tsx"),
    route("c/:slug/events/:eventId/verify", "routes/web/event-verify.tsx"),
    route(
      "c/:slug/events/:eventId/verification-sent",
      "routes/web/event-verification-sent.tsx",
    ),
  ]),

  route("login", "routes/auth/login.tsx"),
  route("signup", "routes/auth/register.tsx"),

  // Dashboard: parent route owns :slug, children are relative
  route("dashboard/:slug", "routes/dashboard/layout.tsx", [
    index("routes/dashboard/overview.tsx"),
    route("profile", "routes/dashboard/edit-profile.tsx"),
    route("events", "routes/dashboard/events.tsx"),
    route("events/:eventId/edit", "routes/dashboard/event-edit.tsx"),
    route("events/create", "routes/dashboard/events-create.tsx"),
    route(
      "events/create-external",
      "routes/dashboard/events-create-external.tsx",
    ),
    route(
      "events/:eventId/edit-external",
      "routes/dashboard/event-edit-external.tsx",
    ),
    route("attenders", "routes/dashboard/attenders.tsx"),
    route("forms", "routes/dashboard/forms.tsx"),
    route("forms/:formId", "routes/dashboard/forms-detail.tsx"),
  ]),

  route("logout", "routes/auth/logout.tsx"),

  route("auth/email-sent/verify", "routes/auth/verify-email-sent.tsx"),
  route("auth/email-sent/reset", "routes/auth/reset-password-email-sent.tsx"),

  route("auth/verify", "routes/auth/verify.tsx"),
  route("auth/forgot-password", "routes/auth/forgot-password.tsx"),
  route("auth/verify/reset-password", "routes/auth/verify-reset-password.tsx"),

  // Events API routes
  route(
    "api/events/attenders-emails",
    "routes/api/events/attenders-emails.tsx",
  ),
  route("api/events/attenders-list", "routes/api/events/attenders-list.tsx"),
  route(
    "api/events/update-registration-status",
    "routes/api/events/update-registration-status.tsx",
  ),
  route("api/events/schedule-update", "routes/api/events/schedule-update.tsx"),
  route("api/events/email-debug", "routes/api/events/email-debug.tsx"),

  // Integrations API routes (Google Forms)
  route(
    "api/integrations/google-forms/auth",
    "routes/api/integrations/google-forms/auth.tsx",
  ),
  route(
    "api/integrations/google-forms/callback",
    "routes/api/integrations/google-forms/callback.tsx",
  ),
  route(
    "api/integrations/google-forms/status",
    "routes/api/integrations/google-forms/status.tsx",
  ),
  route(
    "api/integrations/google-forms/list",
    "routes/api/integrations/google-forms/list.tsx",
  ),
  route(
    "api/integrations/google-forms/disconnect",
    "routes/api/integrations/google-forms/disconnect.tsx",
  ),
  route(
    "api/integrations/google-forms/:formId",
    "routes/api/integrations/google-forms/form-id.tsx",
  ),
  route(
    "api/integrations/google-forms/:formId/responses",
    "routes/api/integrations/google-forms/form-id-responses.tsx",
  ),
] satisfies RouteConfig;
