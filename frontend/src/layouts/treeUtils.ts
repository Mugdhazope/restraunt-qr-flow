import type { CSSProperties } from "react";
import type { LayoutFrame, LayoutNode } from "./types";

export const DESIGN_WIDTH = 390;
export const DESIGN_HEIGHT = 844;
export const SNAP_THRESHOLD = 1.5; // percent

export function defaultFrame(): LayoutFrame {
  return { x: 5, y: 5, w: 90, h: null };
}

export function nodeStyle(node: LayoutNode): CSSProperties {
  const s = node.style ?? {};
  const out: CSSProperties = {};
  if (s.marginTop != null) out.marginTop = s.marginTop;
  if (s.marginBottom != null) out.marginBottom = s.marginBottom;
  if (s.marginLeft != null) out.marginLeft = s.marginLeft;
  if (s.marginRight != null) out.marginRight = s.marginRight;
  if (s.paddingTop != null) out.paddingTop = s.paddingTop;
  if (s.paddingBottom != null) out.paddingBottom = s.paddingBottom;
  if (s.gap != null) out.gap = s.gap;
  if (s.opacity != null) out.opacity = s.opacity;
  if (s.zIndex != null) out.zIndex = s.zIndex;
  return out;
}

/** Absolute % frame for freeform children (PageRoot is the positioning context). */
export function frameStyle(frame?: LayoutFrame, isRoot = false): CSSProperties {
  if (isRoot) {
    return {
      position: "relative",
      width: "100%",
      height: "100%",
      minHeight: "100%",
      overflow: "hidden",
    };
  }
  const f = frame ?? defaultFrame();
  const style: CSSProperties = {
    position: "absolute",
    left: `${f.x}%`,
    top: `${f.y}%`,
    width: `${f.w}%`,
    boxSizing: "border-box",
  };
  if (f.h != null) {
    style.height = `${f.h}%`;
  }
  return style;
}

export function clampFrame(frame: LayoutFrame): LayoutFrame {
  return {
    x: Math.max(-50, Math.min(150, frame.x)),
    y: Math.max(-50, Math.min(200, frame.y)),
    w: Math.max(1, Math.min(150, frame.w)),
    h: frame.h == null ? null : Math.max(1, Math.min(200, frame.h)),
  };
}

export function snapValue(v: number, guides: number[], threshold = SNAP_THRESHOLD): number {
  for (const g of guides) {
    if (Math.abs(v - g) <= threshold) return g;
  }
  return v;
}

export function snapFrame(
  frame: LayoutFrame,
  siblings: LayoutFrame[],
  threshold = SNAP_THRESHOLD,
): LayoutFrame {
  const guidesX = [0, 50, 100, ...siblings.flatMap((s) => [s.x, s.x + s.w, s.x + s.w / 2])];
  const guidesY = [0, 50, 100, ...siblings.flatMap((s) => [s.y, s.h != null ? s.y + s.h : s.y])];
  const x = snapValue(frame.x, guidesX, threshold);
  const y = snapValue(frame.y, guidesY, threshold);
  const right = snapValue(frame.x + frame.w, guidesX, threshold);
  return clampFrame({
    ...frame,
    x,
    y,
    w: right - x > 1 ? right - x : frame.w,
  });
}

export function interpolateText(template: string, vars: Record<string, string | undefined>): string {
  return template.replace(/\{\{(\w+(?:\.\w+)?)\}\}/g, (_, key: string) => {
    const v = vars[key];
    return v ?? "";
  });
}

export function cloneNode(node: LayoutNode): LayoutNode {
  return {
    ...node,
    id: crypto.randomUUID?.() ?? `n-${Math.random().toString(36).slice(2, 10)}`,
    props: { ...(node.props ?? {}) },
    style: { ...(node.style ?? {}) },
    frame: node.frame ? { ...node.frame } : defaultFrame(),
    children: node.children?.map(cloneNode),
  };
}

