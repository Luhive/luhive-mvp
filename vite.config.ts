import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type PluginOption } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import netlifyReactRouter from "@netlify/vite-plugin-react-router";

const ensureServerBuildEntry = (): PluginOption => {
  const serverBuildModuleId = "virtual:react-router/server-build";

  return {
    name: "ensure-react-router-server-build-entry",
    enforce: "post",
    config(config, { command, isSsrBuild }) {
      if (command !== "build" || !isSsrBuild) {
        return;
      }

      config.build ??= {};
      config.build.rollupOptions ??= {};
      const input = config.build.rollupOptions.input;

      const normalized: Record<string, string> = (() => {
        if (!input) {
          return {};
        }

        if (typeof input === "string") {
          return { entry: input };
        }

        if (Array.isArray(input)) {
          return input.reduce<Record<string, string>>((acc, value, index) => {
            acc[`entry_${index}`] = value;
            return acc;
          }, {});
        }

        return { ...input };
      })();

      const hasServerBuildEntry = Object.values(normalized).some(
        (value) => value === serverBuildModuleId
      );

      if (!hasServerBuildEntry) {
        normalized["react-router-server-build"] = serverBuildModuleId;
      }

      config.build.rollupOptions.input = normalized;
    },
  };
};
export default defineConfig({
  ssr: {},
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    netlifyReactRouter(),
    ensureServerBuildEntry(),
  ],
  assetsInclude: ["**/*.lottie"],
});
