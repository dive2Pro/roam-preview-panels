import { useState } from "react";
import { Button, HTMLSelect, Menu } from "@blueprintjs/core";
import { Panel } from "jspanel4";
const CONSTANTS = {
  id: {
    "panel-width": "panel-width",
    "panel-height": "panel-height",
    sync: "sync",
    "panel-status": "panel-status",
    delay: "delay",
    modifier: "modifier",
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

function debounce_leading<T extends []>(
  func: (...args: T) => void,
  timeout = 300
) {
  let timer: any;
  return (...args: T) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      func.apply(this, args);
    }, timeout);
  };
}
export const save_panels_status_initial = (extensionAPI: RoamExtensionAPI) => {
  const write_to_settings = debounce_leading(async () => {
    const json = [...document.querySelectorAll(".jsPanel")].reduce(
      (p, panelInstance: Panel) => {
        p[panelInstance.id] = {
          id: panelInstance.id,
          uid: panelInstance.uid,
          position: panelInstance.currentData,
          status: panelInstance.status,
        };
        return p;
      },
      {} as Record<string, PanelState>
    );

    extensionAPI.settings.set(
      CONSTANTS.id["panel-status"],
      JSON.stringify(json)
    );
  }, 1000);
  return {
    save: () => {
      if (!extensionAPI.settings.get(CONSTANTS.id.sync)) {
        return;
      }
      write_to_settings();
    },
    delete: () => {
      write_to_settings();
    },
  };
};

export const read_delay_ms = (extensionAPI: RoamExtensionAPI) => {
  return (
    Math.max(extensionAPI.settings.get(CONSTANTS.id.delay) as number, 0) || 300
  );
};
export const read_modifier = (extensionAPI: RoamExtensionAPI) => {
  return extensionAPI.settings.get(CONSTANTS.id.modifier) as
    | keyof MouseEvent
    | undefined;
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

  function PanelModifiers() {
    return (
      <div>
        <HTMLSelect
          style={{
            minWidth: 100,
          }}
          options={[
            {
              label: "",
              value: undefined,
            },
            {
              label: "Meta",
              value: "metaKey",
            },
            {
              label: "Alt",
              value: "altKey",
            },
            {
              label: "Shift",
              value: "shiftKey",
            },
            {
              label: "Ctrl",
              value: "ctrlKey",
            },
          ]}
          defaultValue={read_modifier(extensionAPI)}
          onChange={(e) => {
            extensionAPI.settings.set(CONSTANTS.id.modifier, e.target.value);
          }}
        />
      </div>
    );
  }
  const panel_config = {
    tabTitle: "Preview Panels",
    settings: [
      {
        id: CONSTANTS.id["modifier"],
        name: "Modifier",
        description:
          "specify a modifier key so that the panel only appears when you hold down that modifier key",
        action: {
          type: "reactComponent",
          component: PanelModifiers,
        },
      },
      {
        id: CONSTANTS.id["delay"],
        name: "Hover trigger delay(ms)",
        description: "how long to wait before showing a panel",
        action: {
          type: "input",
          placeholder: "200",
        },
      },
      {
        id: CONSTANTS.id["panel-width"],
        name: "Initial panel width",
        description: "entry any valid positive number",
        action: {
          type: "input",
          placeholder: "400",
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
        id: CONSTANTS.id.sync,
        name: "Save",
        description: "Save the status of panels",
        action: {
          type: "switch",
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
  extensionAPI.settings.set(
    CONSTANTS.id.sync,
    extensionAPI.settings.get(CONSTANTS.id.sync) ?? true
  );
}
