const CONSTANTS = {
  id: {
    "panel-width": "panel-width",
    "panel-height": "panel-height",
  },
};

export const read_panel_size = (extensionAPI: RoamExtensionAPI) => {
  return `${extensionAPI.settings.get(CONSTANTS.id["panel-width"]) || 400} ${
    extensionAPI.settings.get(CONSTANTS.id["panel-height"]) || 200
  } `;
};

const panel_config = {
  tabTitle: "Preview Panels",
  settings: [
    // {
    //   id: "button-setting",
    //   name: "Button test",
    //   description: "tests the button",
    //   action: {
    //     type: "button",
    //     onClick: (evt) => {
    //       console.log("Button clicked!");
    //     },
    //     content: "Button",
    //   },
    // },
    // {
    //   id: "switch-setting",
    //   name: "Switch Test",
    //   description: React.createElement(
    //     "a",
    //     { href: "https:roamresearch.com" },
    //     "Show off react components in the description"
    //   ),
    //   action: {
    //     type: "switch",
    //     onChange: (evt) => {
    //       console.log("Switch!", evt);
    //     },
    //   },
    // },
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
        // onChange: (evt) => {
        // console.log("Input Changed!", evt);

        // },
      },
    },
    // {
    //   id: "select-setting",
    //   name: "Select test",
    //   action: {
    //     type: "select",
    //     items: ["one", "two", "three"],
    //     onChange: (evt) => {
    //       console.log("Select Changed!", evt);
    //     },
    //   },
    // },
    // {
    //   id: "reactComponent-setting",
    //   name: "reactComponent test",
    //   action: { type: "reactComponent", component: reactButton },
    // },
  ],
};

export function panel_create(extensionAPI: RoamExtensionAPI) {
  extensionAPI.settings.panel.create(panel_config);
}
