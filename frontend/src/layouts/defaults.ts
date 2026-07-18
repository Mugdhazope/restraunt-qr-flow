import type { LayoutDocument, LayoutFrame, LayoutNode, PageKey } from "./types";

function nid(): string {
  return crypto.randomUUID?.() ?? `n-${Math.random().toString(36).slice(2, 10)}`;
}

function node(
  type: string,
  opts: {
    props?: Record<string, unknown>;
    style?: Record<string, number>;
    frame?: LayoutFrame;
    children?: LayoutNode[];
    id?: string;
    visible?: boolean;
    locked?: boolean;
  } = {},
): LayoutNode {
  const n: LayoutNode = {
    id: opts.id ?? nid(),
    type,
    visible: opts.visible ?? true,
    locked: opts.locked ?? false,
    props: opts.props ?? {},
    style: opts.style ?? {},
    frame: opts.frame ?? { x: 0, y: 0, w: 100, h: null },
  };
  if (opts.children) n.children = opts.children;
  return n;
}

export const SCHEMA_VERSION = 2;

export function defaultLayoutFor(pageKey: PageKey): LayoutDocument {
  switch (pageKey) {
    case "welcome":
      return {
        schema_version: SCHEMA_VERSION,
        page_key: "welcome",
        root: node("PageRoot", {
          id: "root",
          props: { padding: 0, backgroundType: "transparent" },
          frame: { x: 0, y: 0, w: 100, h: 100 },
          children: [
            node("RestaurantLogo", {
              props: { size: "lg", align: "center", objectFit: "contain", borderRadius: 12 },
              frame: { x: 35, y: 6, w: 30, h: null },
            }),
            node("RestaurantName", {
              props: { align: "center", showTagline: true },
              frame: { x: 8, y: 18, w: 84, h: null },
            }),
            node("Text", {
              props: {
                text: "Check in to start your visit",
                align: "center",
                variant: "muted",
              },
              frame: { x: 8, y: 32, w: 84, h: null },
            }),
            node("CheckInForm", {
              props: { showName: true, showPhone: true },
              frame: { x: 6, y: 40, w: 88, h: null },
            }),
            node("CTAButton", {
              props: {
                label: "Continue",
                action: "submit_check_in",
                variant: "primary",
                width: "full",
              },
              frame: { x: 6, y: 76, w: 88, h: null },
            }),
          ],
        }),
      };
    case "checked_in":
      return {
        schema_version: SCHEMA_VERSION,
        page_key: "checked_in",
        root: node("PageRoot", {
          id: "root",
          props: { padding: 0, backgroundType: "transparent" },
          frame: { x: 0, y: 0, w: 100, h: 100 },
          children: [
            node("RestaurantLogo", {
              props: { size: "md", align: "center", objectFit: "contain", borderRadius: 12 },
              frame: { x: 35, y: 6, w: 30, h: null },
            }),
            node("Text", {
              props: {
                text: "You're Checked In!",
                align: "center",
                variant: "heading",
              },
              frame: { x: 8, y: 18, w: 84, h: null },
            }),
            node("LoyaltySummary", {
              props: { visitGoal: 5, showProgressBar: true },
              frame: { x: 6, y: 32, w: 88, h: null },
            }),
            node("CTAButton", {
              props: {
                label: "View Menu",
                action: "navigate_menu",
                variant: "primary",
                width: "full",
              },
              frame: { x: 6, y: 66, w: 88, h: null },
            }),
          ],
        }),
      };
    case "menu":
      return {
        schema_version: SCHEMA_VERSION,
        page_key: "menu",
        root: node("PageRoot", {
          id: "root",
          props: { padding: 0, backgroundType: "transparent" },
          frame: { x: 0, y: 0, w: 100, h: 100 },
          children: [
            node("MenuBook", {
              props: {},
              frame: { x: 0, y: 0, w: 100, h: 100 },
              locked: false,
            }),
          ],
        }),
      };
    case "item_detail":
      return {
        schema_version: SCHEMA_VERSION,
        page_key: "item_detail",
        root: node("PageRoot", {
          id: "root",
          props: { padding: 0, backgroundType: "transparent" },
          frame: { x: 0, y: 0, w: 100, h: 100 },
          children: [
            node("ItemDetailShell", {
              props: {},
              frame: { x: 0, y: 0, w: 100, h: 100 },
              locked: false,
            }),
          ],
        }),
      };
  }
}

export const PAGE_KEYS: { key: PageKey; label: string }[] = [
  { key: "welcome", label: "Welcome" },
  { key: "checked_in", label: "Checked In" },
  { key: "menu", label: "Menu" },
  { key: "item_detail", label: "Item Detail" },
];
