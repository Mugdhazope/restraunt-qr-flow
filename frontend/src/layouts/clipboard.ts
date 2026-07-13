/** Session clipboard for cross-page component copy/paste. */
import type { LayoutNode } from "./types";
import { cloneNode } from "./treeUtils";

const KEY = "kotak_layout_clipboard_v1";

export function copyLayoutNode(node: LayoutNode): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(node));
  } catch {
    /* ignore quota */
  }
}

export function pasteLayoutNode(): LayoutNode | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LayoutNode;
    if (!parsed?.type) return null;
    return cloneNode(parsed);
  } catch {
    return null;
  }
}

export function hasClipboard(): boolean {
  try {
    return Boolean(sessionStorage.getItem(KEY));
  } catch {
    return false;
  }
}
