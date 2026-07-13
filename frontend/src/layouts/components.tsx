import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { MenuItemBadges } from "@/components/menu/MenuItemBadges";
import { categoryImages, itemImageSrc, itemImageScaleStyle } from "@/components/menu/menuImages";
import MenuBookPage from "@/components/menu/MenuBookPage";
import MenuItemDetail from "@/components/menu/MenuItemDetail";
import type { MenuItem } from "@/data/menuData";
import { buildBookPages } from "./buildBookPages";
import {
  getItemDetailOverride,
  itemDetailKey,
  patchItemDetailOverride,
  type ItemDetailOverride,
} from "./itemLabelStyles";
import { frameStyle, interpolateText, nodeStyle } from "./treeUtils";
import type { LayoutDataContext, LayoutNode, LayoutRenderMode } from "./types";

type Props = {
  node: LayoutNode;
  mode: LayoutRenderMode;
  data: LayoutDataContext;
  children?: ReactNode;
  selected?: boolean;
  onSelect?: (id: string) => void;
};

function wrap(
  node: LayoutNode,
  mode: LayoutRenderMode,
  selected: boolean | undefined,
  onSelect: ((id: string) => void) | undefined,
  style: CSSProperties,
  content: ReactNode,
  opts?: { isRoot?: boolean },
) {
  if (node.visible === false && mode !== "editor") return null;
  const hidden = node.visible === false;
  const isRoot = opts?.isRoot ?? node.type === "PageRoot";
  return (
    <div
      data-layout-id={node.id}
      data-layout-type={node.type}
      onClick={
        mode === "editor" && onSelect
          ? (e) => {
              e.stopPropagation();
              onSelect(node.id);
            }
          : undefined
      }
      style={{
        ...frameStyle(node.frame, isRoot),
        ...style,
        ...nodeStyle(node),
        outline: mode === "editor" && selected ? "2px solid #2563eb" : undefined,
        outlineOffset: isRoot ? 0 : 2,
        opacity: hidden && mode === "editor" ? 0.45 : undefined,
        cursor: mode === "editor" ? (node.locked ? "default" : "move") : undefined,
        zIndex: (node.style?.zIndex as number | undefined) ?? (isRoot ? undefined : 1),
      }}
    >
      {content}
      {hidden && mode === "editor" && (
        <span className="absolute top-1 right-1 text-[9px] bg-muted px-1 rounded z-50">Hidden</span>
      )}
    </div>
  );
}

export function PageRootRender({ node, mode, data, children, selected, onSelect }: Props) {
  const bg = (node.props?.background as string | null) || data.theme.background;
  return wrap(
    node,
    mode,
    selected,
    onSelect,
    {
      minHeight: mode === "preview" || mode === "editor" ? "100%" : "100dvh",
      background: bg,
      color: data.theme.text,
      boxSizing: "border-box",
    },
    children,
    { isRoot: true },
  );
}

export function RestaurantNameRender({ node, mode, data, selected, onSelect }: Props) {
  const align = (node.props?.align as string) || "center";
  const showTagline = Boolean(node.props?.showTagline);
  return wrap(
    node,
    mode,
    selected,
    onSelect,
    { textAlign: align as CSSProperties["textAlign"] },
    <>
      <h1
        style={{
          fontFamily: data.theme.typography.fonts.heading,
          fontWeight: data.theme.typography.weights.heading,
          letterSpacing: data.theme.typography.letterSpacing.heading,
          fontSize: "1.5rem",
          color: data.theme.text,
        }}
      >
        {data.restaurantName || data.restaurant?.name || "Restaurant"}
      </h1>
      {showTagline && (data.tagline || data.restaurant?.tagline) && (
        <p style={{ color: data.theme.textSecondary, fontSize: 14, marginTop: 4 }}>
          {data.tagline || data.restaurant?.tagline}
        </p>
      )}
    </>,
  );
}

