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

type PanelManager = {
  create(): void;
  destroy(): void;
  keep(): void;
  pin(): void;
  unpin(): void;
  is_pined(): boolean;
};

declare module "jspanel4" {
  export type Panel = {
    close(): void;
    _manager: PanelManager;
    content: HTMLElement;
    front(): void;
  };
  export const jsPanel = {
    create(obj: object): Panel;,
  };
}
