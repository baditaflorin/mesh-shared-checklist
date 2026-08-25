import { createMeshConfig } from "@baditaflorin/mesh-common";

export const config = createMeshConfig({
  appName: "mesh-shared-checklist",
  displayName: "Shared Checklist",
  description: "A calm shared plan for the things that need to get done.",
  accentHex: "#69d1bd",
  visualProfile: "utility",
  shellLayout: "inset",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
});