export function RestaurantLogoRender({ node, mode, data, selected, onSelect }: Props) {
  const size = (node.props?.size as string) || "md";
  const dim = size === "sm" ? 40 : size === "lg" ? 80 : 56;
  const initial = (data.restaurantName || "R").charAt(0).toUpperCase();
  return wrap(
    node,
    mode,
    selected,
    onSelect,
    {
      display: "flex",
      justifyContent:
        node.props?.align === "left" ? "flex-start" : node.props?.align === "right" ? "flex-end" : "center",
    },
    <div
      style={{
        width: dim,
        height: dim,
        borderRadius: 12,
        background: data.theme.primary,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: dim * 0.4,
      }}
    >
      {initial}
    </div>,
  );
}

export function TextRender({ node, mode, data, selected, onSelect }: Props) {
  const raw = String(node.props?.text ?? "");
  const text = interpolateText(raw, {
    "item.name": data.item?.name,
    "restaurant.name": data.restaurantName,
    "customer.name": data.customerName,
  });
  const variant = String(node.props?.variant ?? "body");
  const align = (node.props?.align as string) || "left";
  const style: CSSProperties = {
    textAlign: align as CSSProperties["textAlign"],
    color: variant === "muted" ? data.theme.textSecondary : data.theme.text,
    fontFamily:
      variant === "heading" ? data.theme.typography.fonts.heading : data.theme.typography.fonts.body,
    fontSize: variant === "heading" ? "1.5rem" : variant === "muted" ? 14 : 15,
    fontWeight: variant === "heading" ? data.theme.typography.weights.heading : 400,
  };
  return wrap(node, mode, selected, onSelect, style, <p style={{ margin: 0 }}>{text}</p>);
}

export function BannerRender({ node, mode, data, selected, onSelect }: Props) {
  const text = String(node.props?.text ?? "Banner");
  return wrap(
    node,
    mode,
    selected,
    onSelect,
    {
      background: (node.props?.background as string) || data.theme.primaryLight || "#f3f4f6",
      color: data.theme.text,
      padding: 12,
      borderRadius: 8,
      textAlign: "center",
      fontSize: 14,
    },
    text,
  );
}

export function DividerRender({ node, mode, selected, onSelect }: Props) {
  return wrap(
    node,
    mode,
    selected,
    onSelect,
    { borderTop: "1px solid rgba(0,0,0,0.1)", height: 0, marginTop: 4, marginBottom: 4 },
    null,
  );
}

export function SearchBarRender({ node, mode, data, selected, onSelect }: Props) {
  const placeholder = String(node.props?.placeholder ?? "Search…");
  return wrap(
    node,
    mode,
    selected,
    onSelect,
    {},
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(0,0,0,0.04)",
        borderRadius: 10,
        padding: "10px 12px",
      }}
    >
      <Search size={16} style={{ color: data.theme.textSecondary }} />
      <input
        value={data.searchQuery}
        onChange={(e) => data.setSearchQuery?.(e.target.value)}
        placeholder={placeholder}
        disabled={mode === "editor" && !data.setSearchQuery}
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          background: "transparent",
          color: data.theme.text,
          fontSize: 14,
        }}
      />
    </div>,
  );
}

export function CategoryTabsRender({ node, mode, data, selected, onSelect }: Props) {
  const cats = data.menu.map((c) => c.name);
  const scrollable = Boolean(node.props?.scrollable ?? true);
  return wrap(
    node,
    mode,
    selected,
    onSelect,
    {
      display: "flex",
      gap: 8,
      overflowX: scrollable ? "auto" : "visible",
      paddingBottom: 4,
    },
    cats.length === 0 ? (
      <span style={{ color: data.theme.textSecondary, fontSize: 13 }}>No categories</span>
    ) : (
      cats.map((name) => {
        const active = data.activeCategory === name;
        return (
          <button
            key={name}
            type="button"
            onClick={() => data.setActiveCategory?.(name)}
            style={{
              flexShrink: 0,
              padding: "6px 12px",
              borderRadius: 999,
              border: "none",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              background: active ? data.theme.primary : "rgba(0,0,0,0.06)",
              color: active ? "#fff" : data.theme.text,
            }}
          >
            {name}
          </button>
        );
      })
    ),
  );
}

