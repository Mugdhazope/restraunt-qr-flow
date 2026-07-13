import { describe, expect, it } from "vitest";
import {
  buildBookPages,
  flattenMenuItems,
  MENU_BOOK_ITEMS_PER_PAGE,
} from "@/layouts/buildBookPages";
import { defaultLayoutFor, PAGE_KEYS, SCHEMA_VERSION } from "@/layouts/defaults";
import {
  getItemDetailOverride,
  itemDetailKey,
  mergeItemOverridesMaps,
  patchItemDetailOverride,
} from "@/layouts/itemLabelStyles";
import { COMPONENT_REGISTRY, toolboxForPage } from "@/layouts/registry";
import {
  clampFrame,
  cloneNode,
  createNodeFromType,
  findNode,
  frameStyle,
  insertChild,
  removeNode,
  reorderChildren,
  snapFrame,
  updateFrame,
} from "@/layouts/treeUtils";

describe("layout defaults", () => {
  it("provides a root with frames for every page key", () => {
    for (const { key } of PAGE_KEYS) {
      const doc = defaultLayoutFor(key);
      expect(doc.page_key).toBe(key);
      expect(doc.schema_version).toBe(SCHEMA_VERSION);
      expect(doc.root.type).toBe("PageRoot");
      expect(doc.root.frame).toEqual({ x: 0, y: 0, w: 100, h: 100 });
      expect(doc.root.children?.length).toBeGreaterThan(0);
      for (const child of doc.root.children ?? []) {
        expect(child.frame).toBeDefined();
        expect(typeof child.frame!.x).toBe("number");
        expect(typeof child.frame!.w).toBe("number");
      }
    }
  });

  it("menu default uses MenuBook", () => {
    const doc = defaultLayoutFor("menu");
    expect(doc.root.children![0].type).toBe("MenuBook");
  });

  it("item_detail default uses ItemDetailShell", () => {
    const doc = defaultLayoutFor("item_detail");
    expect(doc.root.children![0].type).toBe("ItemDetailShell");
  });
});

describe("item detail per-item overrides", () => {
  it("itemDetailKey uses category::name", () => {
    expect(itemDetailKey("Pizza", "Margherita")).toBe("Pizza::Margherita");
  });

  it("updating one item override leaves others intact", () => {
    const keyA = itemDetailKey("Pizza", "Margherita");
    const keyB = itemDetailKey("Pasta", "Carbonara");
    const props: Record<string, unknown> = {
      itemOverrides: {
        [keyA]: { nameStyle: { x: 10, y: 20, fontSize: 28 } },
        [keyB]: { nameStyle: { x: 12, y: 22, fontSize: 30 }, priceStyle: { x: 12, y: 40, fontSize: 20 } },
      },
    };

    const next = patchItemDetailOverride(props, keyA, {
      nameStyle: { x: 50, y: 60, fontSize: 36, color: "#111" },
    });

    expect(next[keyA]?.nameStyle).toMatchObject({ x: 50, y: 60, fontSize: 36, color: "#111" });
    expect(next[keyB]?.nameStyle).toEqual({ x: 12, y: 22, fontSize: 30 });
    expect(next[keyB]?.priceStyle).toEqual({ x: 12, y: 40, fontSize: 20 });
  });

  it("mergeItemOverridesMaps deep-merges without dropping sibling keys", () => {
    const keyA = "A::One";
    const keyB = "B::Two";
    const merged = mergeItemOverridesMaps(
      {
        [keyA]: { nameStyle: { x: 1, y: 2, fontSize: 10 }, visibility: { description: true } },
        [keyB]: { nameStyle: { x: 3, y: 4, fontSize: 12 } },
      },
      {
        [keyA]: { nameStyle: { fontSize: 40 }, visibility: { tags: false } },
      },
    );

    expect(merged[keyA]?.nameStyle).toEqual({ x: 1, y: 2, fontSize: 40 });
    expect(merged[keyA]?.visibility).toEqual({ description: true, tags: false });
    expect(merged[keyB]?.nameStyle).toEqual({ x: 3, y: 4, fontSize: 12 });
  });

  it("getItemDetailOverride falls back to legacy top-level props", () => {
    const key = itemDetailKey("Drinks", "Espresso");
    const resolved = getItemDetailOverride(
      {
        nameStyle: { x: 8, y: 70, fontSize: 24 },
        itemOverrides: {},
      },
      key,
    );
    expect(resolved.nameStyle).toEqual({ x: 8, y: 70, fontSize: 24 });
  });

  it("per-item override wins over legacy top-level", () => {
    const key = itemDetailKey("Drinks", "Espresso");
    const resolved = getItemDetailOverride(
      {
        nameStyle: { x: 8, y: 70, fontSize: 24 },
        itemOverrides: {
          [key]: { nameStyle: { x: 90, y: 10, fontSize: 18 } },
        },
      },
      key,
    );
    expect(resolved.nameStyle).toEqual({ x: 90, y: 10, fontSize: 18 });
  });
});

describe("component registry", () => {
  it("registers freeform + classic shells", () => {
    const types = new Set(Object.keys(COMPONENT_REGISTRY));
    expect(types.has("MenuBook")).toBe(true);
    expect(types.has("ItemDetailShell")).toBe(true);
    expect(types.has("MenuItemGrid")).toBe(true);
    expect(types.has("CheckInForm")).toBe(true);
  });

  it("toolbox filters by page", () => {
    const menu = toolboxForPage("menu").map((t) => t.type);
    expect(menu).toContain("MenuItemGrid");
    expect(menu).toContain("MenuBook");
    expect(menu).not.toContain("CheckInForm");
    const welcome = toolboxForPage("welcome").map((t) => t.type);
    expect(welcome).toContain("CheckInForm");
  });
});

