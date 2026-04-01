import pizzaHero from "@/assets/menu/pizza-hero.jpg";
import drinksHero from "@/assets/menu/drinks-hero.jpg";
import appetizersHero from "@/assets/menu/appetizers-hero.jpg";
import breakfastHero from "@/assets/menu/breakfast-hero.jpg";
import dimsumsHero from "@/assets/menu/dimsums-hero.jpg";
import sidesHero from "@/assets/menu/sides-hero.jpg";
import saladsHero from "@/assets/menu/salads-hero.jpg";
import sandwichesHero from "@/assets/menu/sandwiches-hero.jpg";
import beveragesHero from "@/assets/menu/beverages-hero.jpg";
import milkshakesHero from "@/assets/menu/milkshakes-hero.jpg";

// Individual item images (transparent PNGs)
import pizza1 from "@/assets/menu/items/pizza-1.png";
import pizza2 from "@/assets/menu/items/pizza-2.png";
import pizza3 from "@/assets/menu/items/pizza-3.png";
import pizza4 from "@/assets/menu/items/pizza-4.png";
import pizza5 from "@/assets/menu/items/pizza-5.png";
import appetizer1 from "@/assets/menu/items/appetizer-1.png";
import appetizer2 from "@/assets/menu/items/appetizer-2.png";
import appetizer3 from "@/assets/menu/items/appetizer-3.png";
import appetizer4 from "@/assets/menu/items/appetizer-4.png";
import appetizer5 from "@/assets/menu/items/appetizer-5.png";
import side1 from "@/assets/menu/items/side-1.png";
import side2 from "@/assets/menu/items/side-2.png";
import side3 from "@/assets/menu/items/side-3.png";
import side4 from "@/assets/menu/items/side-4.png";
import shake1 from "@/assets/menu/items/shake-1.png";
import shake2 from "@/assets/menu/items/shake-2.png";
import shake3 from "@/assets/menu/items/shake-3.png";
import shake4 from "@/assets/menu/items/shake-4.png";
import drinksSingle from "@/assets/menu/drink-single.png";
import foodCollage from "@/assets/menu/food-collage.png";

export const categoryImages: Record<string, string> = {
  "Wood Fired Pizzas": pizzaHero,
  "Shakes & Drinks": drinksHero,
  "Non Veg Appetizers": appetizersHero,
  "Sides": sidesHero,
  "All Day Breakfast": breakfastHero,
  "Shares": sidesHero,
  "Dim Sums": dimsumsHero,
  "Salads": saladsHero,
  "Toasts & Sandwiches": sandwichesHero,
  "Beverages": beveragesHero,
  "Milkshakes": milkshakesHero,
};

// Map item names to their individual transparent PNG images
export const itemImages: Record<string, string> = {
  // Pizzas
  "Classic Margherita": pizza1,
  "Mamma Mia Truffle": pizza2,
  "Pesto Genovese": pizza3,
  "White Whisper": pizza4,
  "Garden Party": pizza5,
  "The Feta Fiesta": pizza1,
  "Cheesy Chaos": pizza2,
  "Papa's Chicken Pepperoni": pizza3,
  "Pollo Piccante": pizza5,
  // Non Veg Appetizers
  "Crispy Parm Poppers": appetizer1,
  "Lemon Pepper Wings": appetizer2,
  "Lamb Meatballs": appetizer3,
  "Fish & Chips": appetizer4,
  "Diavola Prawns": appetizer5,
  "Butter Garlic Prawns": appetizer5,
  // Sides
  "Garlic Bread": side1,
  "Cheesy Fries": side2,
  "Mozzarella Sticks": side3,
  "Bruschetta": side4,
  // Shakes & Drinks
  "Cookie Dough Shake": shake1,
  "Nutella Shake": shake2,
  "Fresh Lemonade": shake3,
  "Cold Coffee": shake4,
  // The Nest — reuse appropriate images
  "Turkish Eggs": side1,
  "French Omelette / Scramble": side4,
  "Akuri Tofu": appetizer1,
  "Buttermilk Pancakes": side1,
  "Fries Your Way": side2,
  "Loaded Nachos": side2,
  "Jalapeño Cheese Poppers": appetizer1,
  "Avocado Sevpuri": side4,
  "Steamed Edamame": appetizer5,
  "Cheese Corndog": side3,
  "Chicken Wings": appetizer2,
  "Truffle Edamame": appetizer5,
  "Burnt Garlic": appetizer3,
  "Firecracker": appetizer1,
  "Truffle Mushroom": pizza2,
  "Coriander Chicken": appetizer2,
  "Thai Basil Chicken": appetizer3,
  "Caesar Salad": side4,
  "Grilled Protein Salad": foodCollage,
  "French Country": side4,
  "Avocado Toast": side1,
  "Guacamole Toast": side4,
  "Shroom on Toast": side1,
  "Paneer Indie S'wich": appetizer4,
  "Crispy Chicken S'wich": appetizer4,
  "Espresso": shake4,
  "Cappuccino": shake4,
  "Latte": shake4,
  "Signature Cold Coffee": shake4,
  "Hazelnut Frappe": shake2,
  "Gharwali Chai": drinksSingle,
  "Biscoff Milkshake": shake1,
  "Ferrero Rocher Milkshake": shake2,
  "Nutella Milkshake": shake2,
  "Oreo Milkshake": shake1,
};
