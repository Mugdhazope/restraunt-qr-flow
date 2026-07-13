import { motion } from "framer-motion";
import { useRef } from "react";
import { ChevronLeft, ChevronRight, MoveDiagonal, MoveDiagonal2 } from "lucide-react";
import { MenuItem } from "@/data/menuData";
import { RestaurantTheme } from "@/data/restaurantThemes";
import { lightTap } from "@/lib/haptics";
import {
  DEFAULT_MENU_NAME_LABEL,
  DEFAULT_MENU_PRICE_LABEL,
  DEFAULT_MENU_TAGS_LABEL,
  DEFAULT_MENU_TAP_HINT_LABEL,
  mergeLabelStyle,
  type ItemLabelField,
  type ItemLabelStyle,
  type ItemTextStyles,
} from "@/layouts/itemLabelStyles";
import { itemImageSrc, itemImageScaleStyle } from "./menuImages";
import { MenuItemBadges, itemHasBadges } from "./MenuItemBadges";

export type ItemSlotFrame = { top: number; left: number; width: number };
export type { ItemLabelStyle, ItemTextStyles };

type DragMode = "move" | "resize-se" | "resize-sw" | "resize-ne" | "resize-nw";
type LabelField = ItemLabelField;

interface MenuBookPageProps {
  page: {
    categoryName: string;
    items: MenuItem[];
    heroImage?: string;
    pageLabel: string;
  };
  theme: RestaurantTheme;
  onItemTap: (itemIndex: number) => void;
  /** Editor: drag dishes to reposition / resize */
  editable?: boolean;
  /** Percent frames keyed by item name (within this page) */
  itemFrames?: Record<string, ItemSlotFrame>;
  onItemFrameChange?: (itemName: string, frame: ItemSlotFrame) => void;
  /** Per-item name/price label styles */
  itemTextStyles?: Record<string, ItemTextStyles>;
  onItemTextStyleChange?: (itemName: string, styles: ItemTextStyles) => void;
  /** Page-level “Tap to view” style (once per book page) */
  tapHintStyle?: Partial<ItemLabelStyle>;
  onTapHintStyleChange?: (style: ItemLabelStyle) => void;
  /** Which label is selected in the editor (for inspector sync) */
  selectedLabel?: { itemName: string; field: LabelField } | null;
  onSelectLabel?: (sel: { itemName: string; field: LabelField } | null) => void;
}

const LAYERS = {
  background: 0,
  image: 10,
  text: 20,
} as const;

type Slot = { top: string; left: string; width: string };
const SLOT_LIBRARY: Record<number, Slot[]> = {
  1: [{ top: "22%", left: "10%", width: "80%" }],
  2: [
    { top: "18%", left: "3%", width: "48%" },
    { top: "18%", left: "51%", width: "48%" },
  ],
  3: [
    { top: "11%", left: "3%", width: "48%" },
    { top: "11%", left: "51%", width: "48%" },
    { top: "42%", left: "16%", width: "68%" },
  ],
  4: [
    { top: "9%", left: "3%", width: "48%" },
    { top: "9%", left: "51%", width: "48%" },
    { top: "46%", left: "3%", width: "48%" },
    { top: "46%", left: "51%", width: "48%" },
  ],
  5: [
    { top: "5%", left: "3%", width: "48%" },
    { top: "5%", left: "51%", width: "48%" },
    { top: "30%", left: "16%", width: "68%" },
    { top: "56%", left: "3%", width: "48%" },
    { top: "56%", left: "51%", width: "48%" },
  ],
};

const MIN_WIDTH = 18;
const MAX_WIDTH = 110;
/** Allow hanging off page edges (partial cut left/right). */
const MIN_LEFT = -45;
const MAX_LEFT = 85;
const MIN_TOP = -8;
const MAX_TOP = 90;

