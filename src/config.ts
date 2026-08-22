import { createMeshConfig } from "@baditaflorin/mesh-common";

export const config = createMeshConfig({
  appName: "mesh-shared-checklist",
  description: "A shared, assigned checklist for small groups.",
  accentHex: "#1d6f65",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
});
