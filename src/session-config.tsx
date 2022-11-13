import {
  Alert,
  Button,
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
  ) as PanelSessions;
  try {
    return sessions || [];
  } catch (e) {
    return [];
  }
};

const save_current_session_by_title = (
  extensionAPI: RoamExtensionAPI,
  title: string
) => {
  console.log("save session title:", title);
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
  extensionAPI.settings.set(CONSTANTS.id["panel-sessions"], sessions);
};

const change_session_title = (
  extensionAPI: RoamExtensionAPI,
  newTitle: string
) => {};

const delete_session = (extensionAPI: RoamExtensionAPI, newTitle: string) => {};

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
              placeholder="title..."
              color=""
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
  function PanelSessions() {
    const sessions = read_sessions(extensionAPI);
    const force_updater = use_forceupdate();
    return (
      <div>
        <Button
          icon="refresh"
          minimal
          onClick={() => {
            force_updater();
          }}
        />
        <div>
          {sessions.map((session) => {
            return (
              <section>
                <Button minimal icon="edit" onClick={() => {}} />
                <Button
                  minimal
                  intent="danger"
                  icon="delete"
                  onClick={() => {}}
                />
              </section>
            );
          })}
        </div>
      </div>
    );
  }
  const remove_topbar_menu = create_topbar_menu(extensionAPI);
  return {
    config: {
      id: "panel-sessions-operator",
      name: "Panel Sessions",
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
