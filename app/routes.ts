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
  ]),

  route("login", "routes/login.tsx"),
  route("signup", "routes/register.tsx"),

  // Dashboard with layout and nested routes
  layout("routes/dashboard/layout.tsx", [
    route("dashboard/:slug", "routes/dashboard/$slug.tsx"),
    route("dashboard/:slug/profile", "routes/dashboard/$slug.edit.tsx"),
  ]),

  route("logout", "routes/logout.tsx"),

  route("auth/email-sent/verify", "routes/verify-email-sent.tsx"),
  route("auth/email-sent/reset", "routes/reset-password-email-sent.tsx"),

  route("auth/verify", "routes/auth.verify.tsx"),
  route("auth/forgot-password", "routes/forgot-password.tsx"),
  route("auth/verify/reset-password", "routes/auth.reset-password.tsx"),
] satisfies RouteConfig;
