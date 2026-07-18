import { useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, MoveDiagonal, MoveDiagonal2 } from "lucide-react";
import { MenuItem } from "@/data/menuData";
import { RestaurantTheme } from "@/data/restaurantThemes";
import {
  DEFAULT_DETAIL_BACK_LABEL,
  DEFAULT_DETAIL_COUNTER_LABEL,
  DEFAULT_DETAIL_DESCRIPTION_LABEL,
  DEFAULT_DETAIL_NAME_LABEL,
  DEFAULT_DETAIL_PRICE_LABEL,
  DEFAULT_DETAIL_TAGS_LABEL,
  mergeDetailVisibility,
  mergeLabelStyle,
  type DetailLabelField,
  type DetailVisibility,
  type ItemLabelStyle,
} from "@/layouts/itemLabelStyles";
import { resolveThemeFont } from "@/layouts/textStyles";
import { itemImageSrc, itemImageScaleStyle } from "./menuImages";
import { MenuItemBadges, itemHasBadges } from "./MenuItemBadges";

export type DetailImageFrame = { top: number; left: number; width: number };
export type { ItemLabelStyle, DetailLabelField, DetailVisibility };

interface MenuItemDetailProps {
  item: MenuItem;
  heroImage?: string;
  categoryName: string;
  theme: RestaurantTheme;
  onBack: () => void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
  currentIndex: number;
  totalItems: number;
  /** Layout editor: allow dragging the hero image off-page */
  editable?: boolean;
  imageFrame?: DetailImageFrame;
  onImageFrameChange?: (frame: DetailImageFrame) => void;
  nameStyle?: Partial<ItemLabelStyle>;
  priceStyle?: Partial<ItemLabelStyle>;
  tagsStyle?: Partial<ItemLabelStyle>;
  descriptionStyle?: Partial<ItemLabelStyle>;
  backBtnStyle?: Partial<ItemLabelStyle>;
  counterStyle?: Partial<ItemLabelStyle>;
  visibility?: DetailVisibility;
  onNameStyleChange?: (style: ItemLabelStyle) => void;
  onPriceStyleChange?: (style: ItemLabelStyle) => void;
  onTagsStyleChange?: (style: ItemLabelStyle) => void;
  onDescriptionStyleChange?: (style: ItemLabelStyle) => void;
  onBackBtnStyleChange?: (style: ItemLabelStyle) => void;
  onCounterStyleChange?: (style: ItemLabelStyle) => void;
  selectedLabel?: DetailLabelField | null;
  onSelectLabel?: (field: DetailLabelField | null) => void;
}

type DragMode = "move" | "resize-nw" | "resize-ne" | "resize-sw" | "resize-se";

const MIN_WIDTH = 40;
const MAX_WIDTH = 130;
const MIN_LEFT = -55;
const MAX_LEFT = 80;
const MIN_TOP = -5;
const MAX_TOP = 70;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

