import { panel_config_create } from "./config";
import { hoverPreviewInit } from "./hover-preview";

let initial = (extensionAPI: RoamExtensionAPI) => {
  const config_clean = panel_config_create(extensionAPI);
  const hoverPreviewUnload = hoverPreviewInit(extensionAPI);

  return () => {
    hoverPreviewUnload();
    config_clean()
  };
};

let initialed = () => {};

function onload({ extensionAPI }: { extensionAPI: RoamExtensionAPI }) {
  initialed = initial(extensionAPI);
}

function onunload() {
  initialed();
}

if (!process.env.ROAM_DEPOT) {
  hoverPreviewInit();
}
export default {
  onload,
  onunload,
};
