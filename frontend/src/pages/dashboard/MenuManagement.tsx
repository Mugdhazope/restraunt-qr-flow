import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRestaurant } from "@/context/RestaurantContext";
import {
  apiFetch,
  fetchAllPages,
  menuCategoriesUrl,
  menuCategoryDetailUrl,
  menuItemDetailUrl,
  menuItemsBulkUrl,
  menuItemsUrl,
  type ApiMenuCategory,
  type ApiMenuItem,
} from "@/lib/api";
import { Plus, Pencil, Trash2, X, Star, Sparkles, FolderPlus, ChevronDown, ChevronRight, Leaf, Minus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

const TAG_OPTIONS = ["", "Bestseller", "Chef's Pick", "Popular", "New"];
const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  Bestseller: { bg: "bg-amber-100", text: "text-amber-800" },
  "Chef's Pick": { bg: "bg-pink-100", text: "text-pink-800" },
  Popular: { bg: "bg-blue-100", text: "text-blue-800" },
  New: { bg: "bg-green-100", text: "text-green-800" },
};

const IMAGE_SCALE_MIN = 50;
const IMAGE_SCALE_MAX = 200;
const IMAGE_SCALE_STEP = 5;

function clampImageScale(n: number): number {
  if (!Number.isFinite(n)) return 100;
  return Math.min(IMAGE_SCALE_MAX, Math.max(IMAGE_SCALE_MIN, Math.round(n)));
}

