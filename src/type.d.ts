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

declare module "jspanel4" {
  export type Panel = {
    close(): void;
  };
  export const jsPanel = {
    create(obj: object): Panel;,
  };
}