function parsePct(v: string): number {
  return Number.parseFloat(v.replace("%", "")) || 0;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

const LABEL_WIDTH_MIN = 28;
const LABEL_WIDTH_MAX = 98;
const LABEL_WIDTH_STEP = 8;
const LABEL_EXPAND_WIDTH = 78;

function resolveMaxLines(style: ItemLabelStyle): 1 | 2 {
  if (style.maxLines === 1 || style.maxLines === 2) return style.maxLines;
  return (style.width ?? 72) >= LABEL_EXPAND_WIDTH ? 1 : 2;
}

function EditableLabel({
  text,
  style,
  themeColor,
  fontFamily,
  fontWeight,
  letterSpacing,
  lineHeight,
  editable,
  selected,
  onSelect,
  onStyleChange,
  cardRef,
}: {
  text: string;
  style: ItemLabelStyle;
  themeColor: string;
  fontFamily: string;
  fontWeight: number | string;
  letterSpacing?: string;
  lineHeight?: string | number;
  editable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onStyleChange?: (next: ItemLabelStyle) => void;
  cardRef: React.RefObject<HTMLDivElement | null>;
}) {
  const dragRef = useRef<{ startX: number; startY: number; origin: ItemLabelStyle } | null>(null);
  const boxWidth = style.width ?? 90;
  const maxLines = resolveMaxLines(style);

  const patchWidth = (nextWidth: number) => {
    if (!onStyleChange) return;
    const width = clamp(nextWidth, LABEL_WIDTH_MIN, LABEL_WIDTH_MAX);
    onStyleChange({
      ...style,
      width,
      maxLines: width >= LABEL_EXPAND_WIDTH ? 1 : 2,
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!editable || !onStyleChange) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect?.();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origin: { ...style },
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    const card = cardRef.current;
    if (!drag || !card || !onStyleChange) return;
    const rect = card.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const dx = ((e.clientX - drag.startX) / rect.width) * 100;
    const dy = ((e.clientY - drag.startY) / rect.height) * 100;
    onStyleChange({
      ...drag.origin,
      x: clamp(drag.origin.x + dx, -10, 110),
      y: clamp(drag.origin.y + dy, -5, 110),
    });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div
      className={`absolute ${editable ? "select-none" : "pointer-events-none"}`}
      style={{
        left: `${style.x}%`,
        top: `${style.y}%`,
        width: `${boxWidth}%`,
        transform: "translate(-50%, -50%)",
        zIndex: LAYERS.text,
        textAlign: "center",
        outline: editable && selected ? "1.5px solid #2563eb" : editable ? "1px dashed rgba(37,99,235,0.35)" : undefined,
        outlineOffset: 2,
        touchAction: editable ? "none" : undefined,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={editable ? onPointerMove : undefined}
      onPointerUp={editable ? onPointerUp : undefined}
      onPointerCancel={editable ? onPointerUp : undefined}
    >
      <p
        className={editable ? "cursor-move" : undefined}
        style={{
          margin: 0,
          fontFamily,
          fontSize: style.fontSize,
          color: style.color || themeColor,
          letterSpacing,
          fontWeight,
          lineHeight,
          textShadow: "0 2px 10px rgba(255,255,255,0.9), 0 0 2px rgba(0,0,0,0.08)",
          overflow: "hidden",
          ...(maxLines === 1
            ? { whiteSpace: "nowrap" as const, textOverflow: "ellipsis" }
            : {
                display: "-webkit-box",
                WebkitBoxOrient: "vertical" as const,
                WebkitLineClamp: 2,
                wordBreak: "break-word" as const,
              }),
        }}
      >
        {text}
      </p>
      {editable && (
        <>
          <button
            type="button"
            aria-label="Collapse text width"
            title="Narrower · up to 2 lines"
            className="absolute top-1/2 left-0 z-40 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-blue-600 bg-white text-blue-600 shadow-sm"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect?.();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              patchWidth(boxWidth - LABEL_WIDTH_STEP);
            }}
          >
            <ChevronLeft size={12} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-label="Expand text width"
            title="Wider · single line"
            className="absolute top-1/2 right-0 z-40 flex h-5 w-5 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-blue-600 bg-white text-blue-600 shadow-sm"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect?.();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              patchWidth(boxWidth + LABEL_WIDTH_STEP);
            }}
          >
            <ChevronRight size={12} strokeWidth={2.5} />
          </button>
        </>
      )}
    </div>
  );
}