function densityStyles(density: string): { imageH: number; fontSize: number; pad: number } {
  if (density === "featured") return { imageH: 180, fontSize: 16, pad: 12 };
  if (density === "compact") return { imageH: 72, fontSize: 12, pad: 6 };
  return { imageH: 110, fontSize: 14, pad: 8 };
}

function resolveItems(data: LayoutDataContext, props: Record<string, unknown>): MenuItem[] {
  const source = String(props.source ?? "active_category");
  const maxItems = Number(props.maxItems ?? 50);
  const q = data.searchQuery.trim().toLowerCase();
  let items: MenuItem[] = [];
  if (source === "all" || source === "search") {
    items = data.menu.flatMap((c) => c.items);
  } else if (source === "featured") {
    items = data.menu.flatMap((c) => c.items.filter((i) => i.featured));
  } else if (source === "new") {
    items = data.menu.flatMap((c) => c.items.filter((i) => i.isNew));
  } else {
    const cat =
      data.menu.find((c) => c.name === data.activeCategory) ?? data.menu[0];
    items = cat?.items ?? [];
  }
  if (q) items = items.filter((i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
  return items.slice(0, maxItems);
}

export function MenuItemCardRender({
  item,
  index,
  density,
  theme,
  onTap,
}: {
  item: MenuItem;
  index: number;
  density: string;
  theme: LayoutDataContext["theme"];
  onTap?: () => void;
}) {
  const d = densityStyles(density);
  const img = itemImageSrc(item);
  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        textAlign: "left",
        background: "rgba(255,255,255,0.55)",
        border: "none",
        borderRadius: 12,
        padding: d.pad,
        cursor: "pointer",
        width: "100%",
      }}
    >
      {img && (
        <div
          style={{
            height: d.imageH,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 6,
          }}
        >
          <img
            src={img}
            alt=""
            style={{
              maxHeight: "100%",
              maxWidth: "100%",
              objectFit: "contain",
              ...itemImageScaleStyle(item),
            }}
          />
        </div>
      )}
      <MenuItemBadges item={item} theme={theme} layout="inline" />
      <p
        style={{
          margin: "4px 0 0",
          fontSize: d.fontSize,
          fontWeight: 600,
          color: theme.text,
          fontFamily: theme.typography.fonts.heading,
        }}
      >
        {item.name}
      </p>
      <p style={{ margin: "2px 0 0", fontSize: d.fontSize - 1, color: theme.primary, fontWeight: 600 }}>
        ₹{item.price}
      </p>
    </button>
  );
}

export function MenuItemGridRender({ node, mode, data, selected, onSelect }: Props) {
  const props = node.props ?? {};
  const columns = Number(props.columns ?? 2);
  const direction = String(props.direction ?? "grid");
  const density = String(props.density ?? "comfortable");
  const items = resolveItems(data, props);
  const gap = Number(node.style?.gap ?? 8);

  let gridStyle: CSSProperties;
  if (direction === "horizontal") {
    gridStyle = {
      display: "flex",
      flexDirection: "row",
      gap,
      overflowX: "auto",
    };
  } else if (direction === "vertical") {
    gridStyle = { display: "flex", flexDirection: "column", gap };
  } else {
    gridStyle = {
      display: "grid",
      gridTemplateColumns: `repeat(${Math.max(1, Math.min(5, columns))}, minmax(0, 1fr))`,
      gap,
    };
  }

  return wrap(
    node,
    mode,
    selected,
    onSelect,
    gridStyle,
    items.length === 0 ? (
      <p style={{ color: data.theme.textSecondary, fontSize: 13, gridColumn: "1 / -1" }}>
        No items to show
      </p>
    ) : (
      items.map((item, index) => (
        <div
          key={`${item.name}-${index}`}
          style={direction === "horizontal" ? { minWidth: columns <= 1 ? "85%" : "42%" } : undefined}
        >
          <MenuItemCardRender
            item={item}
            index={index}
            density={density}
            theme={data.theme}
            onTap={() => data.onItemTap?.(item, index)}
          />
        </div>
      ))
    ),
  );
}

