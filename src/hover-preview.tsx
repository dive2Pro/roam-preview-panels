import getBlockUidFromTarget from "roamjs-components/dom/getBlockUidFromTarget";
import getReferenceBlockUid from "roamjs-components/dom/getReferenceBlockUid";
import { jsPanel, Panel } from "jspanel4";
import "jspanel4/es6module/jspanel.min.css";
import "./main.css";
import { PullBlock } from "roamjs-components/types";
const ATTRIBUTE_PAGE = "data-link-uid";
const ATTRIBUTE_BLOCK = "data-uid";

function getUidFromTarget(target: HTMLElement) {
  const blockEl = target.closest(`[${ATTRIBUTE_BLOCK}]`);
  if (blockEl) {
    return blockEl.getAttribute(ATTRIBUTE_BLOCK);
  }

  const pageRef = target.closest(`[${ATTRIBUTE_PAGE}]`);
  if (pageRef) {
    return pageRef.getAttribute(ATTRIBUTE_PAGE);
  }
  //     const aliasTooltip = target.closest(".rm-alias-tooltip__content");

  //   if (aliasTooltip) {
  //     const aliasRef = document.querySelector(
  //       ".bp3-popover-open .rm-alias--block"
  //     );
  //     return getReferenceBlockUid(aliasRef as HTMLElement, "rm-alias--block");
  //   }
}

/**
 * - 当(按键 + 鼠标) 时间满足时, 弹出框
 * - 当在一段时间后光标指向脱离 (框 + 目标) 时才自动关闭 **不对**, 当已经弹框之后, 如果弹框未固定, 光标离开弹框, 弹框会自动关闭, 如果在关闭前, 发现鼠标指向的仍然是目标时拒绝关闭
 * - 当弹框未移动, 或未点击固定按钮时, 鼠标移出 (弹框 + 目标) 节点会自动关闭弹框
 * - 有移动弹框或点击了非关闭按钮时, 会将弹框固定在页面上.
 *
 * @returns
 */

type PanelManager = {
  create(): void;
  destroy(): void;
  keep(): void;
};
const panels_map = new Map<string, PanelManager>();

const mm = new WeakMap<HTMLElement, PanelManager>();

const delay = async (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const get_block = (uid: string) => {
  return window.roamAlphaAPI.pull("[*]", [":block/uid", uid]);
};
const is_page = (block: PullBlock) => {
  return block[":node/title"] !== undefined;
};

const get_block_title = (block: PullBlock) =>
  block[":node/title"] || block[":block/string"];

const CONFIG_KEYS = {
  DELAY: "delay",
};
const panel_creator = (extensionAPI: RoamExtensionAPI) => {
  const DELAY_ms =
    (extensionAPI.settings.get(CONFIG_KEYS.DELAY) as number) || 300;

  return (event: MouseEvent, uid: string) => {
    let panelInstance: Panel | undefined;
    const PANEL_ID = "panel-" + uid;
    const EL_ID = "preview";
    const rect = (event.target as HTMLElement).getBoundingClientRect();

    const block = get_block(uid);
    const init = async () => {
      panelInstance = jsPanel.create({
        id: PANEL_ID,
        content: `<div id="${EL_ID}" class="${
          is_page(block) ? "page" : ""
        }" />`,
        headerTitle: `<div class="panel-title">${get_block_title(block)}</div>`,
        position: {
          my: "left-top",
          at: "left-top",
          offsetX: rect.x,
          offsetY: rect.y + rect.height + 10,
        },
      });

      await delay(10);
      const el = document
        .querySelector(`#${PANEL_ID}`)
        .querySelector(`#${EL_ID}`);
      console.log(panelInstance, el);

      if (!el) {
        return;
      }
      window.roamAlphaAPI.ui.components.renderBlock({
        uid,
        el: el as HTMLElement,
      });
    };

    let destroyFn = () => {};

    let createFn = () => {
      let timeoutId = setTimeout(init, DELAY_ms);
      destroyFn = () => {
        clearInterval(timeoutId);
        destroy_finally();
      };
    };
    const destroy_finally = () => {
      panels_map.delete(uid);
    };
    const destroy_by_moveout_of_uid_target = () => {
      panelInstance?.close();
      destroyFn();
    };
    const destroy_by_moveout_of_panel = () => {};
    return {
      create() {
        createFn();
      },
      destroy() {
        // destroy_by_moveout_of_uid_target();
      },
      keep() {},
    };
  };
};

export function hoverPreviewInit(extensionAPI?: RoamExtensionAPI) {
  const panel_factory = panel_creator(extensionAPI);
  const on_mouse_in = (el: MouseEvent) => {
    const uid = getUidFromTarget(el.target as HTMLElement);
    console.log("mouse in", uid);
    if (uid) {
      let panel = mm.get(el.target as HTMLElement);
      //   let panel = panels_map.get(uid);
      console.log(panel, " = create");
      if (!panel) {
        panel = panel_factory(el, uid);
        panels_map.set(uid, panel);
        panel.create();
      } else {
        panel.keep();
      }
    }
  };

  const on_mouse_out = (el: MouseEvent) => {
    const uid = getUidFromTarget(el.target as HTMLElement);
    console.log("out: ", uid);

    if (uid) {
      const panel = panels_map.get(uid);
      if (panel) {
        panel.destroy();
      }
    }
  };

  window.addEventListener("mouseover", on_mouse_in);
  window.addEventListener("mouseout", on_mouse_out);
  return () => {
    window.removeEventListener("mouseover", on_mouse_in);
    window.removeEventListener("mouseout", on_mouse_out);
  };
}
