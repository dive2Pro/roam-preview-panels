import { hoverPreviewInit } from "./hover-preview";

let initial = (extensionAPI: RoamExtensionAPI) => {
  const hierarchyUnload = hoverPreviewInit(extensionAPI);
  return () => {
    hierarchyUnload();
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
