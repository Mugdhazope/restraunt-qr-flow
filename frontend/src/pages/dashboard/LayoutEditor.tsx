import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Lock,
  PanelLeft,
  PanelRight,
  Plus,
  Redo2,
  Save,
  Trash2,
  Unlock,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useRestaurant } from "@/context/RestaurantContext";
import { restaurants, type RestaurantConfig } from "@/data/menuData";
import type { ScannerThemeOverrides } from "@/data/restaurantThemes";
import {
  fetchPublicMenu,
  fetchStaffLayout,
  resetStaffLayout,
  saveStaffLayout,
  uploadLayoutAsset,
  apiFetch,
  restaurantDetailUrl,
} from "@/lib/api";
import { mergePublicMenu } from "@/lib/publicMenu";
import { resolveScanContext } from "@/lib/scanContext";
import { useScannerTheme } from "@/lib/useScannerTheme";
import { LayoutRenderer } from "@/layouts/LayoutRenderer";
import { PAGE_KEYS, defaultLayoutFor } from "@/layouts/defaults";
import { BackgroundFields, pickPageBackgroundProps } from "@/layouts/BackgroundFields";
import {
  resolveOutletLogoUrl,
  stripRestaurantLogoImageUrls,
  themeWithOutletLogo,
} from "@/layouts/outletLogo";
import {
  DEFAULT_DETAIL_NAME_LABEL,
  DEFAULT_DETAIL_PRICE_LABEL,
  DEFAULT_DETAIL_TAGS_LABEL,
  DEFAULT_MENU_NAME_LABEL,
  DEFAULT_MENU_PRICE_LABEL,
  DEFAULT_MENU_TAGS_LABEL,
  DEFAULT_MENU_TAP_HINT_LABEL,
  defaultDetailLabel,
  defaultMenuLabel,
  mergeDetailVisibility,
  mergeItemOverridesMaps,
  mergeLabelStyle,
  getItemDetailOverride,
  patchItemDetailOverride,
  type DetailLabelField,
  type DetailVisibility,
  type ItemDetailOverridesMap,
  type ItemLabelField,
  type ItemLabelStyle,
  type ItemTextStyles,
} from "@/layouts/itemLabelStyles";
import { sanitizePageOverlayProps } from "@/layouts/pageBackground";
import { OutletAppearancePanel } from "@/layouts/OutletAppearancePanel";
import {
  FONT_WEIGHT_OPTIONS,
  THEME_FONT_OPTIONS,
} from "@/layouts/textStyles";
import { toolboxForPage, getComponent } from "@/layouts/registry";
import { copyLayoutNode, pasteLayoutNode, hasClipboard } from "@/layouts/clipboard";
import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  clampFrame,
  createNodeFromType,
  duplicateNode,
  findNode,
  insertChild,
  moveChild,
  removeNode,
  reorderChildren,
  snapFrame,
  updateFrame,
  updateNode,
} from "@/layouts/treeUtils";
import type {
  LayoutDataContext,
  LayoutDocument,
  LayoutFrame,
  LayoutNode,
  PageKey,
} from "@/layouts/types";

type DragMode = "move" | "resize-se" | "resize-sw" | "resize-ne" | "resize-nw";