export function ItemImageRender({ node, mode, data, selected, onSelect }: Props) {
  const img = data.item ? itemImageSrc(data.item) : null;
  return wrap(
    node,
    mode,
    selected,
    onSelect,
    {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: 160,
    },
    img ? (
      <img
        src={img}
        alt={data.item?.name ?? ""}
        style={{ maxWidth: "100%", maxHeight: 280, objectFit: "contain", ...itemImageScaleStyle(data.item!) }}
      />
    ) : (
      <div style={{ color: data.theme.textSecondary, fontSize: 13 }}>No image</div>
    ),
  );
}

export function ItemDescriptionRender({ node, mode, data, selected, onSelect }: Props) {
  return wrap(
    node,
    mode,
    selected,
    onSelect,
    {
      textAlign: ((node.props?.align as string) || "left") as CSSProperties["textAlign"],
      color: data.theme.textSecondary,
      fontSize: 14,
      lineHeight: 1.5,
    },
    <p style={{ margin: 0 }}>{data.item?.description || (mode === "editor" ? "Item description" : "")}</p>,
  );
}

export function ItemPriceRender({ node, mode, data, selected, onSelect }: Props) {
  return wrap(
    node,
    mode,
    selected,
    onSelect,
    {
      textAlign: ((node.props?.align as string) || "left") as CSSProperties["textAlign"],
      color: data.theme.primary,
      fontSize: 20,
      fontWeight: 700,
      fontFamily: data.theme.typography.fonts.price,
    },
    data.item ? `₹${data.item.price}` : mode === "editor" ? "₹0" : "",
  );
}

export function TagsRender({ node, mode, data, selected, onSelect }: Props) {
  return wrap(
    node,
    mode,
    selected,
    onSelect,
    {},
    data.item ? (
      <MenuItemBadges item={data.item} theme={data.theme} layout="inline" />
    ) : (
      <span style={{ color: data.theme.textSecondary, fontSize: 12 }}>Tags</span>
    ),
  );
}

export function CTAButtonRender({ node, mode, data, selected, onSelect }: Props) {
  const label = String(node.props?.label ?? "Continue");
  const action = String(node.props?.action ?? "navigate_menu");
  const variant = String(node.props?.variant ?? "primary");
  const width = String(node.props?.width ?? "full");
  const primary = variant === "primary";
  const handle = () => {
    if (action === "submit_check_in") data.checkIn?.onSubmit();
    else if (action === "navigate_menu") data.navigateToMenu?.();
    else if (action === "navigate_back") data.navigateBack?.();
  };
  return wrap(
    node,
    mode,
    selected,
    onSelect,
    {},
    <button
      type="button"
      onClick={handle}
      disabled={Boolean(data.checkIn?.submitting) && action === "submit_check_in"}
      style={{
        width: width === "full" ? "100%" : width === "half" ? "50%" : "auto",
        padding: "12px 16px",
        borderRadius: 8,
        border: primary ? "none" : `1px solid ${data.theme.text}`,
        background: primary ? data.theme.text : "transparent",
        color: primary ? data.theme.background : data.theme.text,
        fontWeight: 600,
        fontSize: 14,
        cursor: "pointer",
      }}
    >
      {label}
    </button>,
  );
}

export function CheckInFormRender({ node, mode, data, selected, onSelect }: Props) {
  const showName = node.props?.showName !== false;
  const showPhone = node.props?.showPhone !== false;
  const ci = data.checkIn;
  const field = (label: string, value: string, onChange: (v: string) => void, err?: string, placeholder?: string) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: data.theme.textSecondary }}>
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 8,
          border: `1px solid ${err ? "#ef4444" : "rgba(0,0,0,0.15)"}`,
          fontSize: 14,
          boxSizing: "border-box",
        }}
      />
      {err && <p style={{ color: "#ef4444", fontSize: 12, margin: "4px 0 0" }}>{err}</p>}
    </div>
  );
  return wrap(
    node,
    mode,
    selected,
    onSelect,
    {},
    <>
      {showName &&
        field(
          "Name",
          ci?.name ?? (mode === "editor" ? "Guest" : ""),
          (v) => ci?.setName(v),
          ci?.errors.name,
          "Your name",
        )}
      {showPhone &&
        field(
          "Phone",
          ci?.phone ?? (mode === "editor" ? "98765 43210" : ""),
          (v) => {
            if (!ci) return;
            const digits = v.replace(/\D/g, "").slice(0, 10);
            ci.setPhone(digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits);
          },
          ci?.errors.phone,
          "10-digit mobile",
        )}
      {ci?.formError && (
        <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 8 }}>{ci.formError}</p>
      )}
    </>,
  );
}

