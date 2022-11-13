import { Panel } from "jspanel4";

export const get_current_panel_injson = () => {
  const panels = document.querySelectorAll(".jsPanel");
  if (panels.length <= 0) {
    return undefined;
  }
  const json = [...panels].reduce((p, panelInstance: Panel) => {
    p[panelInstance.id] = {
      id: panelInstance.id,
      uid: panelInstance.uid,
      position: panelInstance.currentData,
      status: panelInstance.status,
    };
    return p;
  }, {} as Record<string, PanelState>);
  return json;
};
