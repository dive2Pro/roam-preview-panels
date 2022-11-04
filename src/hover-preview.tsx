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

const panels_map = new Map<string, PanelManager>();

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

const is_page_empty = (block: PullBlock) => {
  return !block[":block/children"] && block[":block/string"] === undefined;
};

const get_block_title = (block: PullBlock) =>
  block[":node/title"] || block[":block/string"];

const CONFIG_KEYS = {
  DELAY: "delay",
};

const get_panel_from_target = (target: any) => {
  return target as Panel | undefined;
};
const EL_ID = "preview";

const render_roam_block_on = (panelId: string, uid: string) => {
  const el = document.querySelector(`#${panelId}`)?.querySelector(`#${EL_ID}`);

  if (!el) {
    return;
  }
  // 检查页面是否是空的, 如果是, 则新建一个"点击"创建的蒙层
  window.roamAlphaAPI.ui.components.renderBlock({
    uid,
    el: el as HTMLElement,
  });
};

const create_block_on_page = async (uid: string) => {
  const block_uid = window.roamAlphaAPI.util.generateUID();
  await window.roamAlphaAPI.data.block.create({
    location: {
      "parent-uid": uid,
      order: 0,
    },
    block: {
      string: "",
      uid: block_uid,
    },
  });
  window.roamAlphaAPI.ui.setBlockFocusAndSelection({
    location: {
      "block-uid": block_uid,
      "window-id": "main-window",
    },
  });
};

const get_panel_id = (uid: string) => "panel-" + uid;
let id_increment = 0;
const panel_creator = (extensionAPI: RoamExtensionAPI) => {
  const DELAY_ms =
    (extensionAPI.settings.get(CONFIG_KEYS.DELAY) as number) || 300;

  return (rect: { x: number; y: number }, uid: string) => {
    let panelInstance: Panel | undefined;
    const block = get_block(uid);
    let pin = false;
    let panelId = get_panel_id(uid) + id_increment;
    if (document.querySelector("#" + panelId)) {
      return;
    }

    const init = async () => {
      panelInstance = jsPanel.create({
        id: panelId,
        content: (panel: Panel) => {
          const blockEl = document.createElement("div");
          blockEl.id = EL_ID;
          blockEl.className = is_page(block) ? "page" : "";
          panel.content.append(blockEl);

          if (is_page_empty(block)) {
            let el = document.createElement("p");
            el.className = "empty-add";
            el.textContent = "The page is empty, click to add content.";
            panel.content.append(el);
            el.addEventListener("click", () => {
              create_block_on_page(uid);
              el.parentNode.removeChild(el);
            });
          }
        },
        headerTitle: `<div class="panel-title">${get_block_title(block)}</div>`,
        position: adjust_panel_start_position(rect),
      });
      await delay(10);
      panelInstance._manager = result;
      id_increment++;

      render_roam_block_on(panelId, uid);
    };

    let destroyFn = () => {
      if (panelInstance) {
        panelInstance.close();
      }
      panels_map.delete(get_panel_id(uid));
    };

    let createFn = () => {
      let timeoutId = setTimeout(init, DELAY_ms);
      const origin_fn = destroyFn;
      destroyFn = () => {
        clearInterval(timeoutId);
        origin_fn();
      };
    };

    const destroy_by_moveout_of_uid_target = () => {
      if (!pin) {
        destroyFn();
      }
    };
    let timeout_id_for_remove_by_moveout_of_uid_target: any;
    const result = {
      create() {
        createFn();
      },
      destroy() {
        timeout_id_for_remove_by_moveout_of_uid_target = setTimeout(() => {
          destroy_by_moveout_of_uid_target();
        }, 100);
      },
      keep() {
        clearTimeout(timeout_id_for_remove_by_moveout_of_uid_target);
      },
      pin() {
        if (!pin) {
          pin = true;
          // change map
          id_increment++;
          panels_map.delete(get_panel_id(uid));
        }
      },
      unpin() {
        pin = false;
      },
      is_pined() {
        return pin === true;
      },
    };
    return result;
  };
};

const adjust_panel_start_position = (rect: { x: number; y: number }) => {
  const window_height = window.innerHeight;
  if (rect.y + 200 >= window_height) {
    return {
      my: "left-bottom",
      at: "left-top",
      offsetX: rect.x,
      offsetY: rect.y - 30,
    };
  }
  return {
    my: "left-top",
    at: "left-top",
    offsetX: rect.x,
    offsetY: rect.y,
  };
};

