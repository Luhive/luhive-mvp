import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/hub.tsx"),
  route("login", "routes/login.tsx"),
  route("c/:slug", "routes/community.tsx"),
  route("logout", "routes/logout.tsx"),
] satisfies RouteConfig;
