import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  // Routes with top navigation layout
  layout("routes/navigation-layout.tsx", [
    index("routes/hub.tsx"),
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
      "dashboard/:slug/events/create",
      "routes/dashboard/$slug.event.create.tsx"
    ),
    route("dashboard/:slug/attenders", "routes/dashboard/$slug.attenders.tsx"),
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
] satisfies RouteConfig;
