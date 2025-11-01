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
] satisfies RouteConfig;