describe("tree utils freeform", () => {
  it("insert remove reorder", () => {
    const doc = defaultLayoutFor("menu");
    const child = cloneNode(doc.root.children![0]);
    let root = insertChild(doc.root, doc.root.id, child);
    expect(root.children!.length).toBe((doc.root.children?.length ?? 0) + 1);
    const ids = root.children!.map((c) => c.id);
    root = reorderChildren(root, root.id, [...ids].reverse());
    expect(root.children![0].id).toBe(ids[ids.length - 1]);
    const removeId = root.children![0].id;
    root = removeNode(root, removeId);
    expect(findNode(root, removeId)).toBeNull();
  });

  it("updateFrame clamps and applies", () => {
    const doc = defaultLayoutFor("welcome");
    const id = doc.root.children![0].id;

    const root = updateFrame(doc.root, id, { x: -100, y: 10, w: 200, h: 50 });
    const node = findNode(root, id)!;
    expect(node.frame!.x).toBe(-50);
    expect(node.frame!.w).toBe(150);
    expect(node.frame!.h).toBe(50);
  });

  it("snapFrame snaps to edges", () => {
    const snapped = snapFrame({ x: 0.5, y: 10, w: 40, h: null }, [], 1.5);
    expect(snapped.x).toBe(0);
  });

  it("frameStyle absolute for children", () => {
    const style = frameStyle({ x: 10, y: 20, w: 50, h: 30 });
    expect(style.position).toBe("absolute");
    expect(style.left).toBe("10%");
    expect(style.top).toBe("20%");
    expect(style.width).toBe("50%");
    expect(style.height).toBe("30%");
  });

  it("createNodeFromType sets frame", () => {
    const def = COMPONENT_REGISTRY.Banner;
    const node = createNodeFromType("Banner", def, { x: 4, y: 8, w: 92 });
    expect(node.type).toBe("Banner");
    expect(node.frame?.x).toBe(4);
    expect(clampFrame({ x: 999, y: 0, w: 1, h: null }).x).toBe(150);
  });
});

describe("150-item menu scale", () => {
  const TOTAL = 150;
  const CATS = 5;
  const PER_CAT = TOTAL / CATS;

  function makeLargeMenu() {
    const template = {
      name: "Sample Dish",
      description: "A duplicated dish for scale testing.",
      price: 299,
      tag: "Veg",
    };
    return Array.from({ length: CATS }, (_, ci) => {
      const catName = `Category ${ci + 1}`;
      return {
        name: catName,
        items: Array.from({ length: PER_CAT }, (_, ii) => ({
          ...template,
          name: `Item ${String(ci * PER_CAT + ii + 1).padStart(3, "0")}`,
        })),
      };
    });
  }

  it("builds book pages and flat list correctly under 500ms", () => {
    const menu = makeLargeMenu();
    const t0 = performance.now();
    const pages = buildBookPages(menu);
    const flat = flattenMenuItems(menu);
    const elapsed = performance.now() - t0;

    expect(flat).toHaveLength(TOTAL);
    expect(new Set(flat.map((f) => f.key)).size).toBe(TOTAL);

    const categoryPages = pages.filter((p) => !p.categoryName.startsWith("New"));
    // 150 items / 5 per page = 30 category pages (no "new" items in fixture)
    expect(categoryPages.length).toBe(Math.ceil(TOTAL / MENU_BOOK_ITEMS_PER_PAGE));
    expect(pages.length).toBe(categoryPages.length);

    const seen = new Set<string>();
    for (const page of categoryPages) {
      expect(page.items.length).toBeGreaterThan(0);
      expect(page.items.length).toBeLessThanOrEqual(MENU_BOOK_ITEMS_PER_PAGE);
      for (const item of page.items) {
        const key = `${page.categoryName}::${item.name}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
    expect(seen.size).toBe(TOTAL);
    expect(elapsed).toBeLessThan(500);
  });

  it("itemOverrides for 150 dishes stay independent under 500ms", () => {
    const menu = makeLargeMenu();
    const flat = flattenMenuItems(menu);
    const keyA = flat[0]!.key;
    const keyB = flat[flat.length - 1]!.key;

    const t0 = performance.now();
    let props: Record<string, unknown> = { itemOverrides: {} };
    for (const row of flat) {
      props = {
        itemOverrides: patchItemDetailOverride(props, row.key, {
          nameStyle: { x: 10, y: 20, fontSize: 24 },
          priceStyle: { x: 10, y: 40, fontSize: 18 },
        }),
      };
    }

    const map = props.itemOverrides as Record<string, { nameStyle?: { fontSize?: number } }>;
    expect(Object.keys(map)).toHaveLength(TOTAL);

    const next = patchItemDetailOverride(props, keyA, {
      nameStyle: { x: 50, y: 60, fontSize: 40, color: "#abc" },
    });
    const elapsed = performance.now() - t0;

    expect(next[keyA]?.nameStyle).toMatchObject({ x: 50, y: 60, fontSize: 40, color: "#abc" });
    expect(next[keyB]?.nameStyle).toMatchObject({ x: 10, y: 20, fontSize: 24 });
    expect(Object.keys(next)).toHaveLength(TOTAL);
    expect(elapsed).toBeLessThan(500);
  });
});