export function findNode(root: LayoutNode, id: string): LayoutNode | null {
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

export function updateNode(
  root: LayoutNode,
  id: string,
  patch: Partial<LayoutNode>,
): LayoutNode {
  if (root.id === id) {
    return {
      ...root,
      ...patch,
      props: patch.props !== undefined ? { ...patch.props } : root.props,
      style: patch.style ? { ...root.style, ...patch.style } : root.style,
      frame: patch.frame ? { ...root.frame, ...patch.frame } : root.frame,
    };
  }
  if (!root.children) return root;
  return {
    ...root,
    children: root.children.map((c) => updateNode(c, id, patch)),
  };
}

export function updateFrame(root: LayoutNode, id: string, frame: LayoutFrame): LayoutNode {
  return updateNode(root, id, { frame: clampFrame(frame) });
}

export function removeNode(root: LayoutNode, id: string): LayoutNode {
  if (!root.children) return root;
  return {
    ...root,
    children: root.children.filter((c) => c.id !== id).map((c) => removeNode(c, id)),
  };
}

export function reorderChildren(
  root: LayoutNode,
  parentId: string,
  orderedIds: string[],
): LayoutNode {
  if (root.id === parentId && root.children) {
    const map = new Map(root.children.map((c) => [c.id, c]));
    const next = orderedIds.map((id) => map.get(id)).filter(Boolean) as LayoutNode[];
    const leftover = root.children.filter((c) => !orderedIds.includes(c.id));
    return { ...root, children: [...next, ...leftover] };
  }
  if (!root.children) return root;
  return {
    ...root,
    children: root.children.map((c) => reorderChildren(c, parentId, orderedIds)),
  };
}

export function insertChild(
  root: LayoutNode,
  parentId: string,
  child: LayoutNode,
  index?: number,
): LayoutNode {
  if (root.id === parentId) {
    const kids = [...(root.children ?? [])];
    const i = index == null ? kids.length : Math.max(0, Math.min(index, kids.length));
    kids.splice(i, 0, child);
    return { ...root, children: kids };
  }
  if (!root.children) return root;
  return {
    ...root,
    children: root.children.map((c) => insertChild(c, parentId, child, index)),
  };
}

export function moveChild(root: LayoutNode, id: string, direction: "up" | "down"): LayoutNode {
  if (!root.children) return root;
  const idx = root.children.findIndex((c) => c.id === id);
  if (idx >= 0) {
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= root.children.length) return root;
    const kids = [...root.children];
    const [item] = kids.splice(idx, 1);
    kids.splice(target, 0, item);
    return { ...root, children: kids };
  }
  return {
    ...root,
    children: root.children.map((c) => moveChild(c, id, direction)),
  };
}

export function duplicateNode(root: LayoutNode, id: string): LayoutNode {
  if (!root.children) return root;
  const idx = root.children.findIndex((c) => c.id === id);
  if (idx >= 0) {
    const copy = cloneNode(root.children[idx]);
    if (copy.frame) {
      copy.frame = clampFrame({
        ...copy.frame,
        x: copy.frame.x + 2,
        y: copy.frame.y + 2,
      });
    }
    const kids = [...root.children];
    kids.splice(idx + 1, 0, copy);
    return { ...root, children: kids };
  }
  return {
    ...root,
    children: root.children.map((c) => duplicateNode(c, id)),
  };
}

export function createNodeFromType(
  type: string,
  def: { defaultProps: Record<string, unknown>; defaultStyle?: Record<string, number>; defaultFrame?: LayoutFrame },
  frame?: Partial<LayoutFrame>,
): LayoutNode {
  return {
    id: crypto.randomUUID?.() ?? `n-${Math.random().toString(36).slice(2, 10)}`,
    type,
    visible: true,
    locked: false,
    props: { ...def.defaultProps },
    style: { ...(def.defaultStyle ?? {}) },
    frame: clampFrame({
      ...(def.defaultFrame ?? defaultFrame()),
      ...frame,
    }),
  };
}