function create_on_block_context_memu(
  panel_factory: ReturnType<typeof panel_creator>
) {
  const LABEL = "open in preview panel";
  let block_memu_position = {
    x: 0,
    y: 0,
  };
  window.roamAlphaAPI.ui.blockContextMenu.addCommand({
    label: LABEL,
    // @ts-ignore
    "display-conditional": (e) => true,
    callback: (e) => {
      e["block-uid"];
      const panel = panel_factory(block_memu_position, e["block-uid"]);
      panel.create();
      panel.pin();
    },
  });
  const on_right_mouse_click = function (e: MouseEvent) {
    var isRightMB;
    if ("which" in e)
      // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
      isRightMB = e.which == 3;
    else if ("button" in e)
      // IE, Opera
      isRightMB = e.button == 2;
    if (isRightMB) {
      block_memu_position.x = e.clientX + 10;
      block_memu_position.y = e.clientY + 10;
    }
  };
  window.addEventListener("mousedown", on_right_mouse_click);
  return () => {
    window.removeEventListener("mousedown", on_right_mouse_click);
    window.roamAlphaAPI.ui.blockContextMenu.removeCommand({ label: LABEL });
  };
}

export function hoverPreviewInit(extensionAPI?: RoamExtensionAPI) {
  const panel_factory = panel_creator(extensionAPI);

  const on_mouse_in = (el: MouseEvent) => {
    const uid = getUidFromTarget(el.target as HTMLElement);
    if (uid) {
      let panel = panels_map.get(get_panel_id(uid));
      // console.log(panel, " = create", id_increment);
      if (!panel) {
        const rect = (el.target as HTMLElement).getBoundingClientRect();
        panel = panel_factory(
          {
            x: rect.x,
            y: rect.y + rect.height + 5,
          },
          uid
        );
        panel.create();
        panels_map.set(get_panel_id(uid), panel);
      } else {
        panel.keep();
      }
    } else if (typeof el.target === "object") {
      const t = el.target as HTMLElement;
      const panel = t.closest(".jsPanel") as any;
      if (panel?._manager) {
        panel._manager.keep();
      }
    }
  };

  const on_mouse_out = (el: MouseEvent) => {
    const uid = getUidFromTarget(el.target as HTMLElement);
    if (uid) {
      const panel = panels_map.get(get_panel_id(uid));
      if (panel) {
        panel.destroy();
      }
    } else if (typeof el.target === "object") {
      const t = el.target as HTMLElement;
      const is_moveout_of_panel = t.className.includes?.(
        "jsPanel-resizeit-handle"
      );
      if (is_moveout_of_panel) {
        const p = get_panel_from_target(t.closest(".jsPanel"));
        p?._manager?.destroy();
      }
    }
  };
  let on_jspaneldragstart = function (event: any) {
    const panel = get_panel_from_target(event.panel);
    panel._manager.pin();
  };
  let on_jspanelclosed = function (event: any) {
    const panel = get_panel_from_target(event.panel);
    if (!panel._manager) {
      return;
    }
    panel._manager.unpin();
    panel._manager.destroy();
  };
  let on_jspanelstatuschange = function (event: any) {
    const panel = get_panel_from_target(event.panel);
    console.log("status change");
    panel._manager.pin();
  };

  document.addEventListener("jspanelbeforeclose", on_jspanelclosed, false);
  document.addEventListener("jspaneldragstart", on_jspaneldragstart, false);
  document.addEventListener(
    "jspanelstatuschange",
    on_jspanelstatuschange,
    false
  );
  window.addEventListener("mouseover", on_mouse_in);
  window.addEventListener("mouseout", on_mouse_out);
  const routeSub = onRouteChange(() => {
    document.querySelectorAll(".jsPanel").forEach((panelEl) => {
      const panel = get_panel_from_target(panelEl);
      if (!panel._manager) {
        return;
      }
      if (!panel._manager.is_pined()) {
        panel.close();
      }
    });
  });
  const unsub_create_context = create_on_block_context_memu(panel_factory);
  return () => {
    routeSub();
    unsub_create_context();
    window.removeEventListener("mouseover", on_mouse_in);
    window.removeEventListener("mouseout", on_mouse_out);
    document.removeEventListener(
      "jspaneldragstart",
      on_jspaneldragstart,
      false
    );
    document.removeEventListener(
      "jspanelbeforeclose",
      on_jspaneldragstart,
      false
    );
    document.removeEventListener(
      "jspanelstatuschange",
      on_jspaneldragstart,
      false
    );
  };
}

const onRouteChange = (cb: () => void) => {
  const onhashchange = window.onhashchange?.bind(window);

  window.onhashchange = (evt) => {
    onhashchange?.call(window, evt);
    setTimeout(() => {
      cb();
    }, 200);
  };
  return () => {
    window.onhashchange = onhashchange;
  };
};
