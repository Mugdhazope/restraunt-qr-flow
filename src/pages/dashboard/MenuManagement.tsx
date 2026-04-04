import { useState } from "react";
import { useRestaurant } from "@/context/RestaurantContext";
import { restaurants, MenuCategory, MenuItem } from "@/data/menuData";
import { Plus, Pencil, Trash2, X, Star, Sparkles, FolderPlus, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

const TAG_OPTIONS = ["", "Bestseller", "Chef's Pick", "Popular", "New"];
const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  Bestseller: { bg: "bg-amber-100", text: "text-amber-800" },
  "Chef's Pick": { bg: "bg-pink-100", text: "text-pink-800" },
  Popular: { bg: "bg-blue-100", text: "text-blue-800" },
  New: { bg: "bg-green-100", text: "text-green-800" },
};

const MenuManagement = () => {
  const { selectedOutlet } = useRestaurant();
  const rid = selectedOutlet.restaurantId;
  const restaurant = restaurants[rid];
  const [menu, setMenu] = useState<MenuCategory[]>(restaurant?.menu || []);

  // Item form state
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<{ catIdx: number; itemIdx: number } | null>(null);
  const [formCat, setFormCat] = useState("");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formTag, setFormTag] = useState("");
  const [formFeatured, setFormFeatured] = useState(false);
  const [formIsNew, setFormIsNew] = useState(false);

  // Category form state
  const [showCatForm, setShowCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  // Collapsed categories
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const categories = menu.map((c) => c.name);

  const featuredItems = menu.flatMap((cat, catIdx) =>
    cat.items.map((item, itemIdx) => ({ item, catIdx, itemIdx, catName: cat.name }))
  ).filter((x) => x.item.featured);

  const newItems = menu.flatMap((cat, catIdx) =>
    cat.items.map((item, itemIdx) => ({ item, catIdx, itemIdx, catName: cat.name }))
  ).filter((x) => x.item.isNew);

  const resetForm = () => {
    setFormCat("");
    setFormName("");
    setFormDesc("");
    setFormPrice("");
    setFormTag("");
    setFormFeatured(false);
    setFormIsNew(false);
    setEditingItem(null);
    setShowForm(false);
  };

  const openAddForm = () => {
    resetForm();
    setFormCat(categories[0] || "");
    setShowForm(true);
  };

  const openEditForm = (catIdx: number, itemIdx: number) => {
    const item = menu[catIdx].items[itemIdx];
    setFormCat(menu[catIdx].name);
    setFormName(item.name);
    setFormDesc(item.description);
    setFormPrice(String(item.price));
    setFormTag(item.tag || "");
    setFormFeatured(item.featured || false);
    setFormIsNew(item.isNew || false);
    setEditingItem({ catIdx, itemIdx });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formPrice.trim()) {
      toast({ title: "Name and price are required", variant: "destructive" });
      return;
    }
    const newItem: MenuItem = {
      name: formName.trim(),
      description: formDesc.trim(),
      price: Number(formPrice),
      ...(formTag ? { tag: formTag } : {}),
      ...(formFeatured ? { featured: true } : {}),
      ...(formIsNew ? { isNew: true } : {}),
    };

    setMenu((prev) => {
      const updated = prev.map((c) => ({ ...c, items: [...c.items] }));
      const catIdx = updated.findIndex((c) => c.name === formCat);

      if (editingItem) {
        updated[editingItem.catIdx].items[editingItem.itemIdx] = newItem;
      } else if (catIdx >= 0) {
        updated[catIdx].items.push(newItem);
      } else {
        updated.push({ name: formCat, items: [newItem] });
      }
      return updated;
    });

    toast({ title: editingItem ? "Item updated" : "Item added" });
    resetForm();
  };

  const handleDelete = (catIdx: number, itemIdx: number) => {
    setMenu((prev) => {
      const updated = prev.map((c) => ({ ...c, items: [...c.items] }));
      updated[catIdx].items.splice(itemIdx, 1);
      if (updated[catIdx].items.length === 0) updated.splice(catIdx, 1);
      return updated;
    });
    toast({ title: "Item deleted" });
  };

  const toggleFeatured = (catIdx: number, itemIdx: number) => {
    setMenu((prev) => {
      const updated = prev.map((c) => ({ ...c, items: [...c.items] }));
      const item = { ...updated[catIdx].items[itemIdx] };
      item.featured = !item.featured;
      updated[catIdx].items[itemIdx] = item;
      return updated;
    });
    toast({ title: menu[catIdx].items[itemIdx].featured ? "Removed from featured" : "Added to featured" });
  };

  const toggleNew = (catIdx: number, itemIdx: number) => {
    setMenu((prev) => {
      const updated = prev.map((c) => ({ ...c, items: [...c.items] }));
      const item = { ...updated[catIdx].items[itemIdx] };
      item.isNew = !item.isNew;
      updated[catIdx].items[itemIdx] = item;
      return updated;
    });
    toast({ title: menu[catIdx].items[itemIdx].isNew ? "Removed from New This Week" : "Marked as New This Week" });
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) {
      toast({ title: "Category name is required", variant: "destructive" });
      return;
    }
    if (categories.includes(newCatName.trim())) {
      toast({ title: "Category already exists", variant: "destructive" });
      return;
    }
    setMenu((prev) => [...prev, { name: newCatName.trim(), items: [] }]);
    toast({ title: `Category "${newCatName.trim()}" added` });
    setNewCatName("");
    setShowCatForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Menu Management</h1>
          <p className="text-muted-foreground text-sm">
            {restaurant?.name} — {menu.reduce((a, c) => a + c.items.length, 0)} items across {menu.length} categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCatForm(true)}
            className="flex items-center gap-2 border border-border text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            <FolderPlus size={16} />
            Add Category
          </button>
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            <Plus size={16} />
            Add Item
          </button>
        </div>
      </div>

      {/* Featured & New This Week summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star size={16} className="text-amber-500" />
            <h3 className="font-semibold text-foreground text-sm">Featured Items</h3>
            <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{featuredItems.length}</span>
          </div>
          {featuredItems.length === 0 ? (
            <p className="text-xs text-muted-foreground">No featured items. Toggle the star on any item to feature it.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {featuredItems.map((x) => (
                <span key={x.item.name} className="text-xs bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full font-medium">
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
            <p className="text-xs text-muted-foreground">No new items this week. Toggle the sparkle on any item.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {newItems.map((x) => (
                <span key={x.item.name} className="text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full font-medium">
                  {x.item.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Menu table per category */}
      {menu.map((cat, catIdx) => {
        const isCollapsed = collapsed[catIdx];
        return (
          <div key={cat.name} className="bg-card border border-border rounded-xl overflow-hidden animate-fade-in">
            <button
              onClick={() => setCollapsed((p) => ({ ...p, [catIdx]: !p[catIdx] }))}
              className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border hover:bg-muted/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isCollapsed ? <ChevronRight size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                <h2 className="font-semibold text-foreground text-sm">{cat.name}</h2>
                <span className="text-xs text-muted-foreground">({cat.items.length})</span>
              </div>
            </button>
            {!isCollapsed && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["Item", "Description", "Price", "Tag", "Featured", "New", "Actions"].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cat.items.map((item, itemIdx) => (
                      <tr key={item.name} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{item.description}</td>
                        <td className="px-4 py-3 text-foreground font-semibold">₹{item.price}</td>
                        <td className="px-4 py-3">
                          {item.tag && (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${TAG_COLORS[item.tag]?.bg || "bg-muted"} ${TAG_COLORS[item.tag]?.text || "text-foreground"}`}>
                              {item.tag}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleFeatured(catIdx, itemIdx)}
                            className={`p-1.5 rounded-lg transition-colors ${item.featured ? "text-amber-500 bg-amber-50" : "text-muted-foreground hover:text-amber-500 hover:bg-amber-50"}`}
                            title="Toggle featured"
                          >
                            <Star size={14} fill={item.featured ? "currentColor" : "none"} />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleNew(catIdx, itemIdx)}
                            className={`p-1.5 rounded-lg transition-colors ${item.isNew ? "text-emerald-500 bg-emerald-50" : "text-muted-foreground hover:text-emerald-500 hover:bg-emerald-50"}`}
                            title="Toggle new this week"
                          >
                            <Sparkles size={14} fill={item.isNew ? "currentColor" : "none"} />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEditForm(catIdx, itemIdx)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleDelete(catIdx, itemIdx)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {cat.items.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">
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
          <p className="text-muted-foreground">No menu items yet. Click "Add Item" to get started.</p>
        </div>
      )}

      {/* Add Category Modal */}
      {showCatForm && (
        <div className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-bold text-foreground">Add Category</h2>
              <button onClick={() => { setShowCatForm(false); setNewCatName(""); }} className="text-muted-foreground hover:text-foreground">
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
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                />
              </div>
              <button
                onClick={handleAddCategory}
                className="w-full bg-foreground text-background py-3 rounded-lg font-medium text-sm hover:bg-foreground/90 transition-colors"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-bold text-foreground">{editingItem ? "Edit Item" : "Add Item"}</h2>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Category</label>
                <input
                  value={formCat}
                  onChange={(e) => setFormCat(e.target.value)}
                  placeholder="e.g. Wood Fired Pizzas"
                  list="categories-list"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <datalist id="categories-list">
                  {categories.map((c) => <option key={c} value={c} />)}
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
                    type="number"
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
                      <option key={t} value={t}>{t || "None"}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Featured & New toggles */}
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <Switch checked={formFeatured} onCheckedChange={setFormFeatured} />
                  <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Star size={14} className="text-amber-500" /> Featured
                  </span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <Switch checked={formIsNew} onCheckedChange={setFormIsNew} />
                  <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Sparkles size={14} className="text-emerald-500" /> New This Week
                  </span>
                </label>
              </div>

              <button
                onClick={handleSave}
                className="w-full bg-foreground text-background py-3 rounded-lg font-medium text-sm hover:bg-foreground/90 transition-colors"
              >
                {editingItem ? "Update Item" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