const MenuManagement = () => {
  const { selectedOutlet } = useRestaurant();
  const slug = selectedOutlet.restaurantId;
  const [menu, setMenu] = useState<ApiMenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ApiMenuItem | null>(null);
  const [formCatName, setFormCatName] = useState("");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formTag, setFormTag] = useState("");
  const [formFeatured, setFormFeatured] = useState(false);
  const [formIsNew, setFormIsNew] = useState(false);
  const [formJain, setFormJain] = useState(false);
  const [formImageScale, setFormImageScale] = useState(100);
  const [formImageScaleInput, setFormImageScaleInput] = useState("100");

  const [showCatForm, setShowCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [bulkManifest, setBulkManifest] = useState("");
  const [saving, setSaving] = useState(false);
  const bulkImagesInputRef = useRef<HTMLInputElement>(null);

  const formImagePreviewUrl = useMemo(() => {
    if (formImageFile) return URL.createObjectURL(formImageFile);
    return editingItem?.image_url ?? null;
  }, [formImageFile, editingItem?.image_url]);

  useEffect(() => {
    if (!formImageFile || !formImagePreviewUrl) return;
    return () => URL.revokeObjectURL(formImagePreviewUrl);
  }, [formImageFile, formImagePreviewUrl]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const cats = await fetchAllPages<ApiMenuCategory>(menuCategoriesUrl(slug));
      setMenu(cats);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load menu");
      setMenu([]);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const categories = useMemo(() => menu.map((c) => c.name), [menu]);

  const featuredItems = useMemo(
    () =>
      menu.flatMap((cat) =>
        cat.items.filter((i) => i.is_featured).map((item) => ({ item, catName: cat.name })),
      ),
    [menu],
  );
  const newItems = useMemo(
    () =>
      menu.flatMap((cat) =>
        cat.items.filter((i) => i.is_new).map((item) => ({ item, catName: cat.name })),
      ),
    [menu],
  );

  const categoryIdByName = useCallback(
    (name: string) => menu.find((c) => c.name === name)?.id,
    [menu],
  );

  const resetForm = () => {
    setFormCatName("");
    setFormName("");
    setFormDesc("");
    setFormPrice("");
    setFormTag("");
    setFormFeatured(false);
    setFormIsNew(false);
    setFormJain(false);
    setFormImageScale(100);
    setFormImageScaleInput("100");
    setFormImageFile(null);
    setEditingItem(null);
    setShowForm(false);
  };

  const openAddForm = () => {
    resetForm();
    setFormCatName(categories[0] || "");
    setShowForm(true);
  };

  const openEditForm = (item: ApiMenuItem, catName: string) => {
    setEditingItem(item);
    setFormCatName(catName);
    setFormName(item.name);
    setFormDesc(item.description || "");
    setFormPrice(String(item.price));
    setFormTag(item.tag || "");
    setFormFeatured(item.is_featured);
    setFormIsNew(item.is_new);
    setFormJain(item.is_jain);
    const scale = clampImageScale(item.image_scale ?? 100);
    setFormImageScale(scale);
    setFormImageScaleInput(String(scale));
    setFormImageFile(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (saving) return;
    if (!formName.trim() || !formPrice.trim()) {
      toast({ title: "Name and price are required", variant: "destructive" });
      return;
    }
    const catId = categoryIdByName(formCatName.trim());
    if (!catId) {
      toast({ title: "Pick an existing category or create one first", variant: "destructive" });
      return;
    }
    const body = {
      category: catId,
      name: formName.trim(),
      description: formDesc.trim(),
      price: formPrice.trim(),
      tag: formTag,
      is_featured: formFeatured,
      is_new: formIsNew,
      is_jain: formJain,
      image_scale: clampImageScale(formImageScale),
    };
    setSaving(true);
    try {
      if (formImageFile) {
        const fd = new FormData();
        fd.append("category", String(body.category));
        fd.append("name", body.name);
        fd.append("description", body.description);
        fd.append("price", body.price);
        fd.append("tag", body.tag);
        fd.append("is_featured", body.is_featured ? "true" : "false");
        fd.append("is_new", body.is_new ? "true" : "false");
        fd.append("is_jain", body.is_jain ? "true" : "false");
        fd.append("image_scale", String(body.image_scale));
        fd.append("image", formImageFile);
        if (editingItem) {
          await apiFetch(menuItemDetailUrl(slug, editingItem.id), { method: "PATCH", body: fd });
          toast({ title: "Item updated" });
        } else {
          await apiFetch(menuItemsUrl(slug), { method: "POST", body: fd });
          toast({ title: "Item added" });
        }
      } else if (editingItem) {
        await apiFetch(menuItemDetailUrl(slug, editingItem.id), {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast({ title: "Item updated" });
      } else {
        await apiFetch(menuItemsUrl(slug), {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast({ title: "Item added" });
      }
      resetForm();
      await refresh();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpload = async () => {
    const files = bulkImagesInputRef.current?.files;
    if (!files?.length) {
      toast({ title: "Choose one image per manifest row (same order)", variant: "destructive" });
      return;
    }
    let rows: unknown;
    try {
      rows = JSON.parse(bulkManifest.trim() || "[]");
    } catch {
      toast({ title: "Manifest must be valid JSON", variant: "destructive" });
      return;
    }
    if (!Array.isArray(rows) || rows.length !== files.length) {
      toast({
        title: `Manifest must be a JSON array with ${files.length} row(s) matching selected images`,
        variant: "destructive",
      });
      return;
    }
    const fd = new FormData();
    fd.append("manifest", JSON.stringify(rows));
    for (let i = 0; i < files.length; i += 1) {
      fd.append("images", files[i]);
    }
    try {
      const res = await apiFetch<{ results: { index: number; ok: boolean; id?: number; errors?: unknown }[] }>(
        menuItemsBulkUrl(slug),
        { method: "POST", body: fd },
      );
      const failed = res.results.filter((r) => !r.ok).length;
      toast({
        title: failed ? `Bulk done with ${failed} error(s)` : "Bulk upload complete",
        variant: failed ? "destructive" : "default",
      });
      setBulkManifest("");
      if (bulkImagesInputRef.current) bulkImagesInputRef.current.value = "";
      await refresh();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Bulk upload failed", variant: "destructive" });
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    try {
      await apiFetch(menuItemDetailUrl(slug, itemId), { method: "DELETE" });
      toast({ title: "Item deleted" });
      await refresh();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Delete failed", variant: "destructive" });
    }
  };

  const patchItemFlags = async (item: ApiMenuItem, patch: Partial<ApiMenuItem>) => {
    try {
      await apiFetch(menuItemDetailUrl(slug, item.id), {
        method: "PATCH",
        body: JSON.stringify({
          category: item.category,
          name: item.name,
          description: item.description,
          price: item.price,
          tag: item.tag,
          is_featured: patch.is_featured ?? item.is_featured,
          is_new: patch.is_new ?? item.is_new,
          is_jain: patch.is_jain ?? item.is_jain,
          image_scale: item.image_scale ?? 100,
        }),
      });
      await refresh();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Update failed", variant: "destructive" });
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) {
      toast({ title: "Category name is required", variant: "destructive" });
      return;
    }
    if (categories.includes(newCatName.trim())) {
      toast({ title: "Category already exists", variant: "destructive" });
      return;
    }
    try {
      await apiFetch(menuCategoriesUrl(slug), {
        method: "POST",
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      toast({ title: `Category "${newCatName.trim()}" added` });
      setNewCatName("");
      setShowCatForm(false);
      await refresh();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (cat: ApiMenuCategory) => {
    if (cat.items.length > 0) {
      toast({ title: "Remove items in this category first", variant: "destructive" });
      return;
    }
    try {
      await apiFetch(menuCategoryDetailUrl(slug, cat.id), { method: "DELETE" });
      toast({ title: "Category deleted" });
      await refresh();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Delete failed", variant: "destructive" });
    }
  };

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading menu…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Menu Management</h1>
          <p className="text-muted-foreground text-sm">
            {selectedOutlet.name} — {menu.reduce((a, c) => a + c.items.length, 0)} items across {menu.length} categories
          </p>
          {loadError && <p className="text-destructive text-xs mt-1">{loadError}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCatForm(true)}
            className="flex items-center gap-2 border border-border text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            <FolderPlus size={16} />
            Add Category
          </button>
          <button
            type="button"
            onClick={openAddForm}
            disabled={menu.length === 0}
            className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            <Plus size={16} />
            Add Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star size={16} className="text-amber-500" />
            <h3 className="font-semibold text-foreground text-sm">Featured Items</h3>
            <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{featuredItems.length}</span>
          </div>
          {featuredItems.length === 0 ? (
            <p className="text-xs text-muted-foreground">No featured items.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {featuredItems.map((x) => (
                <span key={x.item.id} className="text-xs bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full font-medium">
                  {x.item.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-emerald-500" />
            <h3 className="font-semibold text-foreground text-sm">New This Week</h3>
            <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{newItems.length}</span>
          </div>
          {newItems.length === 0 ? (
            <p className="text-xs text-muted-foreground">No new items.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {newItems.map((x) => (
                <span key={x.item.id} className="text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full font-medium">
                  {x.item.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-3 animate-fade-in">
        <h3 className="font-semibold text-foreground text-sm">Bulk images</h3>
        <p className="text-xs text-muted-foreground">
          Paste a JSON array with one object per image file (same order). Required fields per row:{" "}
          <code className="text-foreground">category_name</code>, <code className="text-foreground">name</code>,{" "}
          <code className="text-foreground">description</code>, <code className="text-foreground">price</code> (decimals as
          strings).
        </p>
        <textarea
          value={bulkManifest}
          onChange={(e) => setBulkManifest(e.target.value)}
          placeholder='[{"category_name":"Wood Fired Pizzas","name":"Photo Item","description":"","price":"100.00"}]'
          rows={5}
          className="w-full bg-background border border-border rounded-lg p-3 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y min-h-[100px]"
        />
        <input
          ref={bulkImagesInputRef}
          type="file"
          accept="image/*"
          multiple
          className="text-xs text-muted-foreground w-full"
        />
        <button
          type="button"
          onClick={() => void handleBulkUpload()}
          className="border border-border text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
        >
          Upload manifest + images
        </button>
      </div>

      {menu.map((cat, catIdx) => {
        const isCollapsed = collapsed[catIdx];
        return (
          <div key={cat.id} className="bg-card border border-border rounded-xl overflow-hidden animate-fade-in">
            <div className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
              <button
                type="button"
                onClick={() => setCollapsed((p) => ({ ...p, [catIdx]: !p[catIdx] }))}
                className="flex items-center gap-2 flex-1 text-left hover:bg-muted/70 transition-colors rounded-lg -mx-2 px-2 py-1"
              >
                {isCollapsed ? <ChevronRight size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                <h2 className="font-semibold text-foreground text-sm">{cat.name}</h2>
                <span className="text-xs text-muted-foreground">({cat.items.length})</span>
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteCategory(cat)}
                className="text-xs text-muted-foreground hover:text-destructive px-2"
              >
                Remove empty
              </button>
            </div>
            {!isCollapsed && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["Item", "Description", "Price", "Tag", "Jain", "Featured", "New", "Actions"].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cat.items.map((item) => (
                      <tr key={item.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{item.description}</td>
                        <td className="px-4 py-3 text-foreground font-semibold">₹{item.price}</td>
                        <td className="px-4 py-3">
                          {item.tag && (
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${TAG_COLORS[item.tag]?.bg || "bg-muted"} ${TAG_COLORS[item.tag]?.text || "text-foreground"}`}
                            >
                              {item.tag}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{item.is_jain ? <Leaf size={14} className="text-emerald-600" /> : "—"}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => void patchItemFlags(item, { is_featured: !item.is_featured })}
                            className={`p-1.5 rounded-lg transition-colors ${item.is_featured ? "text-amber-500 bg-amber-50" : "text-muted-foreground hover:text-amber-500 hover:bg-amber-50"}`}
                            title="Toggle featured"
                          >
                            <Star size={14} fill={item.is_featured ? "currentColor" : "none"} />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => void patchItemFlags(item, { is_new: !item.is_new })}
                            className={`p-1.5 rounded-lg transition-colors ${item.is_new ? "text-emerald-500 bg-emerald-50" : "text-muted-foreground hover:text-emerald-500 hover:bg-emerald-50"}`}
                            title="Toggle new"
                          >
                            <Sparkles size={14} fill={item.is_new ? "currentColor" : "none"} />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditForm(item, cat.name)}
                              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteItem(item.id)}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {cat.items.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">
                          No items in this category yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {menu.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-12 text-center animate-fade-in">
          <p className="text-muted-foreground">No categories yet. Add a category, then add items.</p>
        </div>
      )}

      {showCatForm && (
        <div className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-bold text-foreground">Add Category</h2>
              <button
                type="button"
                onClick={() => {
                  setShowCatForm(false);
                  setNewCatName("");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Category Name</label>
                <input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Desserts"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  onKeyDown={(e) => e.key === "Enter" && void handleAddCategory()}
                />
              </div>
              <button
                type="button"
                onClick={() => void handleAddCategory()}
                className="w-full bg-foreground text-background py-3 rounded-lg font-medium text-sm hover:bg-foreground/90 transition-colors"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-bold text-foreground">{editingItem ? "Edit Item" : "Add Item"}</h2>
              <button type="button" onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Category</label>
                <input
                  value={formCatName}
                  onChange={(e) => setFormCatName(e.target.value)}
                  placeholder="e.g. Wood Fired Pizzas"
                  list="categories-list"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <datalist id="categories-list">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Item Name</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Classic Margherita"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Short description..."
                  rows={2}
                  className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Price (₹)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="650"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Tag</label>
                  <select
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {TAG_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t || "None"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <Switch checked={formFeatured} onCheckedChange={setFormFeatured} />
                  <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Star size={14} className="text-amber-500" /> Featured
                  </span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <Switch checked={formIsNew} onCheckedChange={setFormIsNew} />
                  <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Sparkles size={14} className="text-emerald-500" /> New
                  </span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <Switch checked={formJain} onCheckedChange={setFormJain} />
                  <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Leaf size={14} className="text-emerald-600" /> Jain
                  </span>
                </label>
              </div>

              <div className="space-y-3 pt-1 border-t border-border">
                <label className="text-sm font-medium text-foreground block">Item photo (optional)</label>
                <div className="flex items-start gap-4">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded border border-border bg-muted/30 flex items-center justify-center">
                    {formImagePreviewUrl ? (
                      <img
                        src={formImagePreviewUrl}
                        alt=""
                        className="h-full w-full object-contain"
                        style={{ transform: `scale(${formImageScale / 100})` }}
                      />
                    ) : (
                      <span className="text-[10px] text-muted-foreground text-center px-1">No image</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <input
                      type="file"
                      accept="image/*"
                      className="text-xs text-muted-foreground w-full"
                      onChange={(e) => setFormImageFile(e.target.files?.[0] ?? null)}
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1.5">Image size</p>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-label="Decrease image size"
                          disabled={formImageScale <= IMAGE_SCALE_MIN}
                          onClick={() => {
                            const next = clampImageScale(formImageScale - IMAGE_SCALE_STEP);
                            setFormImageScale(next);
                            setFormImageScaleInput(String(next));
                          }}
                          className="h-8 w-8 rounded-md border border-border bg-background flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-40"
                        >
                          <Minus size={14} />
                        </button>
                        <div className="relative flex-1 max-w-[7rem]">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formImageScaleInput}
                            onChange={(e) => setFormImageScaleInput(e.target.value.replace(/[^\d]/g, ""))}
                            onBlur={() => {
                              const next = clampImageScale(Number(formImageScaleInput));
                              setFormImageScale(next);
                              setFormImageScaleInput(String(next));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const next = clampImageScale(Number(formImageScaleInput));
                                setFormImageScale(next);
                                setFormImageScaleInput(String(next));
                              }
                            }}
                            className="w-full h-8 rounded-md border border-border bg-background px-2 pr-7 text-sm text-center tabular-nums"
                            aria-label="Image scale percent"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                            %
                          </span>
                        </div>
                        <button
                          type="button"
                          aria-label="Increase image size"
                          disabled={formImageScale >= IMAGE_SCALE_MAX}
                          onClick={() => {
                            const next = clampImageScale(formImageScale + IMAGE_SCALE_STEP);
                            setFormImageScale(next);
                            setFormImageScaleInput(String(next));
                          }}
                          className="h-8 w-8 rounded-md border border-border bg-background flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-40"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">50–200%. Steps of 5 with +/−.</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="w-full bg-foreground text-background py-3 rounded-lg font-medium text-sm hover:bg-foreground/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : editingItem ? "Update Item" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
