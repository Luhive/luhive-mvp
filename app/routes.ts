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
  layout("routes/layouts/navigation-layout.tsx", [
    route("hub", "routes/web/hub.tsx"),
    route("profile", "routes/web/profile.tsx"),
    route("c/:slug", "routes/web/community.tsx"),
    route("create-community", "routes/web/create-community.tsx"),
    route("create-community/success", "routes/web/create-community-success.tsx"),

    // Events routes with nested layout
    route("c/:slug/events", "routes/community-events/layout.tsx", [
      index("routes/community-events/index.tsx"),
    ]),

    route(
      "c/:slug/events/:eventId",
      "routes/community-events/event-detail.tsx"
    ),
    route(
      "c/:slug/events/:eventId/verify",
      "routes/community-events/event-verify.tsx"
    ),
    route(
      "c/:slug/events/:eventId/verification-sent",
      "routes/community-events/event-verification-sent.tsx"
    ),
  ]),

  route("login", "routes/auth/login.tsx"),
  route("signup", "routes/auth/register.tsx"),

  // Dashboard with layout and nested routes
  layout("routes/dashboard/layout.tsx", [
    route("dashboard/:slug", "routes/dashboard/overview.tsx"),
    route("dashboard/:slug/profile", "routes/dashboard/edit-profile.tsx"),
    route("dashboard/:slug/events", "routes/dashboard/events.tsx"),
    route(
      "dashboard/:slug/events/create",
      "routes/dashboard/events-create.tsx"
    ),
    route("dashboard/:slug/attenders", "routes/dashboard/attenders.tsx"),
    route(
      "dashboard/:slug/events/create-external",
      "routes/dashboard/events-create-external.tsx"
    ),
    route("dashboard/:slug/forms", "routes/dashboard/forms.tsx"),
    route("dashboard/:slug/forms/:formId", "routes/dashboard/forms-detail.tsx"),
  ]),

  route("logout", "routes/auth/logout.tsx"),

  route("auth/email-sent/verify", "routes/auth/verify-email-sent.tsx"),
  route("auth/email-sent/reset", "routes/auth/reset-password-email-sent.tsx"),

  route("auth/verify", "routes/auth/verify.tsx"),
  route("auth/forgot-password", "routes/auth/forgot-password.tsx"),
  route("auth/verify/reset-password", "routes/auth/verify-reset-password.tsx"),

  // API routes
  route("api/attenders-emails", "routes/dashboard/attenders-emails.tsx"),
  route("api/attenders-list", "routes/api/attenders-list.tsx"),
  route(
    "api/update-registration-status",
    "routes/api/update-registration-status.tsx"
  ),
  route("api/email-debug", "routes/api/email-debug.tsx"),

  // Google Forms API routes
  route("api/google-forms/auth", "routes/api/google-forms/auth.tsx"),
  route("api/google-forms/callback", "routes/api/google-forms/callback.tsx"),
  route("api/google-forms/status", "routes/api/google-forms/status.tsx"),
  route("api/google-forms/list", "routes/api/google-forms/list.tsx"),
  route("api/google-forms/disconnect", "routes/api/google-forms/disconnect.tsx"),
  route("api/google-forms/:formId", "routes/api/google-forms/form-id.tsx"),
  route("api/google-forms/:formId/responses", "routes/api/google-forms/form-id-responses.tsx"),
] satisfies RouteConfig;
