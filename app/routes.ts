import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  // Landing page (standalone, no navigation layout)
  index("routes/index.tsx"),

  // Routes with top navigation layout
  layout("routes/navigation-layout.tsx", [
    route("hub", "routes/hub.tsx"),
    route("profile", "routes/profile.tsx"),
    route("c/:slug", "routes/community.tsx"),
    route("create-community", "routes/create-community.tsx"),
    route("create-community/success", "routes/create-community.success.tsx"),

    // Events routes with nested layout
    route("c/:slug/events", "routes/community-events/$slug.events.layout.tsx", [
      index("routes/community-events/$slug.events._index.tsx"),
    ]),

    route(
      "c/:slug/events/:eventId",
      "routes/community-events/$slug.events.$eventId.tsx"
    ),
    route(
      "c/:slug/events/:eventId/verify",
      "routes/community-events/$slug.events.$eventId.verify.tsx"
    ),
    route(
      "c/:slug/events/:eventId/verification-sent",
      "routes/community-events/$slug.events.$eventId.verification-sent.tsx"
    ),
  ]),

  route("login", "routes/login.tsx"),
  route("signup", "routes/register.tsx"),

  // Dashboard with layout and nested routes
  layout("routes/dashboard/layout.tsx", [
    route("dashboard/:slug", "routes/dashboard/$slug.tsx"),
    route("dashboard/:slug/profile", "routes/dashboard/$slug.edit.tsx"),
    route("dashboard/:slug/events", "routes/dashboard/$slug.event.tsx"),
    route(
      "dashboard/:slug/events/:eventId/edit",
      "routes/dashboard/$slug.event.$eventId.edit.tsx"
    ),
    route(
      "dashboard/:slug/events/create",
      "routes/dashboard/$slug.event.create.tsx"
    ),
    route("dashboard/:slug/attenders", "routes/dashboard/$slug.attenders.tsx"),
    route(
      "dashboard/:slug/events/create-external",
      "routes/dashboard/$slug.event.create-external.tsx"
    ),
    route(
      "dashboard/:slug/events/:eventId/edit-external",
      "routes/dashboard/$slug.event.$eventId.edit-external.tsx"
    ),
    // Google Forms routes
    route("dashboard/:slug/forms", "routes/dashboard/$slug.forms.tsx"),
    route("dashboard/:slug/forms/:formId", "routes/dashboard/$slug.forms.$formId.tsx"),
  ]),

  route("logout", "routes/logout.tsx"),

  route("auth/email-sent/verify", "routes/verify-email-sent.tsx"),
  route("auth/email-sent/reset", "routes/reset-password-email-sent.tsx"),

  route("auth/verify", "routes/auth.verify.tsx"),
  route("auth/forgot-password", "routes/forgot-password.tsx"),
  route("auth/verify/reset-password", "routes/auth.reset-password.tsx"),

  // API routes
  route("api/attenders-emails", "routes/dashboard/api.attenders-emails.tsx"),
  route("api/attenders-list", "routes/api.attenders-list.tsx"),
  route(
    "api/update-registration-status",
    "routes/api.update-registration-status.tsx"
  ),
  route("api/email-debug", "routes/api.email-debug.tsx"),

  // Google Forms API routes
  route("api/google-forms/auth", "routes/api.google-forms.auth.tsx"),
  route("api/google-forms/callback", "routes/api.google-forms.callback.tsx"),
  route("api/google-forms/status", "routes/api.google-forms.status.tsx"),
  route("api/google-forms/list", "routes/api.google-forms.list.tsx"),
  route("api/google-forms/disconnect", "routes/api.google-forms.disconnect.tsx"),
  route("api/google-forms/:formId", "routes/api.google-forms.$formId.tsx"),
  route("api/google-forms/:formId/responses", "routes/api.google-forms.$formId.responses.tsx"),
] satisfies RouteConfig;
