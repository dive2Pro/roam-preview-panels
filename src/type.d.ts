type RoamExtensionAPI = {
  settings: {
    get: (k: string) => unknown;
    getAll: () => Record<string, unknown>;
    panel: {
      create: (c: PanelConfig) => void;
    };
    set: (k: string, v: unknown) => Promise<void>;
  };
};

type PanelState = {
  uid: string;
  id: string;
  position: {
    height: string;
    width: string;
    left: string;
    top: string;
  };
  status: string;
};

type PanelSession = {
  title: string,
  state: Record<string, PanelState>
}

type PanelSessions = PanelSession[];

type PanelManager = {
  create(ms?: number): void;
  destroy(): void;
  keep(): void;
  pin(): void;
  unpin(): void;
  is_pined(): boolean;
  restore(panel: PanelState): void;
};

declare module "jspanel4" {
  export type Panel = {
    close(): void;
    _manager: PanelManager;
    content: HTMLElement;
    front(): void;
    setHeaderTitle(title: string): void;
    status: string;
    currentData: {
      height: string;
      width: string;
      left: string;
      top: string;
    };
    uid: string;
    reposition({
      offsetX: number,
      offsetY: number,
      my: string,
      at: string,
    }): void;
  } & HTMLDivElement;
  export const jsPanel = {
    create(obj: object): Panel;,
  };
}

namespace PanelEvent {
  type PanelSessionSelected = "panel-session-selected";
}