function FreeformCanvas({
  document,
  data,
  selectedId,
  onSelect,
  onFrameChange,
  onUnlock,
}: {
  document: LayoutDocument;
  data: LayoutDataContext;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onFrameChange: (id: string, frame: LayoutFrame) => void;
  onUnlock: (id: string) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    id: string;
    mode: DragMode;
    startX: number;
    startY: number;
    origin: LayoutFrame;
  } | null>(null);
  const [overlayBox, setOverlayBox] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const selected = selectedId ? findNode(document.root, selectedId) : null;
  const siblingFrames = useMemo(
    () =>
      (document.root.children ?? [])
        .filter((c) => c.id !== selectedId)
        .map((c) => c.frame ?? { x: 0, y: 0, w: 100, h: null as number | null }),
    [document.root.children, selectedId],
  );

  // Match selection chrome to real rendered node (works when frame.h is auto/null).
  useEffect(() => {
    if (!selectedId || selectedId === document.root.id || !canvasRef.current) {
      setOverlayBox(null);
      return;
    }
    const canvas = canvasRef.current;
    const nodeEl = canvas.querySelector(
      `[data-layout-id="${globalThis.CSS?.escape?.(selectedId) ?? selectedId.replace(/"/g, '\\"')}"]`,
    ) as HTMLElement | null;
    if (!nodeEl) {
      setOverlayBox(null);
      return;
    }
    const update = () => {
      const cr = canvas.getBoundingClientRect();
      const nr = nodeEl.getBoundingClientRect();
      if (cr.width < 1 || cr.height < 1) return;
      setOverlayBox({
        left: ((nr.left - cr.left) / cr.width) * 100,
        top: ((nr.top - cr.top) / cr.height) * 100,
        width: (nr.width / cr.width) * 100,
        height: (nr.height / cr.height) * 100,
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(nodeEl);
    ro.observe(canvas);
    window.addEventListener("scroll", update, true);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update, true);
    };
  }, [selectedId, document, selected?.locked, selected?.frame]);

  const onPointerDownHandle = (
    e: React.PointerEvent,
    id: string,
    mode: DragMode,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const node = findNode(document.root, id);
    if (!node || node.type === "PageRoot") return;
    if (node.locked) {
      onUnlock(id);
      return;
    }
    const frame = node.frame ?? { x: 5, y: 5, w: 90, h: null };
    // If height was auto, seed from measured overlay so resize/move stays consistent.
    const seeded =
      frame.h == null && overlayBox
        ? { ...frame, h: overlayBox.height }
        : frame;
    dragRef.current = {
      id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origin: { ...seeded },
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      const el = canvasRef.current;
      if (!drag || !el) return;
      const rect = el.getBoundingClientRect();
      const dxPct = ((e.clientX - drag.startX) / rect.width) * 100;
      const dyPct = ((e.clientY - drag.startY) / rect.height) * 100;
      const o = drag.origin;
      let next: LayoutFrame = { ...o };

      if (drag.mode === "move") {
        next = { ...o, x: o.x + dxPct, y: o.y + dyPct };
      } else if (drag.mode === "resize-se") {
        next = { ...o, w: o.w + dxPct, h: (o.h ?? 20) + dyPct };
      } else if (drag.mode === "resize-sw") {
        next = { ...o, x: o.x + dxPct, w: o.w - dxPct, h: (o.h ?? 20) + dyPct };
      } else if (drag.mode === "resize-ne") {
        next = { ...o, y: o.y + dyPct, w: o.w + dxPct, h: (o.h ?? 20) - dyPct };
      } else if (drag.mode === "resize-nw") {
        next = {
          ...o,
          x: o.x + dxPct,
          y: o.y + dyPct,
          w: o.w - dxPct,
          h: (o.h ?? 20) - dyPct,
        };
      }

      next = snapFrame(clampFrame(next), siblingFrames);
      onFrameChange(drag.id, next);
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [onFrameChange, siblingFrames]);

  const showChrome = Boolean(selected && selected.type !== "PageRoot" && overlayBox);

  return (
    <div
      ref={canvasRef}
      className="relative h-full w-full overflow-hidden"
      onClick={() => onSelect(document.root.id)}
    >
      <LayoutRenderer
        document={document}
        mode="editor"
        data={data}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      {showChrome && overlayBox && selected && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${overlayBox.left}%`,
            top: `${overlayBox.top}%`,
            width: `${overlayBox.width}%`,
            height: `${overlayBox.height}%`,
            outline: selected.locked ? "2px dashed #94a3b8" : "2px solid #2563eb",
            outlineOffset: 0,
            zIndex: 40,
          }}
        >
          {selected.locked ? (
            <button
              type="button"
              className="absolute top-1 left-1 pointer-events-auto z-50 text-[10px] bg-slate-800 text-white px-2 py-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                onUnlock(selected.id);
              }}
            >
              Unlock to move
            </button>
          ) : selected.type === "MenuBook" || selected.type === "ItemDetailShell" ? (
            <>
              {/* Thin bar so dish drag inside MenuBook still works */}
              <div
                className="absolute top-0 left-0 right-0 h-8 pointer-events-auto cursor-move bg-blue-600/15 flex items-center justify-center z-50"
                onPointerDown={(e) => onPointerDownHandle(e, selected.id, "move")}
              >
                <span className="text-[10px] font-medium text-blue-700">Drag block</span>
              </div>
              {(
                [
                  ["resize-nw", "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize"],
                  ["resize-ne", "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize"],
                  ["resize-sw", "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize"],
                  ["resize-se", "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize"],
                ] as const
              ).map(([mode, cls]) => (
                <button
                  key={mode}
                  type="button"
                  aria-label={mode}
                  className={`absolute w-3 h-3 bg-white border-2 border-blue-600 rounded-sm pointer-events-auto z-50 ${cls}`}
                  onPointerDown={(e) => onPointerDownHandle(e, selected.id, mode)}
                />
              ))}
            </>
          ) : (
            <>
              <div
                className="absolute inset-0 pointer-events-auto cursor-move"
                onPointerDown={(e) => onPointerDownHandle(e, selected.id, "move")}
              />
              {(
                [
                  ["resize-nw", "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize"],
                  ["resize-ne", "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize"],
                  ["resize-sw", "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize"],
                  ["resize-se", "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize"],
                ] as const
              ).map(([mode, cls]) => (
                <button
                  key={mode}
                  type="button"
                  aria-label={mode}
                  className={`absolute w-3 h-3 bg-white border-2 border-blue-600 rounded-sm pointer-events-auto z-50 ${cls}`}
                  onPointerDown={(e) => onPointerDownHandle(e, selected.id, mode)}
                />
              ))}
            </>
          )}
      </div>
      )}
    </div>
  );
}

function LayerList({
  nodes,
  selectedId,
  onSelect,
  onReorder,
}: {
  nodes: LayoutNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = nodes.map((c) => c.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(ids, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={nodes.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-1">
          {nodes.map((c) => (
            <SortableLayerItem
              key={c.id}
              node={c}
              selected={selectedId === c.id}
              onSelect={() => onSelect(c.id)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableLayerItem({
  node,
  selected,
  onSelect,
}: {
  node: LayoutNode;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: node.id,
    disabled: node.locked,
  });
  const def = getComponent(node.type);
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-xs cursor-pointer ${
        selected ? "bg-primary/10 text-foreground" : "hover:bg-muted"
      }`}
      onClick={onSelect}
    >
      <button type="button" className="cursor-grab text-muted-foreground" {...attributes} {...listeners}>
        <GripVertical size={12} />
      </button>
      <span className="flex-1 truncate">{def?.label ?? node.type}</span>
      {node.locked && <Lock size={10} className="text-muted-foreground" />}
      {node.visible === false && <EyeOff size={10} className="text-muted-foreground" />}
    </li>
  );
}

function resolveLabelBase(
  field: ItemLabelField,
  isDetail: boolean,
): ItemLabelStyle {
  if (isDetail) {
    if (field === "name") return DEFAULT_DETAIL_NAME_LABEL;
    if (field === "price") return DEFAULT_DETAIL_PRICE_LABEL;
    if (field === "tags") return DEFAULT_DETAIL_TAGS_LABEL;
    return DEFAULT_MENU_TAP_HINT_LABEL;
  }
  return defaultMenuLabel(field);
}

function TextStyleFields({
  props,
  setProp,
  defaults,
}: {
  props: Record<string, unknown>;
  setProp: (key: string, value: unknown) => void;
  defaults?: { color?: string };
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Text style</p>
      <label className="flex items-center justify-between gap-2 text-xs">
        <span>Color</span>
        <input
          type="color"
          className="h-8 w-14 border rounded cursor-pointer"
          value={String(props.color || defaults?.color || "#111111")}
          onChange={(e) => setProp("color", e.target.value)}
        />
      </label>
      <label className="flex items-center justify-between gap-2 text-xs">
        <span>Size (px)</span>
        <input
          type="number"
          min={8}
          max={96}
          className="w-20 border rounded px-2 py-1"
          value={typeof props.fontSize === "number" ? props.fontSize : ""}
          placeholder="auto"
          onChange={(e) =>
            setProp("fontSize", e.target.value === "" ? undefined : Number(e.target.value) || 14)
          }
        />
      </label>
      <label className="block text-xs">
        Weight
        <select
          className="mt-1 w-full border rounded px-2 py-1"
          value={props.fontWeight !== undefined && props.fontWeight !== null ? String(props.fontWeight) : ""}
          onChange={(e) => setProp("fontWeight", e.target.value === "" ? undefined : e.target.value)}
        >
          <option value="">Theme default</option>
          {FONT_WEIGHT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs">
        Font
        <select
          className="mt-1 w-full border rounded px-2 py-1"
          value={String(props.fontFamily ?? "")}
          onChange={(e) => setProp("fontFamily", e.target.value || undefined)}
        >
          <option value="">Theme default</option>
          {THEME_FONT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs">
        Align
        <select
          className="mt-1 w-full border rounded px-2 py-1"
          value={String(props.align ?? "left")}
          onChange={(e) => setProp("align", e.target.value)}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </label>
    </div>
  );
}

function LabelExtraStyleFields({
  active,
  field,
  onChange,
}: {
  active: ItemLabelStyle;
  field: ItemLabelField | DetailLabelField;
  onChange: (patch: Partial<ItemLabelStyle>) => void;
}) {
  if (field === "tags" || field === "back") return null;
  return (
    <>
      <label className="block text-xs">
        Weight
        <select
          className="mt-1 w-full border rounded px-2 py-1"
          value={active.fontWeight !== undefined ? String(active.fontWeight) : ""}
          onChange={(e) =>
            onChange({ fontWeight: e.target.value === "" ? undefined : e.target.value })
          }
        >
          <option value="">Theme default</option>
          {FONT_WEIGHT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs">
        Font
        <select
          className="mt-1 w-full border rounded px-2 py-1"
          value={String(active.fontFamily ?? "")}
          onChange={(e) => onChange({ fontFamily: e.target.value || undefined })}
        >
          <option value="">Theme default</option>
          {THEME_FONT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs">
        Align
        <select
          className="mt-1 w-full border rounded px-2 py-1"
          value={String(active.textAlign ?? "center")}
          onChange={(e) =>
            onChange({ textAlign: e.target.value as ItemLabelStyle["textAlign"] })
          }
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </label>
    </>
  );
}


const DETAIL_PROP_KEY: Record<DetailLabelField, string> = {
  name: "nameStyle",
  price: "priceStyle",
  tags: "tagsStyle",
  description: "descriptionStyle",
  back: "backBtnStyle",
  counter: "counterStyle",
};

function DetailElementInspector({
  theme,
  selected,
  props,
  setProp,
}: {
  theme: { text: string; primary: string };
  selected: DetailLabelField | null;
  props: Record<string, unknown>;
  setProp: (key: string, value: unknown) => void;
}) {
  const vis = mergeDetailVisibility(props.visibility as DetailVisibility | undefined);
  const active = selected
    ? mergeLabelStyle(
        defaultDetailLabel(selected),
        props[DETAIL_PROP_KEY[selected]] as Partial<ItemLabelStyle> | undefined,
      )
    : null;
  const defaultColor =
    selected === "price" ? theme.primary : selected === "description" || selected === "counter"
      ? theme.text
      : theme.text;
  const showWidth = selected === "name" || selected === "price" || selected === "description" || selected === "counter" || selected === "tags";

  return (
    <div className="space-y-2 border-t pt-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Item detail elements
      </p>
      <p className="text-[10px] text-muted-foreground leading-snug">
        Styles apply only to the selected preview item. Edge arrows expand (1 line) or collapse (2
        lines). Prev/next stay fixed.
      </p>
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase text-muted-foreground">Visibility</p>
        {(
          [
            ["description", "Description"],
            ["tags", "Tags"],
            ["back", "Back button"],
            ["nav", "Prev / next (fixed)"],
            ["counter", "Counter"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={vis[key]}
              onChange={(e) =>
                setProp("visibility", { ...vis, [key]: e.target.checked })
              }
            />
            {label}
          </label>
        ))}
      </div>
      {!selected || !active ? (
        <p className="text-[11px] text-amber-700 bg-amber-50 rounded px-2 py-1.5">
          Select an element on the phone preview
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] font-medium">Editing {selected}</p>
          <label className="flex items-center justify-between gap-2 text-xs">
            <span>Size (px)</span>
            <input
              type="number"
              min={6}
              max={72}
              className="w-20 border rounded px-2 py-1"
              value={active.fontSize}
              onChange={(e) =>
                setProp(DETAIL_PROP_KEY[selected], {
                  ...active,
                  fontSize: Number(e.target.value) || 12,
                })
              }
            />
          </label>
          {showWidth && (
            <>
              <label className="flex items-center justify-between gap-2 text-xs">
                <span>Width %</span>
                <input
                  type="number"
                  min={28}
                  max={95}
                  className="w-20 border rounded px-2 py-1"
                  value={active.width ?? 72}
                  onChange={(e) => {
                    const width = Number(e.target.value) || 72;
                    setProp(DETAIL_PROP_KEY[selected], {
                      ...active,
                      width,
                      maxLines: width >= 78 ? 1 : 2,
                    });
                  }}
                />
              </label>
              <label className="flex items-center justify-between gap-2 text-xs">
                <span>Lines</span>
                <select
                  className="border rounded px-2 py-1"
                  value={active.maxLines ?? ((active.width ?? 72) >= 78 ? 1 : 2)}
                  onChange={(e) =>
                    setProp(DETAIL_PROP_KEY[selected], {
                      ...active,
                      maxLines: Number(e.target.value) === 1 ? 1 : 2,
                    })
                  }
                >
                  <option value={1}>1 (expanded)</option>
                  <option value={2}>2 (collapsed)</option>
                </select>
              </label>
            </>
          )}
          {selected !== "tags" && selected !== "back" && (
            <label className="flex items-center justify-between gap-2 text-xs">
              <span>Color</span>
              <input
                type="color"
                className="h-8 w-14 border rounded cursor-pointer"
                value={active.color || defaultColor}
                onChange={(e) =>
                  setProp(DETAIL_PROP_KEY[selected], {
                    ...active,
                    color: e.target.value,
                  })
                }
              />
            </label>
          )}
          <LabelExtraStyleFields
            active={active}
            field={selected}
            onChange={(patch) =>
              setProp(DETAIL_PROP_KEY[selected], { ...active, ...patch })
            }
          />
          {selected !== "back" && (
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs">
                X %
                <input
                  type="number"
                  step={0.5}
                  className="mt-1 w-full border rounded px-2 py-1"
                  value={active.x}
                  onChange={(e) =>
                    setProp(DETAIL_PROP_KEY[selected], {
                      ...active,
                      x: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="text-xs">
                Y %
                <input
                  type="number"
                  step={0.5}
                  className="mt-1 w-full border rounded px-2 py-1"
                  value={active.y}
                  onChange={(e) =>
                    setProp(DETAIL_PROP_KEY[selected], {
                      ...active,
                      y: Number(e.target.value),
                    })
                  }
                />
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ItemLabelInspector({
  title,
  hint,
  themeDefaults,
  selected,
  styles,
  onChange,
  allowedFields,
}: {
  title: string;
  hint: string;
  themeDefaults: { name: string; price: string };
  selected: { itemName: string; field: ItemLabelField } | null;
  styles: ItemTextStyles;
  onChange: (field: ItemLabelField, patch: Partial<ItemLabelStyle>) => void;
  allowedFields?: ItemLabelField[];
}) {
  const field = selected?.field ?? null;
  const allowed = allowedFields ?? (["name", "price", "tags", "tapHint"] as ItemLabelField[]);
  const fieldOk = field && allowed.includes(field);
  const isDetail = selected?.itemName === "detail";
  const active =
    fieldOk && field
      ? mergeLabelStyle(resolveLabelBase(field, Boolean(isDetail)), styles[field])
      : null;
  const defaultColor =
    field === "price" || field === "tapHint" ? themeDefaults.price : themeDefaults.name;
  const fieldLabel =
    field === "tapHint" ? "tap to view" : field === "tags" ? "tags" : field;

  return (
    <div className="space-y-2 border-t pt-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
      <p className="text-[10px] text-muted-foreground leading-snug">{hint}</p>
      {!selected || !active || !field ? (
        <p className="text-[11px] text-amber-700 bg-amber-50 rounded px-2 py-1.5">
          {allowed.length === 1 && allowed[0] === "tapHint"
            ? "Select “Tap to view” on the phone preview"
            : "Select name, price, or tags on a dish in the phone preview"}
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] font-medium">
            Editing {fieldLabel}
            {selected.itemName && selected.itemName !== "detail" && selected.itemName !== "page"
              ? ` · ${selected.itemName}`
              : ""}
          </p>
          <label className="flex items-center justify-between gap-2 text-xs">
            <span>Size (px)</span>
            <input
              type="number"
              min={6}
              max={72}
              className="w-20 border rounded px-2 py-1"
              value={active.fontSize}
              onChange={(e) => onChange(field, { fontSize: Number(e.target.value) || 12 })}
            />
          </label>
          {field !== "tags" && (
            <label className="flex items-center justify-between gap-2 text-xs">
              <span>Color</span>
              <input
                type="color"
                className="h-8 w-14 border rounded cursor-pointer"
                value={active.color || defaultColor}
                onChange={(e) => onChange(field, { color: e.target.value })}
              />
            </label>
          )}
          <LabelExtraStyleFields
            active={active}
            field={field}
            onChange={(patch) => onChange(field, patch)}
          />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs">
              X %
              <input
                type="number"
                step={0.5}
                className="mt-1 w-full border rounded px-2 py-1"
                value={active.x}
                onChange={(e) => onChange(field, { x: Number(e.target.value) })}
              />
            </label>
            <label className="text-xs">
              Y %
              <input
                type="number"
                step={0.5}
                className="mt-1 w-full border rounded px-2 py-1"
                value={active.y}
                onChange={(e) => onChange(field, { y: Number(e.target.value) })}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

function Inspector({
  node,
  pageKey,
  theme,
  restaurantSlug,
  outletTagline,
  selectedItemLabel,
  selectedDetailLabel,
  detailItemKey,
  onChange,
  onDuplicate,
  onDelete,
  onCopy,
  onMove,
  onOutletLogoChange,
}: {
  node: LayoutNode | null;
  pageKey: PageKey;
  theme: { text: string; primary: string; background: string; logoUrl?: string | null };
  restaurantSlug: string;
  /** Outlet default tagline — placeholder when RestaurantName leaves tagline blank */
  outletTagline?: string;
  selectedItemLabel: { itemName: string; field: ItemLabelField } | null;
  selectedDetailLabel: DetailLabelField | null;
  /** Active dish key (`category::name`) for Item Detail overrides */
  detailItemKey?: string;
  onChange: (patch: Partial<LayoutNode>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onMove: (dir: "up" | "down") => void;
  /** Persist logo at outlet level (scanner_theme) — one logo for all pages */
  onOutletLogoChange?: (logoUrl: string | null) => Promise<void> | void;
}) {
  const [logoUploading, setLogoUploading] = useState(false);

  if (!node) {
    return (
      <div className="text-sm text-muted-foreground p-3">
        Select a component on the canvas or in layers.
      </div>
    );
  }

  const props = node.props ?? {};
  const setProp = (key: string, value: unknown) => {
    const next = { ...props };
    if (value === undefined) delete next[key];
    else next[key] = value;
    onChange({ props: next });
  };

  const uploadLogo = async (file: File | undefined) => {
    if (!file) return;
    setLogoUploading(true);
    try {
      const { url } = await uploadLayoutAsset(restaurantSlug, file);
      // Strip any leftover per-node image so outlet logo is the only source
      if (props.imageUrl) setProp("imageUrl", undefined);
      await onOutletLogoChange?.(url);
      toast.success("Outlet logo updated — same on every page");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLogoUploading(false);
    }
  };

  if (node.type === "PageRoot") {
    const pageProps = sanitizePageOverlayProps(props);
    const setPageProp = (key: string, value: unknown) => {
      const next = { ...pageProps };
      if (value === undefined) delete next[key];
      else next[key] = value;
      onChange({ props: sanitizePageOverlayProps(next) });
    };
    return (
      <div className="space-y-4 p-3 text-sm">
        <div>
          <p className="font-semibold text-foreground">Page</p>
          <p className="text-[11px] text-muted-foreground">
            Page background is the surface where items live. Outlet appearance sits behind this page.
          </p>
        </div>
        <BackgroundFields
          title="Page background"
          props={pageProps}
          setProp={setPageProp}
          setProps={(next) => onChange({ props: sanitizePageOverlayProps(next) })}
          restaurantSlug={restaurantSlug}
          themeBackground={theme.background}
          allowImage={false}
        />
        <p className="text-[10px] text-muted-foreground">Page: {pageKey}</p>
      </div>
    );
  }

  const def = getComponent(node.type);
  const style = node.style ?? {};
  const frame = node.frame ?? { x: 0, y: 0, w: 100, h: null };

  const setStyle = (key: string, value: number) => {
    onChange({ style: { ...style, [key]: value } });
  };
  const setFrameField = (key: keyof LayoutFrame, value: number | null) => {
    onChange({ frame: clampFrame({ ...frame, [key]: value }) });
  };

  return (
    <div className="space-y-4 p-3 text-sm">
      <div>
        <p className="font-semibold text-foreground">{def?.label ?? node.type}</p>
        <p className="text-[11px] text-muted-foreground font-mono">{node.id.slice(0, 8)}</p>
      </div>

      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          className="px-2 py-1 rounded border text-xs hover:bg-muted"
          onClick={() => onChange({ visible: node.visible === false })}
        >
          {node.visible === false ? <Eye size={12} className="inline" /> : <EyeOff size={12} className="inline" />}{" "}
          {node.visible === false ? "Show" : "Hide"}
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded border text-xs hover:bg-muted"
          onClick={() => onChange({ locked: !node.locked })}
        >
          {node.locked ? <Unlock size={12} className="inline" /> : <Lock size={12} className="inline" />}{" "}
          {node.locked ? "Unlock" : "Lock"}
        </button>
        <button type="button" className="px-2 py-1 rounded border text-xs hover:bg-muted" onClick={onDuplicate}>
          Duplicate
        </button>
        <button type="button" className="px-2 py-1 rounded border text-xs hover:bg-muted" onClick={onCopy}>
          <Copy size={12} className="inline" /> Copy
        </button>
        <button type="button" className="px-2 py-1 rounded border text-xs hover:bg-muted" onClick={() => onMove("up")}>
          Forward
        </button>
        <button type="button" className="px-2 py-1 rounded border text-xs hover:bg-muted" onClick={() => onMove("down")}>
          Back
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded border text-xs text-destructive hover:bg-destructive/10"
          onClick={onDelete}
        >
          <Trash2 size={12} className="inline" /> Delete
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Position (%)</p>
        {(
          [
            ["x", "X"],
            ["y", "Y"],
            ["w", "Width"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center justify-between gap-2 text-xs">
            <span>{label}</span>
            <input
              type="number"
              step={0.5}
              className="w-20 border rounded px-2 py-1"
              value={frame[key]}
              disabled={node.locked}
              onChange={(e) => setFrameField(key, Number(e.target.value))}
            />
          </label>
        ))}
        <label className="flex items-center justify-between gap-2 text-xs">
          <span>Height</span>
          <input
            type="number"
            step={0.5}
            className="w-20 border rounded px-2 py-1"
            placeholder="auto"
            value={frame.h ?? ""}
            disabled={node.locked}
            onChange={(e) =>
              setFrameField("h", e.target.value === "" ? null : Number(e.target.value))
            }
          />
        </label>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Spacing</p>
        {(
          [
            ["marginTop", "Margin top"],
            ["marginBottom", "Margin bottom"],
            ["gap", "Gap"],
            ["zIndex", "Z-index"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center justify-between gap-2 text-xs">
            <span>{label}</span>
            <input
              type="number"
              className="w-20 border rounded px-2 py-1"
              value={style[key] ?? 0}
              onChange={(e) => setStyle(key, Number(e.target.value))}
            />
          </label>
        ))}
      </div>

      {node.type === "Text" && (
        <div className="space-y-2">
          <label className="block text-xs">
            Text
            <textarea
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
              rows={3}
              value={String(props.text ?? "")}
              onChange={(e) => setProp("text", e.target.value)}
            />
          </label>
          <label className="block text-xs">
            Variant
            <select
              className="mt-1 w-full border rounded px-2 py-1"
              value={String(props.variant ?? "body")}
              onChange={(e) => setProp("variant", e.target.value)}
            >
              <option value="heading">Heading</option>
              <option value="body">Body</option>
              <option value="muted">Muted</option>
            </select>
          </label>
          <TextStyleFields props={props} setProp={setProp} defaults={{ color: theme.text }} />
        </div>
      )}

      {node.type === "Banner" && (
        <div className="space-y-2">
          <label className="block text-xs">
            Banner text
            <input
              className="mt-1 w-full border rounded px-2 py-1"
              value={String(props.text ?? "")}
              onChange={(e) => setProp("text", e.target.value)}
            />
          </label>
          <TextStyleFields props={props} setProp={setProp} defaults={{ color: theme.text }} />
        </div>
      )}

      {node.type === "CTAButton" && (
        <div className="space-y-2">
          <label className="block text-xs">
            Label
            <input
              className="mt-1 w-full border rounded px-2 py-1"
              value={String(props.label ?? "")}
              onChange={(e) => setProp("label", e.target.value)}
            />
          </label>
          <label className="block text-xs">
            Action
            <select
              className="mt-1 w-full border rounded px-2 py-1"
              value={String(props.action ?? "navigate_menu")}
              onChange={(e) => setProp("action", e.target.value)}
            >
              <option value="navigate_menu">Navigate menu</option>
              <option value="submit_check_in">Submit check-in</option>
              <option value="navigate_back">Navigate back</option>
            </select>
          </label>
          <TextStyleFields props={props} setProp={setProp} defaults={{ color: theme.background }} />
        </div>
      )}

      {node.type === "MenuItemGrid" && (
        <div className="space-y-2">
          <label className="block text-xs">
            Columns
            <input
              type="number"
              min={1}
              max={5}
              className="mt-1 w-full border rounded px-2 py-1"
              value={Number(props.columns ?? 2)}
              onChange={(e) => setProp("columns", Number(e.target.value))}
            />
          </label>
          <label className="block text-xs">
            Direction
            <select
              className="mt-1 w-full border rounded px-2 py-1"
              value={String(props.direction ?? "grid")}
              onChange={(e) => setProp("direction", e.target.value)}
            >
              <option value="grid">Grid</option>
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal</option>
            </select>
          </label>
          <label className="block text-xs">
            Max items
            <input
              type="number"
              min={1}
              max={50}
              className="mt-1 w-full border rounded px-2 py-1"
              value={Number(props.maxItems ?? 5)}
              onChange={(e) => setProp("maxItems", Number(e.target.value))}
            />
          </label>
          <label className="block text-xs">
            Density
            <select
              className="mt-1 w-full border rounded px-2 py-1"
              value={String(props.density ?? "comfortable")}
              onChange={(e) => setProp("density", e.target.value)}
            >
              <option value="compact">Compact</option>
              <option value="comfortable">Comfortable</option>
              <option value="featured">Featured</option>
            </select>
          </label>
          <label className="block text-xs">
            Source
            <select
              className="mt-1 w-full border rounded px-2 py-1"
              value={String(props.source ?? "active_category")}
              onChange={(e) => setProp("source", e.target.value)}
            >
              <option value="active_category">Active category</option>
              <option value="all">All</option>
              <option value="featured">Featured</option>
              <option value="new">New</option>
            </select>
          </label>
        </div>
      )}

      {node.type === "SearchBar" && (
        <label className="block text-xs">
          Placeholder
          <input
            className="mt-1 w-full border rounded px-2 py-1"
            value={String(props.placeholder ?? "")}
            onChange={(e) => setProp("placeholder", e.target.value)}
          />
        </label>
      )}

      {node.type === "MenuBook" && (
        <>
          <ItemLabelInspector
            title="Item labels"
            hint="Click name, price, or tags on a dish. “Tap to view” is once at the page bottom."
            themeDefaults={{ name: theme.text, price: theme.primary }}
            selected={
              selectedItemLabel?.field === "tapHint"
                ? null
                : selectedItemLabel
            }
            styles={
              selectedItemLabel && selectedItemLabel.field !== "tapHint"
                ? ((props.itemTextStyles as Record<string, ItemTextStyles> | undefined)?.[
                    selectedItemLabel.itemName
                  ] ?? {})
                : {}
            }
            onChange={(field, patch) => {
              if (!selectedItemLabel || selectedItemLabel.field === "tapHint") return;
              if (field === "tapHint") return;
              const all = { ...((props.itemTextStyles as Record<string, ItemTextStyles>) ?? {}) };
              const cur = { ...(all[selectedItemLabel.itemName] ?? {}) };
              const base = mergeLabelStyle(defaultMenuLabel(field), cur[field]);
              cur[field] = { ...base, ...patch };
              all[selectedItemLabel.itemName] = cur;
              setProp("itemTextStyles", all);
            }}
            allowedFields={["name", "price", "tags"]}
          />
          <ItemLabelInspector
            title="Tap to view"
            hint="One hint per book page (bottom). Click it on the canvas to edit."
            themeDefaults={{ name: theme.text, price: theme.primary }}
            selected={
              selectedItemLabel?.field === "tapHint"
                ? { itemName: "page", field: "tapHint" }
                : null
            }
            styles={{
              tapHint: (props.tapHintStyle as Partial<ItemLabelStyle> | undefined) ?? undefined,
            }}
            onChange={(field, patch) => {
              if (field !== "tapHint") return;
              const base = mergeLabelStyle(
                DEFAULT_MENU_TAP_HINT_LABEL,
                props.tapHintStyle as Partial<ItemLabelStyle> | undefined,
              );
              setProp("tapHintStyle", { ...base, ...patch });
            }}
            allowedFields={["tapHint"]}
          />
        </>
      )}

      {node.type === "ItemDetailShell" && (
        <>
          {detailItemKey ? (
            <p className="text-[11px] text-muted-foreground border rounded px-2 py-1.5 bg-muted/40">
              Editing layout for{" "}
              <span className="font-medium text-foreground">
                {detailItemKey.replace("::", " · ")}
              </span>
              . Other dishes keep their own saved styles.
            </p>
          ) : (
            <p className="text-[11px] text-amber-700 bg-amber-50 rounded px-2 py-1.5">
              Pick a preview item above to edit its layout.
            </p>
          )}
          <DetailElementInspector
            theme={theme}
            selected={selectedDetailLabel}
            props={
              detailItemKey
                ? (getItemDetailOverride(props, detailItemKey) as Record<string, unknown>)
                : {}
            }
            setProp={(key, value) => {
              if (!detailItemKey) return;
              const nextMap = patchItemDetailOverride(props, detailItemKey, {
                [key]: value,
              });
              setProp("itemOverrides", nextMap);
            }}
          />
        </>
      )}

      {node.type === "RestaurantLogo" && (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground leading-snug">
            One logo for this outlet — shared on Welcome, Checked In, and every page that shows
            Restaurant Logo.
          </p>
          <label className="block text-xs">
            Logo image
            <input
              type="file"
              accept="image/*"
              className="mt-1 w-full text-[11px]"
              disabled={logoUploading}
              onChange={(e) => void uploadLogo(e.target.files?.[0])}
            />
          </label>
          {typeof theme.logoUrl === "string" && theme.logoUrl && (
            <div className="space-y-1">
              <img
                src={theme.logoUrl}
                alt="Outlet logo"
                className="h-14 w-14 rounded-lg object-cover border"
              />
              <button
                type="button"
                className="text-[11px] text-destructive underline"
                onClick={() => void onOutletLogoChange?.(null)}
              >
                Remove outlet logo
              </button>
            </div>
          )}
          {logoUploading && <p className="text-[11px] text-muted-foreground">Uploading…</p>}
          <label className="block text-xs">
            Size
            <select
              className="mt-1 w-full border rounded px-2 py-1"
              value={String(props.size ?? "md")}
              onChange={(e) => setProp("size", e.target.value)}
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </label>
          <label className="block text-xs">
            Align
            <select
              className="mt-1 w-full border rounded px-2 py-1"
              value={String(props.align ?? "center")}
              onChange={(e) => setProp("align", e.target.value)}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
          <label className="block text-xs">
            Fit
            <select
              className="mt-1 w-full border rounded px-2 py-1"
              value={String(props.objectFit ?? "cover")}
              onChange={(e) => setProp("objectFit", e.target.value)}
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-2 text-xs">
            <span>Corner radius</span>
            <input
              type="number"
              min={0}
              max={40}
              className="w-20 border rounded px-2 py-1"
              value={typeof props.borderRadius === "number" ? props.borderRadius : 12}
              onChange={(e) => setProp("borderRadius", Number(e.target.value) || 0)}
            />
          </label>
        </div>
      )}

      {node.type === "RestaurantName" && (
        <div className="space-y-2">
          <label className="block text-xs">
            Display text
            <input
              className="mt-1 w-full border rounded px-2 py-1"
              placeholder="Restaurant name"
              value={String(props.displayText ?? "")}
              onChange={(e) => setProp("displayText", e.target.value || undefined)}
            />
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={Boolean(props.showTagline)}
              onChange={(e) => setProp("showTagline", e.target.checked)}
            />
            Show tagline
          </label>
          <p className="text-[10px] text-muted-foreground leading-snug">
            Edit the outlet tagline in{" "}
            <span className="font-medium text-foreground">Settings → Appearance</span> (or Outlet
            appearance). Here you only show or hide it on this page.
            {outletTagline?.trim() ? (
              <>
                {" "}
                Current: <span className="italic">“{outletTagline.trim()}”</span>
              </>
            ) : (
              <> No tagline set yet.</>
            )}
          </p>
          <TextStyleFields props={props} setProp={setProp} defaults={{ color: theme.text }} />
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">Page: {pageKey}</p>
    </div>
  );
}

const LayoutEditor = () => {
  const { selectedOutlet } = useRestaurant();
  const slug = selectedOutlet.restaurantId;
  const { apiSlug, menuKey } = useMemo(() => resolveScanContext(slug), [slug]);
  const { theme: baseTheme, overrides: scannerOverrides, setOverrides: setScannerOverrides } =
    useScannerTheme(apiSlug, menuKey);
  const fallbackRestaurant =
    restaurants[menuKey] ?? restaurants[Object.keys(restaurants)[0]];

  const [liveRestaurant, setLiveRestaurant] = useState<RestaurantConfig | null>(null);
  const restaurant = liveRestaurant ?? fallbackRestaurant;

  const [pageKey, setPageKey] = useState<PageKey>("menu");
  const [docsByPage, setDocsByPage] = useState<Partial<Record<PageKey, LayoutDocument>>>({});
  const [versionsByPage, setVersionsByPage] = useState<Partial<Record<PageKey, number>>>({});
  const [dirtyByPage, setDirtyByPage] = useState<Partial<Record<PageKey, boolean>>>({});
  const [loadedPages, setLoadedPages] = useState<Partial<Record<PageKey, boolean>>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inspectAppearance, setInspectAppearance] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"layers" | "inspector" | null>(null);
  const [phoneScale, setPhoneScale] = useState(1);
  const phoneStageRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [savingPage, setSavingPage] = useState<PageKey | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [previewItemKey, setPreviewItemKey] = useState<string>("");
  const [clipboardReady, setClipboardReady] = useState(hasClipboard());
  const [selectedItemLabel, setSelectedItemLabel] = useState<{
    itemName: string;
    field: ItemLabelField;
  } | null>(null);
  const [selectedDetailLabel, setSelectedDetailLabel] = useState<DetailLabelField | null>(
    null,
  );

  const theme = useMemo(
    () => themeWithOutletLogo(baseTheme, docsByPage),
    [baseTheme, docsByPage],
  );

  const doc = docsByPage[pageKey] ?? defaultLayoutFor(pageKey);
  const dirty = Boolean(dirtyByPage[pageKey]);
  const saving = savingPage !== null;
  const pageLabel = PAGE_KEYS.find((p) => p.key === pageKey)?.label ?? pageKey;

  const dirtyByPageRef = useRef(dirtyByPage);
  dirtyByPageRef.current = dirtyByPage;
  const loadedPagesRef = useRef(loadedPages);
  loadedPagesRef.current = loadedPages;
  const docsByPageRef = useRef(docsByPage);
  docsByPageRef.current = docsByPage;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchPublicMenu(apiSlug);
        if (cancelled) return;
        const merged = mergePublicMenu(menuKey, data);
        setLiveRestaurant(merged);
        setActiveCategory((prev) => prev ?? merged.menu[0]?.name ?? null);
        const first = merged.menu[0]?.items[0];
        if (first) {
          setPreviewItemKey((prev) => prev || `${merged.menu[0].name}::${first.name}`);
        }
      } catch {
        if (!cancelled) {
          setLiveRestaurant(null);
          setActiveCategory(fallbackRestaurant?.menu[0]?.name ?? null);
          toast.message("Using offline menu sample — could not load live menu");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiSlug, menuKey, fallbackRestaurant?.menu]);

  const flatItems = useMemo(() => {
    return (restaurant?.menu ?? []).flatMap((c) =>
      c.items.map((item) => ({ item, categoryName: c.name, key: `${c.name}::${item.name}` })),
    );
  }, [restaurant?.menu]);

  const previewDetail = useMemo(() => {
    const found = flatItems.find((f) => f.key === previewItemKey) ?? flatItems[0];
    return found ?? null;
  }, [flatItems, previewItemKey]);

  // Outlet change: drop drafts
  useEffect(() => {
    dirtyByPageRef.current = {};
    loadedPagesRef.current = {};
    docsByPageRef.current = {};
    setDocsByPage({});
    setVersionsByPage({});
    setDirtyByPage({});
    setLoadedPages({});
      setSelectedId(null);
  }, [slug]);

  const loadPage = useCallback(async (key: PageKey, { force = false }: { force?: boolean } = {}) => {
    if (!force && (dirtyByPageRef.current[key] || (loadedPagesRef.current[key] && docsByPageRef.current[key]))) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const row = await fetchStaffLayout(slug, key);
      if (dirtyByPageRef.current[key] && !force) {
        setLoading(false);
        return;
      }
      const layout = row.layout as unknown as LayoutDocument;
      setDocsByPage((prev) => ({ ...prev, [key]: layout }));
      docsByPageRef.current = { ...docsByPageRef.current, [key]: layout };
      setVersionsByPage((prev) => ({ ...prev, [key]: row.version }));
      setDirtyByPage((prev) => ({ ...prev, [key]: false }));
      dirtyByPageRef.current = { ...dirtyByPageRef.current, [key]: false };
      setLoadedPages((prev) => ({ ...prev, [key]: true }));
      loadedPagesRef.current = { ...loadedPagesRef.current, [key]: true };
      if (force) setSelectedId(null);
    } catch {
      setDocsByPage((prev) => ({ ...prev, [key]: prev[key] ?? defaultLayoutFor(key) }));
      setVersionsByPage((prev) => ({ ...prev, [key]: prev[key] ?? 1 }));
      toast.error(`Could not load ${key} layout — showing default`);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadPage(pageKey);
  }, [slug, pageKey, loadPage]);

  useEffect(() => {
    const el = phoneStageRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const phoneW = DESIGN_WIDTH + 24;
    const phoneH = DESIGN_HEIGHT + 24;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      const pad = 16;
      const next = Math.min(1, (width - pad) / phoneW, (height - pad) / phoneH);
      setPhoneScale(Number.isFinite(next) && next > 0 ? next : 1);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading, pageKey]);

  const setDocDirty = (nextRoot: LayoutNode) => {
    setDocsByPage((prev) => {
      const next = { ...(prev[pageKey] ?? doc), root: nextRoot };
      const map = { ...prev, [pageKey]: next };
      docsByPageRef.current = map;
      return map;
    });
    setDirtyByPage((prev) => {
      const map = { ...prev, [pageKey]: true };
      dirtyByPageRef.current = map;
      return map;
    });
  };

  const patchCurrentDoc = (updater: (prev: LayoutDocument) => LayoutDocument) => {
    setDocsByPage((prev) => {
      const current = prev[pageKey] ?? defaultLayoutFor(pageKey);
      const map = { ...prev, [pageKey]: updater(current) };
      docsByPageRef.current = map;
      return map;
    });
    setDirtyByPage((prev) => {
      const map = { ...prev, [pageKey]: true };
      dirtyByPageRef.current = map;
      return map;
    });
  };

  const selected = selectedId ? findNode(doc.root, selectedId) : null;
  const toolbox = useMemo(() => toolboxForPage(pageKey), [pageKey]);

  const totalItemCount = flatItems.length;

  const previewData: LayoutDataContext = {
    restaurant: restaurant ?? null,
    restaurantName: selectedOutlet.name || restaurant?.name || "Restaurant",
    tagline: theme.tagline || restaurant?.tagline,
    theme,
    menu: restaurant?.menu ?? [],
    activeCategory: activeCategory ?? restaurant?.menu[0]?.name ?? null,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    item: pageKey === "item_detail" ? previewDetail?.item ?? null : null,
    categoryName: previewDetail?.categoryName ?? restaurant?.menu[0]?.name,
    customerName: "Alex",
    visitCount: 1,
    visitGoal: 5,
    pathSegment: slug,
    resolvedId: slug,
    flatItems: flatItems.map(({ item, categoryName }) => ({ item, categoryName })),
    detailIndex: previewDetail
      ? flatItems.findIndex((f) => f.key === previewDetail.key)
      : undefined,
    onDetailNavigate: (index) => {
      const row = flatItems[index];
      if (row) setPreviewItemKey(row.key);
    },
    navigateToMenu: () => toast.message("Preview: navigate to menu"),
    navigateBack: () => toast.message("Preview: back"),
    onItemTap: (item) => {
      const cat =
        restaurant?.menu.find((c) => c.items.some((i) => i.name === item.name))?.name ?? "";
      setPreviewItemKey(`${cat}::${item.name}`);
      toast.message(`Preview item: ${item.name}`);
    },
    onUpdateNodeProps: (nodeId, props) => {
      patchCurrentDoc((prev) => {
        const existing = findNode(prev.root, nodeId);
        const merged: Record<string, unknown> = { ...(existing?.props ?? {}), ...props };
        if (
          props.itemFrames &&
          typeof props.itemFrames === "object" &&
          existing?.props?.itemFrames &&
          typeof existing.props.itemFrames === "object"
        ) {
          merged.itemFrames = {
            ...(existing.props.itemFrames as Record<string, unknown>),
            ...(props.itemFrames as Record<string, unknown>),
          };
        }
        if (
          props.itemTextStyles &&
          typeof props.itemTextStyles === "object" &&
          existing?.props?.itemTextStyles &&
          typeof existing.props.itemTextStyles === "object"
        ) {
          const prevStyles = existing.props.itemTextStyles as Record<string, ItemTextStyles>;
          const nextStyles = props.itemTextStyles as Record<string, ItemTextStyles>;
          const out: Record<string, ItemTextStyles> = { ...prevStyles };
          for (const [itemName, styles] of Object.entries(nextStyles)) {
            out[itemName] = {
              ...(prevStyles[itemName] ?? {}),
              ...styles,
              name: styles.name
                ? { ...(prevStyles[itemName]?.name ?? {}), ...styles.name }
                : prevStyles[itemName]?.name,
              price: styles.price
                ? { ...(prevStyles[itemName]?.price ?? {}), ...styles.price }
                : prevStyles[itemName]?.price,
              tags: styles.tags
                ? { ...(prevStyles[itemName]?.tags ?? {}), ...styles.tags }
                : prevStyles[itemName]?.tags,
              tapHint: styles.tapHint
                ? { ...(prevStyles[itemName]?.tapHint ?? {}), ...styles.tapHint }
                : prevStyles[itemName]?.tapHint,
            };
          }
          merged.itemTextStyles = out;
        }
        if (
          props.itemOverrides &&
          typeof props.itemOverrides === "object" &&
          existing?.props?.itemOverrides &&
          typeof existing.props.itemOverrides === "object"
        ) {
          merged.itemOverrides = mergeItemOverridesMaps(
            existing.props.itemOverrides as ItemDetailOverridesMap,
            props.itemOverrides as ItemDetailOverridesMap,
          );
        } else if (props.itemOverrides && typeof props.itemOverrides === "object") {
          merged.itemOverrides = mergeItemOverridesMaps(
            {},
            props.itemOverrides as ItemDetailOverridesMap,
          );
        }
        return { ...prev, root: updateNode(prev.root, nodeId, { props: merged }) };
      });
    },
    selectedItemLabel,
    setSelectedItemLabel: (sel) => {
      setSelectedItemLabel(sel);
      if (sel) {
        const book = (docsByPage[pageKey] ?? doc).root.children?.find((c) => c.type === "MenuBook");
        if (book) setSelectedId(book.id);
      }
    },
    selectedDetailLabel,
    setSelectedDetailLabel: (sel) => {
      setSelectedDetailLabel(sel);
      if (sel) {
        const shell = (docsByPage[pageKey] ?? doc).root.children?.find(
          (c) => c.type === "ItemDetailShell",
        );
        if (shell) setSelectedId(shell.id);
      }
    },
    checkIn: {
      name: "Alex",
      phone: "98765 43210",
      setName: () => undefined,
      setPhone: () => undefined,
      errors: {},
      formError: null,
      submitting: false,
      onSubmit: () => toast.message("Preview: submit check-in"),
    },
  };

  const addComponent = (type: string) => {
    const def = getComponent(type);
    if (!def) return;
    const y = 5 + (doc.root.children?.length ?? 0) * 4;
    const node = createNodeFromType(type, def, { x: 5, y: Math.min(y, 80), w: 90 });
    setDocDirty(insertChild(doc.root, doc.root.id, node));
    setSelectedId(node.id);
  };

  const handleOutletLogoChange = useCallback(
    async (logoUrl: string | null) => {
      const next = { ...(scannerOverrides ?? {}), logoUrl };
      if (logoUrl === null) delete next.logoUrl;
      const body: Record<string, unknown> = {
        ...pickPageBackgroundProps(next as Record<string, unknown>),
        ...(typeof next.text === "string" && next.text.trim() ? { text: next.text.trim() } : {}),
        ...(typeof next.textSecondary === "string" && next.textSecondary.trim()
          ? { textSecondary: next.textSecondary.trim() }
          : {}),
        ...(typeof next.primary === "string" && next.primary.trim()
          ? { primary: next.primary.trim() }
          : {}),
        ...(typeof next.pageTitle === "string" && next.pageTitle.trim()
          ? { pageTitle: next.pageTitle.trim() }
          : {}),
        ...(logoUrl ? { logoUrl } : { logoUrl: null }),
        ...(typeof next.tagline === "string" ? { tagline: next.tagline } : {}),
        ...(next.tags ? { tags: next.tags } : {}),
      };
      await apiFetch(restaurantDetailUrl(apiSlug), {
        method: "PATCH",
        body: JSON.stringify({ scanner_theme: body }),
      });
      setScannerOverrides(body as ScannerThemeOverrides);
    },
    [apiSlug, scannerOverrides, setScannerOverrides],
  );

  // Promote legacy per-page RestaurantLogo.imageUrl into outlet logo once per slug.
  const promotedLogoRef = useRef<string | null>(null);
  useEffect(() => {
    promotedLogoRef.current = null;
  }, [apiSlug]);
  useEffect(() => {
    if (scannerOverrides === null) return;
    if (typeof scannerOverrides.logoUrl === "string" && scannerOverrides.logoUrl.trim()) return;
    if (promotedLogoRef.current) return;
    const legacy = resolveOutletLogoUrl(null, docsByPage);
    if (!legacy) return;
    promotedLogoRef.current = legacy;
    void handleOutletLogoChange(legacy).catch(() => {
      promotedLogoRef.current = null;
    });
  }, [docsByPage, scannerOverrides, handleOutletLogoChange]);

  const handleSave = async (key: PageKey = pageKey) => {
    const layout = docsByPageRef.current[key] ?? docsByPage[key] ?? (key === pageKey ? doc : null);
    if (!layout) {
      toast.error("Nothing to save for this page yet");
      return;
    }
    const sanitized: LayoutDocument = {
      ...layout,
      root: stripRestaurantLogoImageUrls({
        ...layout.root,
        props: sanitizePageOverlayProps(layout.root.props as Record<string, unknown>),
      }),
    };
    setSavingPage(key);
    try {
      const saved = await saveStaffLayout(
        slug,
        key,
        sanitized as unknown as Record<string, unknown>,
        versionsByPage[key] ?? 1,
      );
      const savedLayout = saved.layout as unknown as LayoutDocument;
      setVersionsByPage((prev) => ({ ...prev, [key]: saved.version }));
      setDocsByPage((prev) => {
        const map = { ...prev, [key]: savedLayout };
        docsByPageRef.current = map;
        return map;
      });
      setDirtyByPage((prev) => {
        const map = { ...prev, [key]: false };
        dirtyByPageRef.current = map;
        return map;
      });
      setLoadedPages((prev) => {
        const map = { ...prev, [key]: true };
        loadedPagesRef.current = map;
        return map;
      });
      const label = PAGE_KEYS.find((p) => p.key === key)?.label ?? key;
      toast.success(`${label} saved — live for customers`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingPage(null);
    }
  };

  const handleDiscard = async () => {
    if (dirty && !confirm(`Discard unsaved changes on ${pageLabel}?`)) return;
    await loadPage(pageKey, { force: true });
    setSelectedId(null);
  };

  const handleReset = async () => {
    if (!confirm(`Reset ${pageLabel} to the default layout?`)) return;
    setSavingPage(pageKey);
    try {
      const saved = await resetStaffLayout(slug, pageKey);
      const savedLayout = saved.layout as unknown as LayoutDocument;
      setVersionsByPage((prev) => ({ ...prev, [pageKey]: saved.version }));
      setDocsByPage((prev) => {
        const map = { ...prev, [pageKey]: savedLayout };
        docsByPageRef.current = map;
        return map;
      });
      setDirtyByPage((prev) => {
        const map = { ...prev, [pageKey]: false };
        dirtyByPageRef.current = map;
        return map;
      });
      setLoadedPages((prev) => {
        const map = { ...prev, [pageKey]: true };
        loadedPagesRef.current = map;
        return map;
      });
      setSelectedId(null);
      toast.success(`${pageLabel} reset to default`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setSavingPage(null);
    }
  };

  const handlePaste = () => {
    const node = pasteLayoutNode();
    if (!node) {
      toast.message("Clipboard empty — copy a component first");
      return;
    }
    if (!node.frame) {
      node.frame = { x: 8, y: 8, w: 84, h: null };
    } else {
      node.frame = clampFrame({ ...node.frame, x: node.frame.x + 2, y: node.frame.y + 2 });
    }
    setDocDirty(insertChild(doc.root, doc.root.id, node));
    setSelectedId(node.id);
    setClipboardReady(true);
    toast.success(`Pasted ${node.type}`);
  };

  const openLayers = () => {
    setMobilePanel("layers");
  };
  const openInspector = () => {
    setMobilePanel("inspector");
  };
  const closeMobilePanel = () => setMobilePanel(null);

  const pagesNav = (
    <div className="space-y-2">
      {PAGE_KEYS.map((p) => {
        const isActive = pageKey === p.key;
        const isDirty = Boolean(dirtyByPage[p.key]);
        const isSaving = savingPage === p.key;
        return (
          <div
            key={p.key}
            className={`rounded border ${
              isActive ? "border-primary/40 bg-primary/5" : "border-transparent"
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setPageKey(p.key);
                setSelectedId(null);
                setSelectedItemLabel(null);
                setSelectedDetailLabel(null);
                closeMobilePanel();
              }}
              className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center justify-between gap-1 ${
                isActive ? "font-medium" : "hover:bg-muted"
              }`}
            >
              <span>{p.label}</span>
              {isDirty && (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" title="Unsaved" />
              )}
            </button>
            <div className="px-2 pb-2">
              <button
                type="button"
                className="w-full px-2 py-1.5 text-[11px] rounded bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleSave(p.key);
                }}
                disabled={!isDirty || saving}
                title={
                  isDirty
                    ? `Save ${p.label} only — other pages stay unchanged`
                    : `No unsaved changes on ${p.label}`
                }
              >
                <Save size={11} className="inline mr-1" />
                {isSaving ? "Saving…" : `Save ${p.label}`}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const layersPanel = (
    <>
      <div className="p-3 border-b">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Pages</p>
        {pagesNav}
      </div>
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Layers</p>
          <button
            type="button"
            className="text-[10px] text-muted-foreground hover:text-foreground"
            onClick={handlePaste}
            title="Paste component"
          >
            Paste
          </button>
        </div>
        <button
          type="button"
          className={`w-full text-left px-2 py-1.5 mb-1 rounded text-xs ${
            inspectAppearance
              ? "bg-primary/10 text-foreground font-medium"
              : "hover:bg-muted"
          }`}
          onClick={() => {
            setInspectAppearance(true);
            setSelectedId(null);
            setMobilePanel("inspector");
          }}
        >
          Outlet appearance
        </button>
        <button
          type="button"
          className={`w-full text-left px-2 py-1.5 mb-1 rounded text-xs ${
            !inspectAppearance && (selectedId === doc.root.id || !selectedId)
              ? "bg-primary/10 text-foreground font-medium"
              : "hover:bg-muted"
          }`}
          onClick={() => {
            setInspectAppearance(false);
            setSelectedId(doc.root.id);
            setMobilePanel("inspector");
          }}
        >
          Page background
        </button>
        <LayerList
          nodes={doc.root.children ?? []}
          selectedId={inspectAppearance ? null : selectedId}
          onSelect={(id) => {
            setInspectAppearance(false);
            setSelectedId(id);
            setMobilePanel("inspector");
          }}
          onReorder={(ids) => setDocDirty(reorderChildren(doc.root, doc.root.id, ids))}
        />
      </div>
      <div className="p-3 flex-1">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Add component</p>
        <div className="space-y-1">
          {toolbox.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => {
                setInspectAppearance(false);
                addComponent(t.type);
                setMobilePanel("inspector");
              }}
              className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded text-xs hover:bg-muted"
            >
              <Plus size={12} />
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const inspectorPanel = (
    <>
      <div className="p-3 border-b flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Inspector</p>
        <button
          type="button"
          className="lg:hidden p-1 rounded hover:bg-muted text-muted-foreground"
          onClick={closeMobilePanel}
          aria-label="Close inspector"
        >
          <X size={16} />
        </button>
      </div>
      {inspectAppearance ? (
        <OutletAppearancePanel
          restaurantSlug={apiSlug}
          themeBackground={theme.background}
          defaults={{
            text: theme.text,
            textSecondary: theme.textSecondary,
            primary: theme.primary,
            pageTitle: theme.pageTitle ?? theme.primary,
            tagline: theme.tagline,
          }}
          overrides={scannerOverrides}
          onChange={(next) => setScannerOverrides(next)}
        />
      ) : (
        <Inspector
          node={selected ?? doc.root}
          pageKey={pageKey}
          theme={theme}
          restaurantSlug={apiSlug}
          outletTagline={theme.tagline || restaurant?.tagline}
          selectedItemLabel={selectedItemLabel}
          selectedDetailLabel={selectedDetailLabel}
          detailItemKey={pageKey === "item_detail" ? previewDetail?.key : undefined}
          onOutletLogoChange={handleOutletLogoChange}
          onChange={(patch) => {
            const id = selectedId ?? doc.root.id;
            setDocDirty(updateNode(doc.root, id, patch));
            if (!selectedId) setSelectedId(doc.root.id);
          }}
          onDuplicate={() => {
            if (!selectedId || selectedId === doc.root.id) return;
            setDocDirty(duplicateNode(doc.root, selectedId));
          }}
          onDelete={() => {
            if (!selectedId || selectedId === doc.root.id) return;
            setDocDirty(removeNode(doc.root, selectedId));
            setSelectedId(null);
          }}
          onCopy={() => {
            if (!selected || selected.type === "PageRoot") return;
            copyLayoutNode(selected);
            setClipboardReady(true);
            toast.success("Copied — paste on any page");
          }}
          onMove={(dir) => {
            if (!selectedId || selectedId === doc.root.id) return;
            setDocDirty(moveChild(doc.root, selectedId, dir));
          }}
        />
      )}
    </>
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] overflow-hidden">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b px-3 sm:px-4 py-3 bg-card shrink-0">
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-semibold">Mobile Layout Editor</h1>
          <p className="text-xs text-muted-foreground truncate">
            {selectedOutlet.name} ·{" "}
            <span className="font-medium text-foreground">{pageLabel}</span>
            <span className="hidden sm:inline">
              {" · "}
              {totalItemCount} menu items · each page saves separately
              {pageKey === "item_detail" ? " · each dish keeps its own layout" : ""}
            </span>
          </p>
          {pageKey === "item_detail" && flatItems.length > 0 && (
            <label className="mt-1 flex flex-col xs:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-muted-foreground">
              Editing item
              <select
                className="border rounded px-2 py-1 text-foreground w-full sm:max-w-[240px]"
                value={previewDetail?.key ?? ""}
                onChange={(e) => setPreviewItemKey(e.target.value)}
              >
                {flatItems.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.categoryName}: {f.item.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {pageKey === "menu" && (restaurant?.menu?.length ?? 0) > 0 && (
            <label className="mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-muted-foreground">
              Category filter
              <select
                className="border rounded px-2 py-1 text-foreground w-full sm:max-w-[200px]"
                value={activeCategory ?? ""}
                onChange={(e) => setActiveCategory(e.target.value || null)}
              >
                {restaurant!.menu.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.items.length})
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {dirty && <span className="text-xs text-amber-600">Unsaved</span>}
          <button
            type="button"
            className="px-3 py-1.5 text-xs rounded border hover:bg-muted"
            onClick={() => void handleDiscard()}
            disabled={loading || saving}
          >
            <Redo2 size={12} className="inline mr-1" />
            Discard
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-xs rounded border hover:bg-muted"
            onClick={() => void handleReset()}
            disabled={saving}
          >
            Reset
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-xs rounded bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
            onClick={() => void handleSave(pageKey)}
            disabled={!dirty || saving}
          >
            <Save size={12} className="inline mr-1" />
            {savingPage === pageKey ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      {/* Mobile page chips */}
      <div className="lg:hidden flex gap-1.5 overflow-x-auto border-b px-3 py-2 bg-card shrink-0 scrollbar-none">
        {PAGE_KEYS.map((p) => {
          const isActive = pageKey === p.key;
          const isDirty = Boolean(dirtyByPage[p.key]);
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                setPageKey(p.key);
                setSelectedId(null);
                setSelectedItemLabel(null);
                setSelectedDetailLabel(null);
              }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs border ${
                isActive
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background hover:bg-muted border-border"
              }`}
            >
              {p.label}
              {isDirty ? " ·" : ""}
            </button>
          );
        })}
      </div>

      {/* Mobile tools */}
      <div className="lg:hidden flex gap-2 border-b px-3 py-2 bg-card shrink-0">
        <button
          type="button"
          onClick={openLayers}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded border hover:bg-muted"
        >
          <PanelLeft size={14} />
          Layers
        </button>
        <button
          type="button"
          onClick={openInspector}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded border hover:bg-muted"
        >
          <PanelRight size={14} />
          Inspector
        </button>
      </div>

      <div className="flex flex-1 min-h-0 relative">
        <aside className="hidden lg:flex w-56 border-r bg-card overflow-y-auto shrink-0 flex-col">
          {layersPanel}
        </aside>

        <main
          ref={phoneStageRef}
          className="flex-1 flex items-start sm:items-center justify-center bg-muted/40 p-3 sm:p-6 overflow-auto min-w-0"
        >
          {loading ? (
            <p className="text-muted-foreground animate-pulse self-center">Loading layout…</p>
          ) : (
            <div
              className="relative shrink-0"
              style={{
                width: (DESIGN_WIDTH + 24) * phoneScale,
                height: (DESIGN_HEIGHT + 24) * phoneScale,
              }}
            >
              <div
                className="absolute top-0 left-0 bg-black rounded-[2rem] p-3 shadow-2xl origin-top-left"
                style={{
                  width: DESIGN_WIDTH + 24,
                  height: DESIGN_HEIGHT + 24,
                  transform: `scale(${phoneScale})`,
                }}
              >
                <div
                  className="rounded-[1.5rem] overflow-hidden relative"
                  style={{ width: DESIGN_WIDTH, height: DESIGN_HEIGHT, background: "transparent" }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-b-xl z-20" />
                  <FreeformCanvas
                    document={doc}
                    data={previewData}
                    selectedId={selectedId}
                    onSelect={(id) => {
                      setInspectAppearance(false);
                      setSelectedId(id);
                    }}
                    onFrameChange={(id, frame) => {
                      patchCurrentDoc((prev) => ({
                        ...prev,
                        root: updateFrame(prev.root, id, frame),
                      }));
                    }}
                    onUnlock={(id) => {
                      patchCurrentDoc((prev) => ({
                        ...prev,
                        root: updateNode(prev.root, id, { locked: false }),
                      }));
                      toast.message("Unlocked — drag to move");
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </main>

        <aside className="hidden lg:flex w-64 border-l bg-card overflow-y-auto shrink-0 flex-col">
          {inspectorPanel}
        </aside>

        {/* Mobile drawers */}
        {mobilePanel && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <button
              type="button"
              className="absolute inset-0 bg-foreground/30"
              aria-label="Close panel"
              onClick={closeMobilePanel}
            />
            {mobilePanel === "layers" ? (
              <aside className="relative z-10 w-[min(100%,18rem)] max-w-[85vw] h-full bg-card border-r shadow-xl overflow-y-auto flex flex-col">
                <div className="p-3 border-b flex items-center justify-between sticky top-0 bg-card z-10">
                  <p className="text-sm font-medium">Pages & layers</p>
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-muted"
                    onClick={closeMobilePanel}
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
                {layersPanel}
              </aside>
            ) : (
              <aside className="relative z-10 ml-auto w-[min(100%,20rem)] max-w-[90vw] h-full bg-card border-l shadow-xl overflow-y-auto flex flex-col">
                {inspectorPanel}
              </aside>
            )}
          </div>
        )}
      </div>

      {dirty && (
        <div className="lg:hidden shrink-0 border-t bg-card px-3 py-2">
          <button
            type="button"
            className="w-full px-4 py-2.5 text-xs rounded-lg bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
            onClick={() => void handleSave(pageKey)}
            disabled={saving}
          >
            <Save size={12} className="inline mr-1" />
            {savingPage === pageKey ? "Saving…" : `Save ${pageLabel}`}
          </button>
        </div>
      )}
    </div>
  );
};

export default LayoutEditor;
