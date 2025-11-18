import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
  // prerender: ["/login", "/signup", "/create-community"],
  // Note: React Router v7 automatically caches loader data in memory
  // between navigations for better performance
} satisfies Config;
