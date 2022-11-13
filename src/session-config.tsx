import {
  Alert,
  Button,
  Callout,
  Classes,
  Dialog,
  EditableText,
  Icon,
  InputGroup,
  Menu,
  MenuDivider,
  MenuItem,
  Popover,
  Toaster,
  Tooltip,
} from "@blueprintjs/core";
import { useState } from "react";
import ReactDOM from "react-dom";
import { CONSTANTS } from "./constants";
import { get_current_panel_injson } from "./panel-status";

const use_forceupdate = () => {
  const updater = useState(0)[1];
  return () => {
    updater((i) => i + 1);
  };
};

const read_sessions = (extensionAPI: RoamExtensionAPI): PanelSessions => {
  const sessions = extensionAPI.settings.get(
    CONSTANTS.id["panel-sessions"]
  ) as string;
  try {
    // console.log(sessions, ' = sessions')
    return JSON.parse(sessions) || [];
  } catch (e) {
    return [];
  }
};

const save_current_session_by_title = (
  extensionAPI: RoamExtensionAPI,
  title: string
) => {
  const sessions = read_sessions(extensionAPI);
  const json = get_current_panel_injson();
  if (!json) {
    Toaster.create().show({
      message: "No panels found",
      intent: "warning",
      icon: "hand",
    });
    return;
  }
  sessions.push({
    title,
    state: json,
  });
  save_sessions(extensionAPI, sessions);
};

const change_session_title = (
  extensionAPI: RoamExtensionAPI,
  newTitle: string,
  index: number
) => {
  const sessions = read_sessions(extensionAPI);
  sessions[index].title = newTitle;
  save_sessions(extensionAPI, sessions);
};

const save_sessions = (
  extensionAPI: RoamExtensionAPI,
  sessions: PanelSessions
) => {
  extensionAPI.settings.set(
    CONSTANTS.id["panel-sessions"],
    JSON.stringify(sessions)
  );
};
const delete_session = (extensionAPI: RoamExtensionAPI, index: number) => {
  const sessions = read_sessions(extensionAPI);
  sessions.splice(index, 1);
  save_sessions(extensionAPI, sessions);
};

const create_topbar_menu = (extensionAPI: RoamExtensionAPI) => {
  const topbar = document.querySelector(".rm-topbar");
  const ID = "preview-panel-menu";
  if (topbar.querySelector(`#${ID}`)) {
    return;
  }
  const find_el = topbar.querySelector(".rm-find-or-create-wrapper");
  const next_sibling = find_el.nextElementSibling;
  const spacer = document.createElement("div");
  spacer.className = "rm-topbar__spacer-sm";
  const menu_el = document.createElement("div");
  menu_el.id = ID;
  topbar.insertBefore(spacer, next_sibling);
  topbar.insertBefore(menu_el, next_sibling);
  function SessionsMenu() {
    const [state, setState] = useState(() => {
      return {
        is_open: false,
        sessions: read_sessions(extensionAPI),
        text: "",
      };
    });
    return (
      <>
        <Dialog
          canEscapeKeyClose
          canOutsideClickClose
          isOpen={state.is_open}
          onClose={() =>
            setState({
              ...state,
              text: "",
              is_open: false,
            })
          }
          autoFocus={false}
          isCloseButtonShown={false}
        >
          <div className={Classes.DIALOG_BODY}>
            <InputGroup
              autoFocus
              placeholder="session name..."
              onChange={(e) => {
                setState({
                  ...state,
                  text: e.target.value,
                });
              }}
            />
          </div>
          <div className={Classes.DIALOG_FOOTER}>
            <div className={Classes.DIALOG_FOOTER_ACTIONS}>
              <Button
                disabled={!state.text}
                intent="primary"
                text="Okey"
                onClick={async () => {
                  save_current_session_by_title(extensionAPI, state.text);

                  setState({
                    ...state,
                    is_open: false,
                  });
                }}
              />
            </div>
          </div>
        </Dialog>
        <Popover
          onOpened={() => {
            setState({
              ...state,
              sessions: read_sessions(extensionAPI),
            });
          }}
          content={
            <Menu>
              <MenuItem
                tagName="span"
                text="Save Session"
                icon="add"
                onClick={() => {
                  setState({
                    ...state,
                    is_open: true,
                  });
                }}
              />
              {state.sessions.length ? <MenuDivider /> : null}
              {state.sessions.map((session) => {
                return (
                  <MenuItem
                    onClick={() => {
                      CONSTANTS.event.action.dispatch(
                        "panel-session-selected",
                        session
                      );
                    }}
                    text={session.title}
                    key={session.title}
                  />
                );
              })}
            </Menu>
          }
        >
          <Tooltip content={"Save, select panel session"}>
            <Button minimal small icon="layers" onClick={() => {}}></Button>
          </Tooltip>
        </Popover>
      </>
    );
  }
  ReactDOM.render(<SessionsMenu />, menu_el);
  return () => {
    topbar.removeChild(menu_el);
    topbar.removeChild(spacer);
  };
};

export function session_init(extensionAPI: RoamExtensionAPI) {
  function PanelSessionItem({
    session,
    onChange,
    index,
  }: {
    session: PanelSession;
    index: number;
    onChange: () => void;
  }) {
    const [state, setState] = useState({ value: session.title });
    const changed = state.value !== session.title;
    return (
      <section style={{ display: "flex", flexDirection: "row" }}>
        <InputGroup
          style={{
            minWidth: 400,
          }}
          defaultValue={session.title}
          value={state.value}
          onChange={(e) =>
            setState({
              value: e.target.value,
            })
          }
        ></InputGroup>
        <div style={{ flex: 1 }}></div>
        {changed ? (
          <>
            <Tooltip content={"Confirm Change"}>
              <Button
                onClick={() => {
                  change_session_title(extensionAPI, state.value, index);
                  onChange();
                }}
                minimal
                small
                icon="confirm"
              ></Button>
            </Tooltip>
            <Tooltip content={"Cancel Change"}>
              <Button
                minimal
                small
                icon="undo"
                onClick={() => {
                  setState({
                    value: session.title,
                  });
                }}
              ></Button>
            </Tooltip>
          </>
        ) : null}
        <Button
          minimal
          intent="danger"
          icon="delete"
          onClick={() => {
            delete_session(extensionAPI, index);
            onChange();
          }}
        />
      </section>
    );
  }
  function PanelSessions() {
    const sessions = read_sessions(extensionAPI);
    const force_updater = use_forceupdate();
    return (
      <Callout style={{ flex: 1000 }}>
        <div style={{ display: "flex", flexDirection: "row" }}>
          <h4 style={{ flex: 1 }}>Panel Sessions</h4>

          <Button
            icon="refresh"
            minimal
            onClick={() => {
              force_updater();
            }}
          />
        </div>

        <div style={{ maxHeight: 150, overflow: "auto" }}>
          {sessions.map((session, index) => {
            return (
              <PanelSessionItem
                session={session}
                index={index}
                onChange={() => {
                  force_updater();
                }}
              />
            );
          })}
        </div>
      </Callout>
    );
  }
  const remove_topbar_menu = create_topbar_menu(extensionAPI);
  return {
    config: {
      id: "panel-sessions-operator",
      action: {
        type: "reactComponent",
        component: PanelSessions,
      },
    },
    uninstall() {
      remove_topbar_menu();
    },
  };
}
