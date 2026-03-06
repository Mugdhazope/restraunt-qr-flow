import { useState } from "react";
import { useRestaurant } from "@/context/RestaurantContext";
import { restaurants, MenuCategory, MenuItem } from "@/data/menuData";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const MenuManagement = () => {
  const { selectedOutlet } = useRestaurant();
  const rid = selectedOutlet.restaurantId;
  const restaurant = restaurants[rid];
  const [menu, setMenu] = useState<MenuCategory[]>(restaurant?.menu || []);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<{ catIdx: number; itemIdx: number } | null>(null);

  const [formCat, setFormCat] = useState("");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formTag, setFormTag] = useState("");

  const categories = menu.map((c) => c.name);

  const resetForm = () => {
    setFormCat("");
    setFormName("");
    setFormDesc("");
    setFormPrice("");
    setFormTag("");
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Menu Management</h1>
          <p className="text-muted-foreground text-sm">{restaurant?.name} — {menu.reduce((a, c) => a + c.items.length, 0)} items</p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors"
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>

      {/* Menu table per category */}
      {menu.map((cat, catIdx) => (
        <div key={cat.name} className="bg-card border border-border rounded-xl overflow-hidden animate-fade-in">
          <div className="px-4 py-3 bg-muted/50 border-b border-border">
            <h2 className="font-semibold text-foreground text-sm">{cat.name}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Item", "Description", "Price", "Tag", "Actions"].map((h) => (
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
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">{item.tag}</span>
                      )}
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
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {menu.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-12 text-center animate-fade-in">
          <p className="text-muted-foreground">No menu items yet. Click "Add Item" to get started.</p>
        </div>
      )}

      {/* Add/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md animate-scale-in">
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
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Tag (optional)</label>
                  <select
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">None</option>
                    <option value="Bestseller">Bestseller</option>
                    <option value="Chef's Pick">Chef's Pick</option>
                    <option value="Popular">Popular</option>
                    <option value="New">New</option>
                  </select>
                </div>
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