const CORNER_HANDLES: {
  mode: DragMode;
  className: string;
  Icon: typeof MoveDiagonal;
  label: string;
}[] = [
  { mode: "resize-nw", className: "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize", Icon: MoveDiagonal2, label: "Resize northwest" },
  { mode: "resize-ne", className: "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize", Icon: MoveDiagonal, label: "Resize northeast" },
  { mode: "resize-sw", className: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize", Icon: MoveDiagonal, label: "Resize southwest" },
  { mode: "resize-se", className: "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize", Icon: MoveDiagonal2, label: "Resize southeast" },
];

function defaultFrame(imageSide: "left" | "right", isPlated: boolean): DetailImageFrame {
  if (imageSide === "right") {
    return { top: 14, left: isPlated ? 18 : 28, width: isPlated ? 105 : 92 };
  }
  return { top: 14, left: isPlated ? -23 : -12, width: isPlated ? 105 : 92 };
}

const LABEL_WIDTH_MIN = 28;
const LABEL_WIDTH_MAX = 95;
const LABEL_WIDTH_STEP = 8;
/** Width at/above this → prefer single line. */
const LABEL_EXPAND_WIDTH = 78;

function resolveMaxLines(style: ItemLabelStyle): 1 | 2 {
  if (style.maxLines === 1 || style.maxLines === 2) return style.maxLines;
  const w = style.width ?? 72;
  return w >= LABEL_EXPAND_WIDTH ? 1 : 2;
}

function DetailEditableLabel({
  text,
  style,
  theme,
  themeColor,
  fontFamily,
  fontWeight,
  letterSpacing,
  lineHeight,
  editable,
  selected,
  onSelect,
  onStyleChange,
  areaRef,
  align,
}: {
  text: string;
  style: ItemLabelStyle;
  theme: RestaurantTheme;
  themeColor: string;
  fontFamily: string;
  fontWeight: number | string;
  letterSpacing?: string;
  lineHeight?: string | number;
  editable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onStyleChange?: (next: ItemLabelStyle) => void;
  areaRef: React.RefObject<HTMLDivElement | null>;
  align: "left" | "right";
}) {
  const dragRef = useRef<{ startX: number; startY: number; origin: ItemLabelStyle } | null>(null);

  const boxWidth = style.width ?? 72;
  const maxLines = resolveMaxLines(style);
  const resolvedFamily = resolveThemeFont(theme, style.fontFamily, fontFamily);
  const resolvedAlign = style.textAlign ?? align;

  const patchWidth = (nextWidth: number, fromEdge: "w" | "e") => {
    if (!onStyleChange) return;
    const width = clamp(nextWidth, LABEL_WIDTH_MIN, LABEL_WIDTH_MAX);
    const maxLinesNext: 1 | 2 = width >= LABEL_EXPAND_WIDTH ? 1 : 2;
    let x = style.x;
    if (fromEdge === "w" && align === "left") {
      x = clamp(style.x - (width - boxWidth), -5, 95);
    } else if (fromEdge === "e" && align === "right") {
      x = clamp(style.x + (width - boxWidth), -5, 95);
    }
    onStyleChange({ ...style, width, maxLines: maxLinesNext, x });
  };

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
    const area = areaRef.current;
    if (!drag || !area || !onStyleChange) return;
    const rect = area.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const dx = ((e.clientX - drag.startX) / rect.width) * 100;
    const dy = ((e.clientY - drag.startY) / rect.height) * 100;
    onStyleChange({
      ...drag.origin,
      x: clamp(drag.origin.x + dx, -5, 95),
      y: clamp(drag.origin.y + dy, 5, 95),
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
        transform: resolvedAlign === "right" ? "translate(-100%, 0)" : "translate(0, 0)",
        textAlign: resolvedAlign,
        zIndex: 20,
        outline: editable && selected ? "1.5px solid #2563eb" : editable ? "1px dashed rgba(37,99,235,0.35)" : undefined,
        outlineOffset: 3,
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
          fontFamily: resolvedFamily,
          fontSize: style.fontSize,
          color: style.color || themeColor,
          letterSpacing,
          fontWeight: style.fontWeight ?? fontWeight,
          lineHeight,
          margin: 0,
          overflow: "hidden",
          ...(maxLines === 1
            ? {
                whiteSpace: "nowrap" as const,
                textOverflow: "ellipsis",
              }
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
            className="absolute top-1/2 left-0 z-40 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-blue-600 bg-white text-blue-600 shadow-sm"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect?.();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              patchWidth(boxWidth - LABEL_WIDTH_STEP, "w");
            }}
          >
            <ChevronLeft size={14} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-label="Expand text width"
            title="Wider · single line"
            className="absolute top-1/2 right-0 z-40 flex h-6 w-6 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-blue-600 bg-white text-blue-600 shadow-sm"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect?.();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              patchWidth(boxWidth + LABEL_WIDTH_STEP, "e");
            }}
          >
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        </>
      )}
    </div>
  );
}