function EditableTagsBox({
  item,
  theme,
  style,
  editable,
  selected,
  onSelect,
  onStyleChange,
  cardRef,
}: {
  item: MenuItem;
  theme: RestaurantTheme;
  style: ItemLabelStyle;
  editable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onStyleChange?: (next: ItemLabelStyle) => void;
  cardRef: React.RefObject<HTMLDivElement | null>;
}) {
  const dragRef = useRef<{ startX: number; startY: number; origin: ItemLabelStyle } | null>(null);
  const has = itemHasBadges(item);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!editable || !onStyleChange) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect?.();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origin: { ...style } };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    const card = cardRef.current;
    if (!drag || !card || !onStyleChange) return;
    const rect = card.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const dx = ((e.clientX - drag.startX) / rect.width) * 100;
    const dy = ((e.clientY - drag.startY) / rect.height) * 100;
    onStyleChange({
      ...drag.origin,
      x: clamp(drag.origin.x + dx, -10, 110),
      y: clamp(drag.origin.y + dy, -5, 110),
    });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  if (!has && !editable) return null;

  return (
    <div
      className={`absolute z-20 max-w-[90%] ${editable ? "cursor-move select-none" : "pointer-events-none"}`}
      style={{
        left: `${style.x}%`,
        top: `${style.y}%`,
        transform: "translate(0, 0)",
        outline: editable && selected ? "1.5px solid #2563eb" : editable ? "1px dashed rgba(37,99,235,0.35)" : undefined,
        outlineOffset: 2,
        padding: editable ? 2 : undefined,
        touchAction: editable ? "none" : undefined,
        filter: style.color ? undefined : undefined,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={editable ? onPointerMove : undefined}
      onPointerUp={editable ? onPointerUp : undefined}
      onPointerCancel={editable ? onPointerUp : undefined}
    >
      {has ? (
        <MenuItemBadges item={item} theme={theme} layout="freeform" fontSize={style.fontSize} />
      ) : (
        <span
          className="text-[9px] uppercase tracking-wide px-2 py-0.5 rounded border border-dashed border-blue-400 text-blue-600 bg-white/80"
        >
          Tags
        </span>
      )}
    </div>
  );
}

const ProductComposition = ({
  item,
  idx,
  theme,
  onTap,
  editable,
  textStyles,
  selectedField,
  onSelectLabel,
  onTextStylesChange,
}: {
  item: MenuItem;
  idx: number;
  theme: RestaurantTheme;
  onTap: () => void;
  editable?: boolean;
  textStyles?: ItemTextStyles;
  selectedField?: LabelField | null;
  onSelectLabel?: (field: LabelField) => void;
  onTextStylesChange?: (styles: ItemTextStyles) => void;
}) => {
  const img = itemImageSrc(item);
  const cardRef = useRef<HTMLDivElement>(null);
  const nameStyle = mergeLabelStyle(DEFAULT_MENU_NAME_LABEL, textStyles?.name);
  const priceStyle = mergeLabelStyle(DEFAULT_MENU_PRICE_LABEL, textStyles?.price);
  const tagsStyle = mergeLabelStyle(DEFAULT_MENU_TAGS_LABEL, textStyles?.tags);
  const useFreeLabels =
    editable || Boolean(textStyles?.name || textStyles?.price);
  const useFreeTags = editable || Boolean(textStyles?.tags);

  const glowPulse = {
    boxShadow: [
      `0 0 0 0 ${theme.primary}00`,
      `0 0 28px 4px ${theme.primary}55`,
      `0 0 0 0 ${theme.primary}00`,
    ],
  };

  return (
    <motion.button
      type="button"
      aria-label={`${item.name}. Tap for ingredients and details.`}
      onClick={() => {
        if (editable) return;
        lightTap();
        onTap();
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + idx * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative block w-full pb-2 pt-1 active:scale-[0.99] transition-transform rounded-[2rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        ["--tw-ring-color" as string]: theme.primary,
        ["--tw-ring-offset-color" as string]: theme.background,
        cursor: editable ? "move" : undefined,
      }}
    >
      <motion.div
        ref={cardRef}
        className="relative mx-auto w-full rounded-[2rem] px-1 pt-1"
        initial={false}
        animate={glowPulse}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: idx * 0.15 }}
      >
        <div
          className="relative rounded-[1.75rem] overflow-hidden"
          style={{
            zIndex: LAYERS.image,
            filter: "drop-shadow(0 18px 36px rgba(0,0,0,0.16))",
          }}
        >
          {img ? (
            <img
              src={img}
              alt={item.name}
              loading="lazy"
              className="w-full aspect-square object-contain"
              style={itemImageScaleStyle(item)}
              draggable={false}
            />
          ) : (
            <div className="w-full aspect-square flex items-center justify-center">
              <span
                className="font-black select-none"
                style={{
                  fontFamily: theme.typography.fonts.heading,
                  fontSize: "clamp(42px, 13vw, 72px)",
                  color: "rgba(0,0,0,0.05)",
                }}
              >
                {item.name.charAt(0)}
              </span>
            </div>
          )}
          {!useFreeTags && <MenuItemBadges item={item} theme={theme} layout="overlay" />}
        </div>

        {useFreeTags && (
          <EditableTagsBox
            item={item}
            theme={theme}
            style={tagsStyle}
            editable={editable}
            selected={selectedField === "tags"}
            onSelect={() => onSelectLabel?.("tags")}
            cardRef={cardRef}
            onStyleChange={(next) =>
              onTextStylesChange?.({
                ...textStyles,
                tags: next,
              })
            }
          />
        )}

        {useFreeLabels ? (
          <>
            <EditableLabel
              text={item.name}
              style={nameStyle}
              themeColor={theme.text}
              fontFamily={theme.typography.fonts.heading}
              fontWeight={theme.typography.weights.itemName}
              letterSpacing={theme.typography.letterSpacing.heading}
              lineHeight={theme.typography.lineHeights.normal}
              editable={editable}
              selected={selectedField === "name"}
              onSelect={() => onSelectLabel?.("name")}
              cardRef={cardRef}
              onStyleChange={(next) =>
                onTextStylesChange?.({
                  ...textStyles,
                  name: next,
                })
              }
            />
            <EditableLabel
              text={`₹${item.price}`}
              style={priceStyle}
              themeColor={theme.primary}
              fontFamily={theme.typography.fonts.price}
              fontWeight={theme.typography.weights.price}
              letterSpacing={theme.typography.letterSpacing.heading}
              editable={editable}
              selected={selectedField === "price"}
              onSelect={() => onSelectLabel?.("price")}
              cardRef={cardRef}
              onStyleChange={(next) =>
                onTextStylesChange?.({
                  ...textStyles,
                  price: next,
                })
              }
            />
          </>
        ) : (
          <div
            className="absolute left-1/2 -translate-x-1/2 -bottom-2"
            style={{ zIndex: LAYERS.text, width: "92%" }}
          >
            <p
              className="truncate text-center"
              style={{
                fontFamily: theme.typography.fonts.heading,
                fontSize: "clamp(12px, 3.2vw, 15px)",
                color: theme.text,
                letterSpacing: theme.typography.letterSpacing.heading,
                fontWeight: theme.typography.weights.itemName,
                lineHeight: theme.typography.lineHeights.normal,
                textShadow: "0 2px 10px rgba(255,255,255,0.9), 0 0 2px rgba(0,0,0,0.08)",
              }}
            >
              {item.name}
            </p>
            <p
              className="text-center"
              style={{
                fontFamily: theme.typography.fonts.price,
                fontSize: "clamp(12px, 3.2vw, 15px)",
                color: theme.primary,
                fontWeight: theme.typography.weights.price,
                letterSpacing: theme.typography.letterSpacing.heading,
                marginTop: "2px",
                textShadow: "0 2px 8px rgba(255,255,255,0.85)",
              }}
            >
              ₹{item.price}
            </p>
          </div>
        )}
      </motion.div>
    </motion.button>
  );
};

