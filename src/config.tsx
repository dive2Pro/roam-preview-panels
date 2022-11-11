import { useState } from "react";
import { Button } from "@blueprintjs/core";
const CONSTANTS = {
  id: {
    "panel-width": "panel-width",
    "panel-height": "panel-height",
    sync: "sync",
    "panel-status": "panel-status",
  },
};

export const read_panel_size = (
  extensionAPI: RoamExtensionAPI,
  panel?: PanelState
) => {
  if (panel) {
    return `${panel.position.width} ${panel.position.height}`;
  }
  return `${extensionAPI.settings.get(CONSTANTS.id["panel-width"]) || 400} ${
    extensionAPI.settings.get(CONSTANTS.id["panel-height"]) || 200
  } `;
};

export const read_panels_status = (extensionAPI: RoamExtensionAPI) => {
  const result = extensionAPI.settings.get(CONSTANTS.id["panel-status"]) as
    | string
    | undefined;
  if (result) {
    try {
      return JSON.parse(result) as Record<string, PanelState>;
    } catch (e) {}
  }
  return {};
};
export const reset_panel_status = (extensionAPI: RoamExtensionAPI) => {
  extensionAPI.settings.set(CONSTANTS.id["panel-status"], undefined);
};

export const save_panels_status_initial = (extensionAPI: RoamExtensionAPI) => {
  let json = read_panels_status(extensionAPI);

  const write_to_settings = () => {
    extensionAPI.settings.set(
      CONSTANTS.id["panel-status"],
      JSON.stringify(json)
    );
  };
  return {
    save: (config: PanelState) => {
      if (!extensionAPI.settings.get(CONSTANTS.id.sync)) {
        return;
      }
      json = read_panels_status(extensionAPI);
      // console.log(config, " = config", read_panels_status(extensionAPI));
      json[config.id] = config;
      write_to_settings();
    },
    delete: (id: string) => {
      delete json[id];
      write_to_settings();
    },
  };
};

export function panel_create(extensionAPI: RoamExtensionAPI) {
  function PanelStatusContent() {
    const [state, setState] = useState({});
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div>
          <Button
            intent="primary"
            onClick={() => {
              reset_panel_status(extensionAPI);
              setState({});
            }}
          >
            Reset
          </Button>
          <Button
            intent="primary"
            onClick={() => {
              setState(read_panels_status(extensionAPI));
            }}
          >
            Refresh
          </Button>
        </div>
        <code style={{ maxWidth: 300, overflow: "scroll" }}>
          {JSON.stringify(state || {})}
        </code>
      </div>
    );
  }
  const panel_config = {
    tabTitle: "Preview Panels",
    settings: [
      {
        id: CONSTANTS.id.sync,
        name: "Sync",
        description: "Sync opened panels status across browser",
        action: {
          type: "switch",
          defaultValue: true,
        },
      },
      {
        id: CONSTANTS.id["panel-width"],
        name: "Initial panel width",
        description: "entry any valid positive number",
        action: {
          type: "input",
          placeholder: "400",
          // onChange: (evt) => {
          // console.log("Input Changed!", evt);

          // },
        },
      },
      {
        id: CONSTANTS.id["panel-height"],
        name: "Initial panel height",
        description: "entry any valid positive number",
        action: {
          type: "input",
          placeholder: "200",
        },
      },
      {
        id: "check-panel-status",
        name: "check panels status",
        action: { type: "reactComponent", component: PanelStatusContent },
      },
    ],
  };

  extensionAPI.settings.panel.create(panel_config);
}