export function LoyaltySummaryRender({ node, mode, data, selected, onSelect }: Props) {
  const goal = Number(node.props?.visitGoal ?? data.visitGoal ?? 5);
  const count = data.visitCount ?? 1;
  const filled = Math.min(count, goal);
  const pct = (filled / goal) * 100;
  const showBar = node.props?.showProgressBar !== false;
  return wrap(
    node,
    mode,
    selected,
    onSelect,
    {
      background: "rgba(255,255,255,0.7)",
      border: "1px solid rgba(0,0,0,0.08)",
      borderRadius: 12,
      padding: 16,
      textAlign: "center",
    },
    <>
      <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Loyalty Progress</p>
      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
        {Array.from({ length: goal }, (_, i) => i + 1).map((step) => (
          <div
            key={step}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              background: step <= filled ? data.theme.text : "rgba(0,0,0,0.08)",
              color: step <= filled ? data.theme.background : data.theme.textSecondary,
            }}
          >
            {step <= filled ? "✓" : step}
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: data.theme.textSecondary, marginTop: 12 }}>
        {count} of {goal} visits
        {data.customerName ? ` · Hi, ${data.customerName}` : ""}
      </p>
      {showBar && (
        <div style={{ marginTop: 12, height: 6, borderRadius: 99, background: "rgba(0,0,0,0.08)" }}>
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              borderRadius: 99,
              background: data.theme.text,
            }}
          />
        </div>
      )}
    </>,
  );
}

