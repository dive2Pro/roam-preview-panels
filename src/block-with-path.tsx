import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@blueprintjs/core";

type ReversePullBlock = {
  ":block/uid": string;
  ":block/string": string;
  ":node/title": string;
  ":block/_children": ReversePullBlock[];
};

const getStrFromParentsOf = (blockUid: string) => {
  const result = window.roamAlphaAPI.pull(
    `
        [
            :block/uid
            :block/string
            :node/title
            {:block/_children ...}
        ]
    `,
    [":block/uid", `${blockUid}`]
  ) as unknown as ReversePullBlock;

  if (result) {
    let strs = [];
    let ary = result[":block/_children"];
    while (ary && ary.length) {
      const block = ary[0];
      strs.unshift(block);
      ary = block[":block/_children"];
    }
    return strs;
  }
  return [];
};

const BlockEdit = ({ uid }: { uid: string }) => {
  const ref = useRef();
  useEffect(() => {
    window.roamAlphaAPI.ui.components.renderBlock({ uid, el: ref.current });
    return () => {};
  }, [uid]);
  return <div ref={ref} />;
};

export function BreadcrumbsBlock(props: { uid: string }) {
  const [uid, setUid] = useState(props.uid);
  const [parents, setParents] = useState<ReversePullBlock[]>([]);
  useEffect(() => {
    const parentsBlocks = getStrFromParentsOf(uid);
    // console.log(parentsBlocks);
    setParents(parentsBlocks);
  }, [uid]);
  return (
    <div
      onClickCapture={(e) => {
        const target = e.target as HTMLDivElement;
        if (target.closest(".controls.rm-block__controls")) {
          e.preventDefault();
          e.stopPropagation();
          const t = target
            .closest("div.rm-block-main")
            .querySelector("div.rm-block__input");
          const tuid = t.id.split("").splice(-9).join("");
          setUid(tuid);
          setTimeout(() => {
            const portal = document
              .querySelector(".rm-bullet__tooltip")
              .closest(".bp3-portal");
            portal.parentElement.removeChild(portal);
          }, 1000);

          return true;
        }
      }}
      onKeyDownCapture={(e) => {
        const target = e.target as HTMLTextAreaElement;
        if (
          target.nodeName === "TEXTAREA" &&
          target.id &&
          target?.id.startsWith("block-input") &&
          e.metaKey
        ) {
          const tuid = target.id.split("").splice(-9).join("");
          let nBlock: ReversePullBlock;
          if (e.key === "," && parents.length > 1) {
            nBlock = parents[parents.length - 1];
            if (nBlock) {
              setUid(nBlock[":block/uid"]);
            }
          } else if (e.key === ".") {
            setUid(tuid);
          }
        }
      }}
    >
      <div
        className="block-breadcrumbs"
        style={{
          flexWrap: "wrap",
          marginBottom: 5,
          display: "flex",
          flexDirection: "row",
          padding: 5,
        }}
      >
        {parents.map((block, index, ary) => {
          const s = block[":block/string"] || block[":node/title"];
          return (
            <span
              className="block-br-item"
              style={{
                whiteSpace: "unset",
                alignItems: "center",
                display: "inline-flex",
                color: "#5C7080",
                cursor: "pointer",
              }}
              onClick={() => {
                if (block[":node/title"]) {
                  return;
                }
                setUid(block[":block/uid"]);
              }}
            >
              {s}
              {index < ary.length - 1 ? (
                <Icon
                  size={12}
                  style={{ margin: "0 4px" }}
                  icon="chevron-right"
                />
              ) : null}
            </span>
          );
        })}
      </div>
      <BlockEdit uid={uid} key={uid} />
    </div>
  );
}
