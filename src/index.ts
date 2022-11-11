import { panel_create } from "./config";
import { hoverPreviewInit } from "./hover-preview";

let initial = (extensionAPI: RoamExtensionAPI) => {
  panel_create(extensionAPI);
  const hoverPreviewUnload = hoverPreviewInit(extensionAPI);

  return () => {
    hoverPreviewUnload();
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