function DetailEditableTags({
  item,
  theme,
  style,
  editable,
  selected,
  onSelect,
  onStyleChange,
  areaRef,
  align,
}: {
  item: MenuItem;
  theme: RestaurantTheme;
  style: ItemLabelStyle;
  editable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onStyleChange?: (next: ItemLabelStyle) => void;
  areaRef: React.RefObject<HTMLDivElement | null>;
  align: "left" | "right";
}) {
  const dragRef = useRef<{ startX: number; startY: number; origin: ItemLabelStyle } | null>(null);
  const has = itemHasBadges(item, { showJain: true });

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
    const area = areaRef.current;
    if (!drag || !area || !onStyleChange) return;
    const rect = area.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const dx = ((e.clientX - drag.startX) / rect.width) * 100;
    const dy = ((e.clientY - drag.startY) / rect.height) * 100;
    onStyleChange({
      ...drag.origin,
      x: clamp(drag.origin.x + dx, -5, 95),
      y: clamp(drag.origin.y + dy, 5, 95),
    });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  if (!has && !editable) return null;

  return (
    <div
      className={`absolute z-20 max-w-[85%] ${editable ? "cursor-move select-none" : "pointer-events-none"}`}
      style={{
        left: `${style.x}%`,
        top: `${style.y}%`,
        transform: align === "right" ? "translate(-100%, 0)" : "translate(0, 0)",
        outline: editable && selected ? "1.5px solid #2563eb" : editable ? "1px dashed rgba(37,99,235,0.35)" : undefined,
        outlineOffset: 3,
        padding: editable ? 2 : undefined,
        touchAction: editable ? "none" : undefined,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={editable ? onPointerMove : undefined}
      onPointerUp={editable ? onPointerUp : undefined}
      onPointerCancel={editable ? onPointerUp : undefined}
    >
      {has ? (
        <MenuItemBadges item={item} theme={theme} layout="freeform" showJain fontSize={style.fontSize} />
      ) : (
        <span className="text-[9px] uppercase tracking-wide px-2 py-0.5 rounded border border-dashed border-blue-400 text-blue-600 bg-white/80">
          Tags
        </span>
      )}
    </div>
  );
}

const CONTROL_DRAG_THRESHOLD_PX = 6;

function DetailEditableControl({
  style,
  editable,
  selected,
  onSelect,
  onStyleChange,
  areaRef,
  children,
  onActivate,
  disabled,
  ariaLabel,
}: {
  style: ItemLabelStyle;
  editable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onStyleChange?: (next: ItemLabelStyle) => void;
  areaRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
  onActivate?: () => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  const dragRef = useRef<{ startX: number; startY: number; origin: ItemLabelStyle } | null>(null);
  const movedRef = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!editable || !onStyleChange) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect?.();
    movedRef.current = false;
    dragRef.current = { startX: e.clientX, startY: e.clientY, origin: { ...style } };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    const area = areaRef.current;
    if (!drag || !area || !onStyleChange) return;
    const px = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
    if (px < CONTROL_DRAG_THRESHOLD_PX) return;
    movedRef.current = true;
    const rect = area.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const dx = ((e.clientX - drag.startX) / rect.width) * 100;
    const dy = ((e.clientY - drag.startY) / rect.height) * 100;
    onStyleChange({
      ...drag.origin,
      x: clamp(drag.origin.x + dx, -5, 95),
      y: clamp(drag.origin.y + dy, 2, 98),
    });
  };

  const finishPointer = () => {
    const wasDrag = movedRef.current;
    dragRef.current = null;
    movedRef.current = false;
    // Tap (no drag) always navigates, even while editing chrome position.
    if (!wasDrag && !disabled) onActivate?.();
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled && !editable}
      onClick={(e) => {
        if (editable) {
          e.preventDefault();
          onSelect?.();
          return;
        }
        if (!disabled) onActivate?.();
      }}
      className={`absolute z-30 flex items-center justify-center rounded-full ${
        editable ? "cursor-move" : "active:scale-90"
      } ${disabled && !editable ? "opacity-15" : ""}`}
      style={{
        left: `${style.x}%`,
        top: `${style.y}%`,
        transform: "translate(-50%, -50%)",
        width: Math.max(36, style.fontSize * 2.2),
        height: Math.max(36, style.fontSize * 2.2),
        background: "rgba(255,255,255,0.5)",
        backdropFilter: "blur(6px)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        outline: editable && selected ? "1.5px solid #2563eb" : editable ? "1px dashed rgba(37,99,235,0.35)" : undefined,
        outlineOffset: 2,
        touchAction: editable ? "none" : undefined,
        color: style.color,
        opacity: disabled && editable ? 0.45 : undefined,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={editable ? onPointerMove : undefined}
      onPointerUp={editable ? finishPointer : undefined}
      onPointerCancel={
        editable
          ? () => {
              dragRef.current = null;
              movedRef.current = false;
            }
          : undefined
      }
    >
      {children}
    </button>
  );
}

const MenuItemDetail = ({
  item,
  heroImage,
  categoryName,
  theme,
  onBack,
  onPrev,
  onNext,
  currentIndex,
  totalItems,
  editable = false,
  imageFrame,
  onImageFrameChange,
  nameStyle: nameStyleProp,
  priceStyle: priceStyleProp,
  tagsStyle: tagsStyleProp,
  descriptionStyle: descriptionStyleProp,
  backBtnStyle: backBtnStyleProp,
  counterStyle: counterStyleProp,
  visibility: visibilityProp,
  onNameStyleChange,
  onPriceStyleChange,
  onTagsStyleChange,
  onDescriptionStyleChange,
  onBackBtnStyleChange,
  onCounterStyleChange,
  selectedLabel,
  onSelectLabel,
}: MenuItemDetailProps) => {
  const LAYERS = { background: 0, image: 10, text: 20, controls: 30 } as const;
  const areaRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    origin: DetailImageFrame;
  } | null>(null);

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (editable) return;
    if (info.offset.x < -60 && onNext) onNext();
    else if (info.offset.x > 60 && onPrev) onPrev();
  };

  const img = itemImageSrc(item) || heroImage;
  const isPlatedCategory = /pizza|pasta|appetizer|non veg/i.test(categoryName);
  const imageSide = currentIndex % 2 === 0 ? "right" : "left";
  const textAlign = imageSide === "right" ? "left" : "right";
  const useFreeform = editable || Boolean(imageFrame);
  const frame = imageFrame ?? defaultFrame(imageSide, isPlatedCategory);
  const vis = mergeDetailVisibility(visibilityProp);
  const nameStyle = mergeLabelStyle(
    {
      ...DEFAULT_DETAIL_NAME_LABEL,
      x: textAlign === "left" ? 6 : 94,
    },
    nameStyleProp,
  );
  const priceStyle = mergeLabelStyle(
    {
      ...DEFAULT_DETAIL_PRICE_LABEL,
      x: textAlign === "left" ? 6 : 94,
    },
    priceStyleProp,
  );
  const tagsStyleMerged = mergeLabelStyle(
    {
      ...DEFAULT_DETAIL_TAGS_LABEL,
      x: textAlign === "left" ? 6 : 94,
    },
    tagsStyleProp,
  );
  const descriptionStyle = mergeLabelStyle(
    {
      ...DEFAULT_DETAIL_DESCRIPTION_LABEL,
      x: textAlign === "left" ? 6 : 94,
    },
    descriptionStyleProp,
  );
  const backStyle = mergeLabelStyle(DEFAULT_DETAIL_BACK_LABEL, backBtnStyleProp);
  const counterStyleMerged = mergeLabelStyle(DEFAULT_DETAIL_COUNTER_LABEL, counterStyleProp);
  const useFreeText =
    editable ||
    Boolean(nameStyleProp || priceStyleProp || descriptionStyleProp);
  const useFreeTags = editable || Boolean(tagsStyleProp);
  const useFreeChrome =
    editable || Boolean(backBtnStyleProp || counterStyleProp);

  const beginDrag = (e: React.PointerEvent, mode: DragMode) => {
    if (!editable || !onImageFrameChange) return;
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origin: { ...frame },
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    const area = areaRef.current;
    if (!drag || !area || !onImageFrameChange) return;
    const rect = area.getBoundingClientRect();
    const dx = ((e.clientX - drag.startX) / rect.width) * 100;
    const dy = ((e.clientY - drag.startY) / rect.height) * 100;
    const o = drag.origin;
    let next: DetailImageFrame = { ...o };

    if (drag.mode === "move") {
      next = {
        left: clamp(o.left + dx, MIN_LEFT, MAX_LEFT),
        top: clamp(o.top + dy, MIN_TOP, MAX_TOP),
        width: o.width,
      };
    } else if (drag.mode === "resize-se") {
      next = { ...o, width: clamp(o.width + dx, MIN_WIDTH, MAX_WIDTH) };
    } else if (drag.mode === "resize-sw") {
      const width = clamp(o.width - dx, MIN_WIDTH, MAX_WIDTH);
      next = { ...o, left: clamp(o.left + (o.width - width), MIN_LEFT, MAX_LEFT), width };
    } else if (drag.mode === "resize-ne") {
      next = {
        left: o.left,
        top: clamp(o.top + dy * 0.35, MIN_TOP, MAX_TOP),
        width: clamp(o.width + dx, MIN_WIDTH, MAX_WIDTH),
      };
    } else if (drag.mode === "resize-nw") {
      const width = clamp(o.width - dx, MIN_WIDTH, MAX_WIDTH);
      next = {
        left: clamp(o.left + (o.width - width), MIN_LEFT, MAX_LEFT),
        top: clamp(o.top + dy * 0.35, MIN_TOP, MAX_TOP),
        width,
      };
    }

    onImageFrameChange(next);
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const shellClass = useFreeform || useFreeText || useFreeChrome || useFreeTags
    ? "absolute inset-0 z-50 overflow-hidden"
    : "fixed inset-0 z-50 overflow-hidden";

  const textBlock = useFreeText ? (
    <>
      <DetailEditableLabel
        text={item.name.toUpperCase()}
        style={nameStyle}
        theme={theme}
        themeColor={theme.text}
        fontFamily={theme.typography.fonts.heading}
        fontWeight={theme.typography.weights.itemName}
        letterSpacing={theme.typography.letterSpacing.heading}
        lineHeight={theme.typography.lineHeights.compact}
        editable={editable}
        selected={selectedLabel === "name"}
        onSelect={() => onSelectLabel?.("name")}
        onStyleChange={onNameStyleChange}
        areaRef={areaRef}
        align={textAlign}
      />
      {vis.description && item.description && (
        <DetailEditableLabel
          text={item.description}
          style={descriptionStyle}
          theme={theme}
          themeColor={theme.textSecondary}
          fontFamily={theme.typography.fonts.body}
          fontWeight={theme.typography.weights.body}
          letterSpacing={theme.typography.letterSpacing.body}
          lineHeight={theme.typography.lineHeights.relaxed}
          editable={editable}
          selected={selectedLabel === "description"}
          onSelect={() => onSelectLabel?.("description")}
          onStyleChange={onDescriptionStyleChange}
          areaRef={areaRef}
          align={textAlign}
        />
      )}
      <DetailEditableLabel
        text={`₹${item.price}`}
        style={priceStyle}
        theme={theme}
        themeColor={theme.primary}
        fontFamily={theme.typography.fonts.price}
        fontWeight={theme.typography.weights.price}
        letterSpacing={theme.typography.letterSpacing.heading}
        editable={editable}
        selected={selectedLabel === "price"}
        onSelect={() => onSelectLabel?.("price")}
        onStyleChange={onPriceStyleChange}
        areaRef={areaRef}
        align={textAlign}
      />
    </>
  ) : (
    <div
      className={`relative px-6 pb-3 ${useFreeform ? "mt-auto pt-4" : "-mt-1"} ${imageSide === "right" ? "text-left" : "text-right"}`}
      style={{ zIndex: LAYERS.text, paddingLeft: "24px", paddingRight: "24px" }}
    >
      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="leading-[1] mt-1"
        style={{
          fontFamily: theme.typography.fonts.heading,
          fontSize: "clamp(26px, 8vw, 36px)",
          color: theme.text,
          letterSpacing: theme.typography.letterSpacing.heading,
          fontWeight: theme.typography.weights.itemName,
          lineHeight: theme.typography.lineHeights.compact,
        }}
      >
        {item.name.toUpperCase()}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="mt-2 leading-[1.6]"
        style={{
          fontFamily: theme.typography.fonts.body,
          fontSize: theme.typography.scale.xs,
          color: theme.textSecondary,
          maxWidth: "320px",
          lineHeight: theme.typography.lineHeights.relaxed,
          letterSpacing: theme.typography.letterSpacing.body,
          fontWeight: theme.typography.weights.body,
          marginTop: theme.typography.spacing.titleToDescription,
          marginLeft: imageSide === "right" ? "0" : "auto",
          display: vis.description ? undefined : "none",
        }}
      >
        {item.description}
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-3"
        style={{
          fontFamily: theme.typography.fonts.price,
          fontSize: "clamp(22px, 6vw, 30px)",
          color: theme.primary,
          fontWeight: theme.typography.weights.price,
          letterSpacing: theme.typography.letterSpacing.heading,
        }}
      >
        ₹{item.price}
      </motion.p>

      {vis.tags && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className={`flex items-center gap-2 mt-3 ${imageSide === "right" ? "justify-start" : "justify-end"}`}
        >
          <MenuItemBadges item={item} theme={theme} layout="inline" showJain />
        </motion.div>
      )}
    </div>
  );

  return (
    <motion.div
      className={shellClass}
      style={{ background: "transparent" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      ref={areaRef}
      onPointerMove={editable ? onPointerMove : undefined}
      onPointerUp={editable ? onPointerUp : undefined}
      onPointerCancel={editable ? onPointerUp : undefined}
    >
      <motion.div
        className="h-full flex flex-col relative z-10"
        drag={editable ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        onDragEnd={handleDragEnd}
      >
        {vis.back &&
          (useFreeChrome ? (
            <DetailEditableControl
              style={backStyle}
              editable={editable}
              selected={selectedLabel === "back"}
              onSelect={() => onSelectLabel?.("back")}
              onStyleChange={onBackBtnStyleChange}
              areaRef={areaRef}
              onActivate={onBack}
              ariaLabel="Back"
            >
              <ArrowLeft size={Math.round(backStyle.fontSize)} style={{ color: backStyle.color || theme.text }} />
            </DetailEditableControl>
          ) : (
            <motion.button
              onClick={onBack}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
          className="absolute top-6 left-5 w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
          style={{ zIndex: LAYERS.controls, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
        >
          <ArrowLeft size={16} style={{ color: theme.text }} />
        </motion.button>
          ))}

        {vis.counter &&
          (useFreeChrome ? (
            <DetailEditableLabel
              text={`${currentIndex + 1} / ${totalItems}`}
              style={counterStyleMerged}
              theme={theme}
              themeColor={theme.textSecondary}
              fontFamily={theme.typography.fonts.ui}
              fontWeight={theme.typography.weights.ui}
              letterSpacing={theme.typography.letterSpacing.ui}
              editable={editable}
              selected={selectedLabel === "counter"}
              onSelect={() => onSelectLabel?.("counter")}
              onStyleChange={onCounterStyleChange}
              areaRef={areaRef}
              align="left"
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
          className="absolute top-7 right-5 text-[11px] font-medium tracking-wider"
          style={{
            zIndex: LAYERS.controls,
            fontFamily: theme.typography.fonts.ui,
            color: theme.textSecondary,
            fontWeight: theme.typography.weights.ui,
            letterSpacing: theme.typography.letterSpacing.ui,
          }}
        >
          {currentIndex + 1} / {totalItems}
        </motion.div>
          ))}

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ zIndex: LAYERS.background }}
        >
          {[0.1, 0.07, 0.05].map((opacity, i) => (
            <p
              key={i}
              className="leading-[0.86] uppercase text-center"
              style={{
                fontFamily: theme.typography.fonts.heading,
                fontSize: "clamp(52px, 16vw, 84px)",
                color: theme.pageTitle ?? theme.primary,
                opacity,
                marginTop: i === 0 ? "96px" : "8px",
                letterSpacing: theme.typography.letterSpacing.heading,
                fontWeight: theme.typography.weights.heading,
                lineHeight: theme.typography.lineHeights.compact,
              }}
            >
              {categoryName.toUpperCase()}
            </p>
          ))}
        </motion.div>

        {item.isNew && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute top-14 right-4 pointer-events-none"
            style={{ zIndex: LAYERS.text }}
          >
            {[0.25, 0.12].map((opacity, i) => (
              <p
                key={i}
                className="leading-[0.95] uppercase text-right"
                style={{
                  fontFamily: theme.typography.fonts.heading,
                  fontSize: "clamp(16px, 5vw, 22px)",
                  color: theme.primary,
                  opacity,
                  letterSpacing: theme.typography.letterSpacing.ui,
                  fontWeight: theme.typography.weights.heading,
                }}
              >
                IT'S NEW
              </p>
            ))}
          </motion.div>
        )}

        {useFreeform ? (
          <div
            className="absolute"
            style={{
              zIndex: LAYERS.image,
              top: `${frame.top}%`,
              left: `${frame.left}%`,
              width: `${frame.width}%`,
              outline: editable ? "1px dashed rgba(37,99,235,0.45)" : undefined,
              filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.25))",
              touchAction: editable ? "none" : undefined,
            }}
            onPointerDown={(e) => beginDrag(e, "move")}
          >
            <motion.div
              key={item.name}
              initial={editable ? false : { scale: 0.3, opacity: 0, rotate: isPlatedCategory ? 5 : -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full"
            >
              {img ? (
                <img
                  src={img}
                  alt={item.name}
                  className={`w-full ${isPlatedCategory ? "aspect-square object-cover rounded-full" : "aspect-square object-contain"}`}
                  style={itemImageScaleStyle(item)}
                  draggable={false}
                />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center">
                  <span
                    className="select-none"
                    style={{ fontFamily: theme.typography.fonts.heading, fontSize: "140px", color: "rgba(0,0,0,0.03)" }}
                  >
                    {item.name.charAt(0)}
                  </span>
                </div>
              )}
            </motion.div>
            {editable &&
              CORNER_HANDLES.map(({ mode, className, Icon, label }) => (
                <button
                  key={mode}
                  type="button"
                  aria-label={label}
                  title={label}
                  className={`absolute z-40 flex h-7 w-7 items-center justify-center rounded-full border-2 border-blue-600 bg-white text-blue-600 shadow-md ${className}`}
                  onPointerDown={(e) => beginDrag(e, mode)}
                >
                  <Icon size={12} strokeWidth={2.5} />
                </button>
              ))}
          </div>
        ) : (
        <div
          className={`flex-1 flex items-center relative ${
            imageSide === "right" ? "justify-end pr-0" : "justify-start pl-0"
          } pt-[124px] pb-0`}
          style={{ zIndex: LAYERS.image }}
        >
          <motion.div
            key={item.name}
            initial={{ scale: 0.3, opacity: 0, rotate: isPlatedCategory ? 5 : -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={`relative ${
              isPlatedCategory
                ? imageSide === "right"
                  ? "w-[122vw] -mr-[30vw] max-w-[680px]"
                  : "w-[122vw] -ml-[30vw] max-w-[680px]"
                : imageSide === "right"
                  ? "w-[100vw] max-w-[560px] -mr-[10vw]"
                  : "w-[100vw] max-w-[560px] -ml-[10vw]"
            }`}
            style={{ filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.25))" }}
          >
            {img ? (
              <img
                src={img}
                alt={item.name}
                className={`w-full ${isPlatedCategory ? "aspect-square object-cover rounded-full" : "aspect-square object-contain"}`}
                style={itemImageScaleStyle(item)}
                draggable={false}
              />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center">
                  <span
                    className="select-none"
                    style={{ fontFamily: theme.typography.fonts.heading, fontSize: "140px", color: "rgba(0,0,0,0.03)" }}
                  >
                    {item.name.charAt(0)}
                  </span>
              </div>
            )}
          </motion.div>
        </div>
        )}

        {textBlock}

        {vis.tags &&
          (useFreeTags ? (
            <DetailEditableTags
              item={item}
              theme={theme}
              style={tagsStyleMerged}
              editable={editable}
              selected={selectedLabel === "tags"}
              onSelect={() => onSelectLabel?.("tags")}
              onStyleChange={onTagsStyleChange}
              areaRef={areaRef}
              align={textAlign}
            />
          ) : useFreeText ? (
            <div
              className={`absolute bottom-24 left-0 right-0 px-6 flex ${imageSide === "right" ? "justify-start" : "justify-end"}`}
              style={{ zIndex: LAYERS.text }}
          >
            <MenuItemBadges item={item} theme={theme} layout="inline" showJain />
        </div>
          ) : null)}

        {vis.nav && (
          <div
            className={`px-8 pb-6 pt-2 flex items-center justify-between ${
              useFreeText || useFreeform || useFreeTags || useFreeChrome ? "mt-auto" : ""
            }`}
          >
            <button
              type="button"
              onClick={onPrev || undefined}
              disabled={!onPrev}
              className="w-11 h-11 rounded-full bg-black/[0.04] flex items-center justify-center disabled:opacity-15 active:scale-90 transition-all"
            >
              <ChevronLeft size={18} style={{ color: theme.textSecondary }} />
            </button>
            <div className="flex gap-[3px] max-w-[160px] overflow-hidden">
              {Array.from({ length: Math.min(totalItems, 20) }).map((_, i) => (
                <div
                  key={i}
                  className={`h-[3px] rounded-full transition-all duration-300 ${i === currentIndex ? "w-5" : "w-[3px]"}`}
                  style={{ background: i === currentIndex ? theme.primary : "rgba(0,0,0,0.08)" }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={onNext || undefined}
              disabled={!onNext}
              className="w-11 h-11 rounded-full bg-black/[0.04] flex items-center justify-center disabled:opacity-15 active:scale-90 transition-all"
            >
              <ChevronRight size={18} style={{ color: theme.textSecondary }} />
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default MenuItemDetail;