/** Classic magazine menu book — preserves current mobile QR menu UX. */
export function MenuBookRender({ node, mode, data, selected, onSelect }: Props) {
  const navigate = useNavigate();
  const pages = useMemo(
    () => buildBookPages(data.menu ?? [], categoryImages),
    [data.menu],
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next");
  const [isFlipping, setIsFlipping] = useState(false);

  const flipTo = useCallback(
    (dir: "next" | "prev") => {
      if (isFlipping) return;
      const next = dir === "next" ? currentPage + 1 : currentPage - 1;
      if (next < 0 || next >= pages.length) return;
      setFlipDirection(dir);
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(next);
        setIsFlipping(false);
      }, 500);
    },
    [currentPage, pages.length, isFlipping],
  );

  // Reset page when menu data changes (e.g. live API load in editor)
  useEffect(() => {
    setCurrentPage(0);
  }, [data.menu]);

  if (pages.length === 0) {
    return wrap(
      node,
      mode,
      selected,
      onSelect,
      {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        background: data.theme.background,
      },
      <p style={{ color: data.theme.textSecondary, fontSize: 14 }}>Menu coming soon</p>,
    );
  }

  const page = pages[Math.min(currentPage, pages.length - 1)];
  const resolvedId = data.resolvedId || data.pathSegment;
  const isEditor = mode === "editor" || mode === "preview";

  return wrap(
    node,
    mode,
    selected,
    onSelect,
    {
      height: "100%",
      minHeight: isEditor ? "100%" : "100dvh",
      background: data.theme.background,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },
    <div className="relative flex flex-col h-full w-full overflow-hidden" style={{ background: data.theme.background }}>
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 pt-5 pb-2">
        {!isEditor ? (
          <button
            type="button"
            onClick={() => navigate(`/scan/${resolvedId}`)}
            className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center"
            aria-label="Back"
          >
            <ArrowLeft size={16} style={{ color: data.theme.text }} />
          </button>
        ) : (
          <div className="w-10" />
        )}
        <div className="text-center">
          <h1
            className="tracking-[0.08em] uppercase leading-none"
            style={{
              fontFamily: data.theme.typography.fonts.heading,
              fontSize: data.theme.typography.scale.sm,
              fontWeight: data.theme.typography.weights.heading,
              color: data.theme.primary,
            }}
          >
            {data.restaurantName}
          </h1>
          {data.tagline && (
            <p className="text-[9px] mt-0.5 tracking-wider uppercase" style={{ color: data.theme.textSecondary }}>
              {data.tagline}
            </p>
          )}
        </div>
        <div className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center">
          <span className="text-[11px]" style={{ color: data.theme.textSecondary }}>
            {currentPage + 1}/{pages.length}
          </span>
        </div>
      </div>

      <div className="flex-1 relative mt-[72px] mb-[86px] mx-4" style={{ perspective: "1200px" }}>
        <motion.div
          key={currentPage}
          drag={isEditor ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={
            isEditor
              ? undefined
              : (_, info) => {
                  if (Math.abs(info.offset.x) < 50) return;
                  if (info.offset.x < -50) flipTo("next");
                  else flipTo("prev");
                }
          }
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 16px 46px rgba(0,0,0,0.1)" }}
          initial={{ rotateY: flipDirection === "next" ? 90 : -90, opacity: 0.3 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <MenuBookPage
            page={page}
            theme={data.theme}
            editable={isEditor}
            itemFrames={
              (node.props?.itemFrames as Record<string, { top: number; left: number; width: number }> | undefined) ??
              undefined
            }
            onItemFrameChange={
              isEditor
                ? (itemName, frame) => {
                    const prev =
                      (node.props?.itemFrames as Record<string, { top: number; left: number; width: number }>) ??
                      {};
                    data.onUpdateNodeProps?.(node.id, {
                      itemFrames: { ...prev, [itemName]: frame },
                    });
                  }
                : undefined
            }
            itemTextStyles={
              (node.props?.itemTextStyles as
                | Record<string, { name?: Record<string, unknown>; price?: Record<string, unknown> }>
                | undefined) ?? undefined
            }
            onItemTextStyleChange={
              isEditor
                ? (itemName, styles) => {
                    const prev =
                      (node.props?.itemTextStyles as Record<string, unknown>) ?? {};
                    data.onUpdateNodeProps?.(node.id, {
                      itemTextStyles: { ...prev, [itemName]: styles },
                    });
                  }
                : undefined
            }
            selectedLabel={data.selectedItemLabel ?? null}
            onSelectLabel={
              isEditor
                ? (sel) => {
                    data.setSelectedItemLabel?.(sel);
                  }
                : undefined
            }
            tapHintStyle={
              (node.props?.tapHintStyle as
                | { x?: number; y?: number; fontSize?: number; color?: string }
                | undefined) ?? undefined
            }
            onTapHintStyleChange={
              isEditor
                ? (style) => {
                    data.onUpdateNodeProps?.(node.id, { tapHintStyle: style });
                    data.setSelectedItemLabel?.({ itemName: "", field: "tapHint" });
                  }
                : undefined
            }
            onItemTap={(itemIdx) => {
              const item = page.items[itemIdx];
              if (item) data.onItemTap?.(item, itemIdx);
            }}
          />
        </motion.div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 z-40 pb-6 pt-2"
        style={{
          background: `linear-gradient(to top, ${data.theme.background}, ${data.theme.background}e8, transparent)`,
        }}
      >
        <div className="flex items-center justify-center gap-5 px-6">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              flipTo("prev");
            }}
            disabled={currentPage === 0 || isFlipping}
            className="w-11 h-11 rounded-full bg-black/[0.04] flex items-center justify-center disabled:opacity-20"
          >
            <ChevronLeft size={18} style={{ color: data.theme.textSecondary }} />
          </button>
          <div className="flex items-center gap-1.5 max-w-[200px] overflow-hidden">
            {pages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (i === currentPage || isFlipping) return;
                  setFlipDirection(i > currentPage ? "next" : "prev");
                  setIsFlipping(true);
                  setTimeout(() => {
                    setCurrentPage(i);
                    setIsFlipping(false);
                  }, 400);
                }}
                className="shrink-0"
              >
                <div
                  className={`h-1.5 rounded-full transition-all ${i === currentPage ? "w-6" : "w-1.5"}`}
                  style={{ background: i === currentPage ? data.theme.primary : "rgba(0,0,0,0.12)" }}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              flipTo("next");
            }}
            disabled={currentPage === pages.length - 1 || isFlipping}
            className="w-11 h-11 rounded-full bg-black/[0.04] flex items-center justify-center disabled:opacity-20"
          >
            <ChevronRight size={18} style={{ color: data.theme.textSecondary }} />
          </button>
        </div>
        <p
          className="text-center mt-1.5 tracking-[0.15em] uppercase"
          style={{ fontSize: 10, color: data.theme.textSecondary }}
        >
          {page.pageLabel}
        </p>
      </div>
    </div>,
  );
}

