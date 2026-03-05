export interface MenuItem {
  name: string;
  description: string;
  price: number;
  tag?: string;
  jain?: boolean;
}

export interface MenuCategory {
  name: string;
  items: MenuItem[];
}

export interface RestaurantConfig {
  id: string;
  name: string;
  tagline: string;
  accentColor: string;
  accentBg: string;
  accentText: string;
  menu: MenuCategory[];
}

export const restaurants: Record<string, RestaurantConfig> = {
  doughandjoe: {
    id: "doughandjoe",
    name: "Dough & Joe",
    tagline: "Wood-fired goodness, served with love.",
    accentColor: "0 72% 51%",
    accentBg: "bg-red-50",
    accentText: "text-red-600",
    menu: [
      {
        name: "Wood Fired Pizzas",
        items: [
          { name: "Classic Margherita", description: "San Marzano Tomato Sauce, Fior Di Latte, Fresh Basil", price: 650, tag: "Bestseller", jain: true },
          { name: "Mamma Mia Truffle", description: "Alfredo Sauce, Mushrooms, Fior di Latte, Truffle Oil, Fresh Parsley", price: 680, tag: "Chef's Pick" },
          { name: "Pesto Genovese", description: "Basil Pesto, Fior di Latte, Cherry Tomatoes, Baby Spinach, Parmesan Shavings", price: 650, jain: true },
          { name: "White Whisper", description: "Alfredo Sauce, Fior di Latte, Garlic-infused Olive oil and Rosemary", price: 600 },
          { name: "Garden Party", description: "San Marzano Tomato Sauce, Fior di Latte, Charred Zucchini, Bell peppers, Eggplant, Onion, and Basil Pesto Drizzle", price: 650, jain: true },
          { name: "The Feta Fiesta", description: "San Marzano Tomato Sauce, Fior di Latte, Sautéed Spinach, Feta Cheese, Sun-Dried Tomatoes, Black Olives", price: 650, jain: true },
          { name: "Cheesy Chaos", description: "Alfredo, Fior di Latte, Blue Cheese, Cheddar, and Straticella, Hot Honey Drizzle", price: 700 },
          { name: "Papa's Chicken Pepperoni", description: "San Marzano Tomato Sauce, Chicken Pepperoni, Fior di Latte, Red Bell Pepper. Try with hot honey!", price: 650, tag: "Popular" },
          { name: "Pollo Piccante", description: "San Marzano Tomato Sauce, Spicy Grilled Chicken, Jalapeños, Caramelized Onions, Mozzarella, Roasted Red Pepper", price: 650 },
        ],
      },
      {
        name: "Non Veg Appetizers",
        items: [
          { name: "Crispy Parm Poppers", description: "Juicy Chicken Bites Coated in Parmesan and Herbs, Served with Sriracha Mayo", price: 450 },
          { name: "Lemon Pepper Wings", description: "Oven-baked Wings Tossed in Lemon, Pepper, and Butter, Served with Ranch", price: 480, tag: "Popular" },
          { name: "Lamb Meatballs", description: "Juicy Lamb Meatballs in House Marinara Sauce, Served with Sourdough Bread", price: 650 },
          { name: "Fish & Chips", description: "Classic Battered Fish, Served with House Fries & Tartar Sauce", price: 600 },
          { name: "Diavola Prawns", description: "Jalapeño-spiked Marinara, Prawns, Fresh Basil, Served with Sourdough Bread", price: 620 },
          { name: "Butter Garlic Prawns", description: "Juicy Prawns Tossed in Butter, Garlic, and Herbs, Served with Sourdough Bread", price: 620 },
        ],
      },
      {
        name: "Sides",
        items: [
          { name: "Garlic Bread", description: "Toasted with butter, garlic, herbs", price: 199 },
          { name: "Cheesy Fries", description: "Loaded with cheddar sauce & jalapeños", price: 249, tag: "Popular" },
          { name: "Mozzarella Sticks", description: "Crispy fried, marinara dip", price: 299 },
          { name: "Bruschetta", description: "Tomato, basil, balsamic on toasted ciabatta", price: 279 },
        ],
      },
      {
        name: "Shakes & Drinks",
        items: [
          { name: "Cookie Dough Shake", description: "Vanilla ice cream, cookie chunks, whipped cream", price: 319, tag: "Bestseller" },
          { name: "Nutella Shake", description: "Rich chocolate hazelnut, topped with brownie", price: 339 },
          { name: "Fresh Lemonade", description: "Classic lemon, mint, soda option available", price: 179 },
          { name: "Cold Coffee", description: "Espresso, milk, ice, chocolate drizzle", price: 249, tag: "Popular" },
        ],
      },
    ],
  },
  thenest: {
    id: "thenest",
    name: "The Nest",
    tagline: "Feels like home.",
    accentColor: "152 45% 30%",
    accentBg: "bg-emerald-50",
    accentText: "text-emerald-700",
    menu: [
      {
        name: "All Day Breakfast",
        items: [
          { name: "Turkish Eggs", description: "Poached eggs over garlicky yogurt, topped with spicy paprika butter and fresh herbs", price: 380, tag: "Popular" },
          { name: "French Omelette / Scramble", description: "Served with hashbrowns & choice of bread", price: 300 },
          { name: "Akuri Tofu", description: "Soft tofu cooked with onions, tomatoes, chillies, and warm spices, served with sourdough toast", price: 400 },
          { name: "Buttermilk Pancakes", description: "Soft and fluffy pancakes, served with maple syrup and a pat of butter", price: 400 },
        ],
      },
      {
        name: "Shares",
        items: [
          { name: "Fries Your Way", description: "Salted / Peri Peri / Gunpowder / Truffle", price: 380 },
          { name: "Loaded Nachos", description: "Crispy tortilla chips loaded with melted cheese, jalapeños, beans, salsa, sour cream, and guacamole", price: 430, tag: "Popular" },
          { name: "Jalapeño Cheese Poppers", description: "Crispy-fried jalapeños stuffed with creamy cheese, served with a tangy dipping sauce", price: 470 },
          { name: "Avocado Sevpuri", description: "Crisp puris topped with creamy avocado, tangy chutneys, crunchy sev, and fresh herbs", price: 480, tag: "Chef's Pick" },
          { name: "Steamed Edamame", description: "Young soybeans lightly steamed and sprinkled with sea salt", price: 550 },
          { name: "Cheese Corndog", description: "Melty mozzarella coated in a crispy, golden batter", price: 490 },
          { name: "Chicken Wings", description: "Fiery chicken wings tossed in bhoot jolokia sauce", price: 485 },
        ],
      },
      {
        name: "Dim Sums",
        items: [
          { name: "Truffle Edamame", description: "Edamame-stuffed dim sums infused with truffle oil, served with soy-chili dip", price: 610 },
          { name: "Burnt Garlic", description: "Dim sums stuffed with spiced vegetables and tossed in smoky burnt garlic oil", price: 560 },
          { name: "Firecracker", description: "Spicy, flavor-loaded dim sums with a fiery chili stuffing, tossed in a bold hot garlic sauce", price: 570 },
          { name: "Truffle Mushroom", description: "Dim sums filled with mushrooms and a touch of truffle oil", price: 580, tag: "Chef's Pick" },
          { name: "Coriander Chicken", description: "Juicy chicken dim sums infused with fresh coriander, steamed and served with a zesty chili-soy dip", price: 600 },
          { name: "Thai Basil Chicken", description: "Dim sums generously stuffed with spiced chicken, fresh Thai basil, and aromatic herbs", price: 610 },
        ],
      },
      {
        name: "Salads",
        items: [
          { name: "Caesar Salad", description: "Crisp romaine lettuce tossed in creamy Caesar dressing, parmesan, and crunchy croutons", price: 480 },
          { name: "Grilled Protein Salad", description: "Fresh greens topped with grilled protein of your choice, seasonal veggies, and a zesty house dressing", price: 530 },
          { name: "French Country", description: "Fresh greens, roasted beets, cherry tomatoes, walnuts, and feta cheese, tossed in a classic passionfruit vinaigrette", price: 490 },
        ],
      },
      {
        name: "Toasts & Sandwiches",
        items: [
          { name: "Avocado Toast", description: "Toasted sourdough topped with sliced avocado, chili flakes, and a squeeze of lemon", price: 530, tag: "Popular" },
          { name: "Guacamole Toast", description: "Crunchy toast layered with zesty guacamole, cherry tomatoes, and a sprinkle of microgreens", price: 540 },
          { name: "Shroom on Toast", description: "Sautéed wild mushrooms in garlic butter, served on toasted sourdough with a hint of thyme", price: 420 },
          { name: "Paneer Indie S'wich", description: "Grilled sandwich stuffed with spicy paneer tikka, crunchy veggies, and a tangy mint chutney", price: 440 },
          { name: "Crispy Chicken S'wich", description: "Crispy fried chicken, lettuce, pickles, and creamy house mayo pressed in brioche bread", price: 480 },
        ],
      },
      {
        name: "Beverages",
        items: [
          { name: "Espresso", description: "Classic single shot", price: 190 },
          { name: "Cappuccino", description: "Espresso with steamed milk foam", price: 260 },
          { name: "Latte", description: "Smooth espresso with steamed milk", price: 280, tag: "Popular" },
          { name: "Signature Cold Coffee", description: "House blend cold brew with milk", price: 370, tag: "Bestseller" },
          { name: "Hazelnut Frappe", description: "Blended hazelnut coffee frappe", price: 390 },
          { name: "Gharwali Chai", description: "Traditional Indian chai, made with love", price: 230 },
        ],
      },
      {
        name: "Milkshakes",
        items: [
          { name: "Biscoff Milkshake", description: "Rich biscoff cookie butter shake", price: 400, tag: "Bestseller" },
          { name: "Ferrero Rocher Milkshake", description: "Chocolate hazelnut indulgence", price: 420 },
          { name: "Nutella Milkshake", description: "Creamy Nutella blended shake", price: 400 },
          { name: "Oreo Milkshake", description: "Cookies and cream classic", price: 360 },
        ],
      },
    ],
  },
};
