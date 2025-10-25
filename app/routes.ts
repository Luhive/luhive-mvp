import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  index("routes/hub.tsx"),
  route("login", "routes/login.tsx"),

  // Dashboard with layout and nested routes
  layout("routes/dashboard/layout.tsx", [
    route("dashboard/:slug", "routes/dashboard/$slug.tsx"),
    route("dashboard/:slug/profile", "routes/dashboard/$slug.edit.tsx"),
  ]),

  route("c/:slug", "routes/community.tsx"),
  route("logout", "routes/logout.tsx"),
] satisfies RouteConfig;
