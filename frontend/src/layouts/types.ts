import type { MenuItem, RestaurantConfig } from "@/data/menuData";
import type { RestaurantTheme } from "@/data/restaurantThemes";

export type PageKey = "welcome" | "checked_in" | "menu" | "item_detail";

/** Percent of phone canvas (0–100). `h: null` = auto height from content. */
export type LayoutFrame = {
  x: number;
  y: number;
  w: number;
  h: number | null;
};

export type LayoutNode = {
  id: string;
  type: string;
  visible?: boolean;
  locked?: boolean;
  props?: Record<string, unknown>;
  style?: Record<string, number>;
  frame?: LayoutFrame;
  children?: LayoutNode[];
};

export type LayoutDocument = {
  schema_version: number;
  page_key: PageKey;
  root: LayoutNode;
};

export type ApiPageLayout = {
  id?: number;
  page_key: PageKey;
  version: number;
  schema_version: number;
  layout: LayoutDocument;
  updated_at?: string;
};

export type PublicLayoutsResponse = {
  restaurant_slug: string;
  pages: ApiPageLayout[];
};

export type LayoutRenderMode = "live" | "preview" | "editor";

export type LayoutDataContext = {
  restaurant: RestaurantConfig | null;
  restaurantName: string;
  tagline?: string;
  theme: RestaurantTheme;
  menu: RestaurantConfig["menu"];
  /** Active category name for menu page */
  activeCategory: string | null;
  setActiveCategory?: (name: string) => void;
  searchQuery: string;
  setSearchQuery?: (q: string) => void;
  /** Current item for item_detail */
  item: MenuItem | null;
  categoryName?: string;
  customerName?: string;
  visitCount?: number;
  visitGoal?: number;
  pathSegment: string;
  /** Check-in form state (welcome) */
  checkIn?: {
    name: string;
    phone: string;
    setName: (v: string) => void;
    setPhone: (v: string) => void;
    errors: { name?: string; phone?: string };
    formError: string | null;
    submitting: boolean;
    onSubmit: () => void;
  };
  navigateToMenu?: () => void;
  navigateBack?: () => void;
  onItemTap?: (item: MenuItem, index: number) => void;
  /** Menu book / item detail extras */
  detailIndex?: number;
  flatItems?: { item: MenuItem; categoryName: string }[];
  onDetailNavigate?: (index: number) => void;
  resolvedId?: string;
  /** Editor: patch node props (e.g. MenuBook itemFrames) */
  onUpdateNodeProps?: (nodeId: string, props: Record<string, unknown>) => void;
  /** Editor: which item name/price label is selected */
  selectedItemLabel?: { itemName: string; field: import("./itemLabelStyles").ItemLabelField } | null;
  setSelectedItemLabel?: (
    sel: { itemName: string; field: import("./itemLabelStyles").ItemLabelField } | null,
  ) => void;
  /** Editor: which detail label is selected */
  selectedDetailLabel?: import("./itemLabelStyles").DetailLabelField | null;
  setSelectedDetailLabel?: (sel: import("./itemLabelStyles").DetailLabelField | null) => void;
};

export type LayoutRenderProps = {
  node: LayoutNode;
  mode: LayoutRenderMode;
  data: LayoutDataContext;
  selected?: boolean;
  onSelect?: (id: string) => void;
};

export type LayoutComponentCategory = "brand" | "menu" | "form" | "media" | "layout";

export type LayoutComponentDef = {
  type: string;
  label: string;
  category: LayoutComponentCategory;
  pages?: PageKey[];
  defaultProps: Record<string, unknown>;
  defaultStyle?: Record<string, number>;
  defaultFrame?: LayoutFrame;
};