const CORNER_HANDLES: {
  mode: DragMode;
  className: string;
  Icon: typeof MoveDiagonal;
  label: string;
}[] = [
  {
    mode: "resize-nw",
    className: "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize",
    Icon: MoveDiagonal2,
    label: "Resize northwest",
  },
  {
    mode: "resize-ne",
    className: "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize",
    Icon: MoveDiagonal,
    label: "Resize northeast",
  },
  {
    mode: "resize-sw",
    className: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize",
    Icon: MoveDiagonal,
    label: "Resize southwest",
  },
  {
    mode: "resize-se",
    className: "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize",
    Icon: MoveDiagonal2,
    label: "Resize southeast",
  },
];

const MenuBookPage = ({
  page,
  theme,
  onItemTap,
  editable = false,
  itemFrames,
  onItemFrameChange,
  itemTextStyles,
  onItemTextStyleChange,
  tapHintStyle: tapHintStyleProp,
  onTapHintStyleChange,
  selectedLabel,
  onSelectLabel,
}: MenuBookPageProps) => {
  const { items, categoryName } = page;
  const slots = SLOT_LIBRARY[Math.min(items.length, 5)] || SLOT_LIBRARY[5];
  const areaRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    name: string;
    mode: DragMode;
    startX: number;
    startY: number;
    origin: ItemSlotFrame;
  } | null>(null);

  const tapHintStyle = mergeLabelStyle(DEFAULT_MENU_TAP_HINT_LABEL, tapHintStyleProp);
  const useFreeTapHint = editable || Boolean(tapHintStyleProp);

  const resolveFrame = (item: MenuItem, idx: number): ItemSlotFrame => {
    const saved = itemFrames?.[item.name];
    if (saved) return saved;
    const slot = slots[idx] || slots[slots.length - 1];
    return {
      top: parsePct(slot.top),
      left: parsePct(slot.left),
      width: parsePct(slot.width),
    };
  };

  const beginDrag = (
    e: React.PointerEvent,
    item: MenuItem,
    idx: number,
    mode: DragMode,
  ) => {
    if (!editable || !onItemFrameChange) return;
    e.preventDefault();
    e.stopPropagation();
    const origin = resolveFrame(item, idx);
    dragRef.current = {
      name: item.name,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origin: { ...origin },
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    const area = areaRef.current;
    if (!drag || !area || !onItemFrameChange) return;
    const rect = area.getBoundingClientRect();
    const dx = ((e.clientX - drag.startX) / rect.width) * 100;
    const dy = ((e.clientY - drag.startY) / rect.height) * 100;
    const o = drag.origin;
    let next: ItemSlotFrame = { ...o };

    if (drag.mode === "move") {
      next = {
        left: clamp(o.left + dx, MIN_LEFT, MAX_LEFT),
        top: clamp(o.top + dy, MIN_TOP, MAX_TOP),
        width: o.width,
      };
    } else if (drag.mode === "resize-se") {
      next = {
        ...o,
        width: clamp(o.width + dx, MIN_WIDTH, MAX_WIDTH),
      };
    } else if (drag.mode === "resize-sw") {
      const width = clamp(o.width - dx, MIN_WIDTH, MAX_WIDTH);
      const left = clamp(o.left + (o.width - width), MIN_LEFT, MAX_LEFT);
      next = { ...o, left, width };
    } else if (drag.mode === "resize-ne") {
      const width = clamp(o.width + dx, MIN_WIDTH, MAX_WIDTH);
      next = {
        left: o.left,
        top: clamp(o.top + dy * 0.35, MIN_TOP, MAX_TOP),
        width,
      };
    } else if (drag.mode === "resize-nw") {
      const width = clamp(o.width - dx, MIN_WIDTH, MAX_WIDTH);
      const left = clamp(o.left + (o.width - width), MIN_LEFT, MAX_LEFT);
      next = {
        left,
        top: clamp(o.top + dy * 0.35, MIN_TOP, MAX_TOP),
        width,
      };
    }

    onItemFrameChange(drag.name, next);
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div className="h-full w-full relative overflow-hidden select-none" style={{ background: theme.background }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.45 }}
        className="absolute inset-0 pointer-events-none flex items-center justify-center px-4"
        style={{ zIndex: LAYERS.background }}
      >
        <p
          className="text-center uppercase leading-[0.9]"
          style={{
            fontFamily: theme.typography.fonts.heading,
            fontSize: "clamp(40px, 16vw, 68px)",
            color: theme.primary,
            opacity: 0.07,
            letterSpacing: theme.typography.letterSpacing.ui,
            fontWeight: theme.typography.weights.heading,
          }}
        >
          {categoryName.toUpperCase()}
        </p>
      </motion.div>

      <div
        ref={areaRef}
        className="absolute inset-0 px-2 pt-[96px] pb-6"
        style={{ zIndex: LAYERS.image }}
        onPointerMove={editable ? onPointerMove : undefined}
        onPointerUp={editable ? onPointerUp : undefined}
        onPointerCancel={editable ? onPointerUp : undefined}
      >
        {items.slice(0, 5).map((item, idx) => {
          const frame = resolveFrame(item, idx);
          return (
            <div
              key={`${page.pageLabel}-${item.name}-${idx}`}
              className="absolute"
              style={{
                top: `${frame.top}%`,
                left: `${frame.left}%`,
                width: `${frame.width}%`,
                outline: editable ? "1px dashed rgba(37,99,235,0.45)" : undefined,
                zIndex: dragRef.current?.name === item.name ? 30 : undefined,
              }}
              onPointerDown={(e) => beginDrag(e, item, idx, "move")}
            >
              <ProductComposition
                item={item}
                idx={idx}
                theme={theme}
                editable={editable}
                textStyles={itemTextStyles?.[item.name]}
                selectedField={
                  selectedLabel?.itemName === item.name ? selectedLabel.field : null
                }
                onSelectLabel={(field) => onSelectLabel?.({ itemName: item.name, field })}
                onTextStylesChange={
                  onItemTextStyleChange
                    ? (styles) => onItemTextStyleChange(item.name, styles)
                    : undefined
                }
                onTap={() => onItemTap(idx)}
              />
              {editable &&
                CORNER_HANDLES.map(({ mode, className, Icon, label }) => (
                  <button
                    key={mode}
                    type="button"
                    aria-label={label}
                    title={label}
                    className={`absolute z-40 flex h-7 w-7 items-center justify-center rounded-full border-2 border-blue-600 bg-white text-blue-600 shadow-md ${className}`}
                    onPointerDown={(e) => beginDrag(e, item, idx, mode)}
                  >
                    <Icon size={14} strokeWidth={2.5} />
                  </button>
                ))}
            </div>
          );
        })}

        {useFreeTapHint ? (
          <EditableLabel
            text="Tap to view"
            style={tapHintStyle}
            themeColor={theme.primary}
            fontFamily={theme.typography.fonts.ui}
            fontWeight={theme.typography.weights.ui}
            letterSpacing={theme.typography.letterSpacing.ui}
            editable={editable}
            selected={selectedLabel?.field === "tapHint"}
            onSelect={() => onSelectLabel?.({ itemName: "", field: "tapHint" })}
            cardRef={areaRef}
            onStyleChange={onTapHintStyleChange}
          />
        ) : (
          <p
            className="absolute left-1/2 -translate-x-1/2 bottom-1 text-center tracking-[0.12em] uppercase opacity-80 pointer-events-none"
            style={{
              zIndex: LAYERS.text,
              fontFamily: theme.typography.fonts.ui,
              fontSize: "clamp(7px, 2vw, 9px)",
              fontWeight: theme.typography.weights.ui,
              letterSpacing: theme.typography.letterSpacing.ui,
              color: theme.primary,
            }}
          >
            Tap to view
          </p>
        )}
      </div>

      <div className="absolute top-0 bottom-0 right-0 w-[2px] bg-gradient-to-l from-black/[0.06] to-transparent" />
      <div className="absolute top-0 bottom-0 left-0 w-[1px] bg-black/[0.02]" />
    </div>
  );
};

export default MenuBookPage;