/** Classic item detail shell — wraps MenuItemDetail. */
export function ItemDetailShellRender({ node, mode, data, selected, onSelect }: Props) {
  if (!data.item) {
    return wrap(
      node,
      mode,
      selected,
      onSelect,
      {
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: data.theme.background,
      },
      <p style={{ color: data.theme.textSecondary, fontSize: 13 }}>Select a menu item to preview</p>,
    );
  }

  const flat = data.flatItems ?? [];
  const idx = data.detailIndex ?? 0;
  const isEditor = mode === "editor";
  const isContained = mode === "editor" || mode === "preview";
  const itemKey = itemDetailKey(data.categoryName ?? "", data.item.name);
  const override = getItemDetailOverride(node.props as Record<string, unknown>, itemKey);

  const patchOverride = (patch: Partial<ItemDetailOverride>) => {
    if (!isEditor) return;
    const nextMap = patchItemDetailOverride(
      node.props as Record<string, unknown>,
      itemKey,
      patch,
    );
    data.onUpdateNodeProps?.(node.id, { itemOverrides: { [itemKey]: nextMap[itemKey] } });
  };

  const patchStyle =
    (propKey: keyof ItemDetailOverride, field: string) =>
    (style: { x: number; y: number; fontSize: number; color?: string; width?: number; maxLines?: 1 | 2 }) => {
      patchOverride({ [propKey]: style });
      data.setSelectedDetailLabel?.(field as never);
    };

  return wrap(
    node,
    mode,
    selected,
    onSelect,
    {
      height: "100%",
      minHeight: isContained ? "100%" : "100dvh",
      position: "relative",
      overflow: "hidden",
    },
    <MenuItemDetail
      item={data.item}
      heroImage={categoryImages[data.categoryName ?? ""]}
      categoryName={data.categoryName ?? ""}
      theme={data.theme}
      onBack={() => data.navigateBack?.()}
      onPrev={idx > 0 ? () => data.onDetailNavigate?.(idx - 1) : null}
      onNext={idx < flat.length - 1 ? () => data.onDetailNavigate?.(idx + 1) : null}
      currentIndex={idx}
      totalItems={flat.length || 1}
      editable={isEditor}
      imageFrame={override.imageFrame}
      onImageFrameChange={
        isEditor
          ? (frame) => {
              patchOverride({ imageFrame: frame });
            }
          : undefined
      }
      nameStyle={override.nameStyle}
      priceStyle={override.priceStyle}
      tagsStyle={override.tagsStyle}
      descriptionStyle={override.descriptionStyle}
      backBtnStyle={override.backBtnStyle}
      counterStyle={override.counterStyle}
      visibility={override.visibility}
      onNameStyleChange={isEditor ? patchStyle("nameStyle", "name") : undefined}
      onPriceStyleChange={isEditor ? patchStyle("priceStyle", "price") : undefined}
      onTagsStyleChange={isEditor ? patchStyle("tagsStyle", "tags") : undefined}
      onDescriptionStyleChange={isEditor ? patchStyle("descriptionStyle", "description") : undefined}
      onBackBtnStyleChange={isEditor ? patchStyle("backBtnStyle", "back") : undefined}
      onCounterStyleChange={isEditor ? patchStyle("counterStyle", "counter") : undefined}
      selectedLabel={data.selectedDetailLabel ?? null}
      onSelectLabel={
        isEditor
          ? (field) => {
              data.setSelectedDetailLabel?.(field);
            }
          : undefined
      }
    />,
  );
}
