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
  destroy(immediately: boolean = false): void;
  keep(): void;
  pin(): void;
  unpin(): void;
};

declare module "jspanel4" {
  export type Panel = {
    close(): void;
    _manager: PanelManager
  };
  export const jsPanel = {
    create(obj: object): Panel;,
  };
}
