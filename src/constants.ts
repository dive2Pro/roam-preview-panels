export const CONSTANTS = {
  id: {
    "panel-width": "panel-width",
    "panel-height": "panel-height",
    sync: "sync",
    "panel-status": "panel-status",
    delay: "delay",
    modifier: "modifier",
    "panel-sessions": "panel-sessions",
  },
  event: {
    // id: event_ids,
    action: {
      listen: ((id, cb) => {
        const event_cb = (e: CustomEvent) => {
          cb && cb(e.detail);
        };
        document.addEventListener(id, event_cb);
        return () => {
          document.removeEventListener(id, event_cb);
        };
      }) as typeof EventListen,
      dispatch: ((id, arg) => {
        document.dispatchEvent(new CustomEvent(id, { detail: arg, bubbles: true }));
      }) as typeof EventDispatch,
    },
  },
};

declare function EventListen(
  id: PanelEvent.PanelSessionSelected,
  cb: (arg: PanelSession) => void
): () => void;

declare function EventDispatch(
  id: PanelEvent.PanelSessionSelected,
  arg: PanelSession
): void;

CONSTANTS.event.action.listen("panel-session-selected", () => {});
