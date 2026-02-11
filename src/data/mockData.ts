export const mockCustomers = [
  { id: 1, name: "Mugdha Sharma", phone: "+91 98765 43210", visits: 12, lastVisit: "2026-02-10", tag: "VIP", status: "Active", feedback: 4.8 },
  { id: 2, name: "Arjun Patel", phone: "+91 87654 32109", visits: 8, lastVisit: "2026-02-09", tag: "Repeat", status: "Active", feedback: 4.2 },
  { id: 3, name: "Priya Nair", phone: "+91 76543 21098", visits: 3, lastVisit: "2026-02-08", tag: "New", status: "Active", feedback: 4.5 },
  { id: 4, name: "Rahul Gupta", phone: "+91 65432 10987", visits: 15, lastVisit: "2026-02-07", tag: "VIP", status: "Active", feedback: 4.9 },
  { id: 5, name: "Ananya Desai", phone: "+91 54321 09876", visits: 1, lastVisit: "2026-01-20", tag: "New", status: "Inactive", feedback: 3.8 },
  { id: 6, name: "Vikram Singh", phone: "+91 43210 98765", visits: 6, lastVisit: "2026-02-05", tag: "Repeat", status: "Active", feedback: 4.0 },
  { id: 7, name: "Sneha Kulkarni", phone: "+91 32109 87654", visits: 20, lastVisit: "2026-02-11", tag: "VIP", status: "Active", feedback: 5.0 },
  { id: 8, name: "Karan Mehta", phone: "+91 21098 76543", visits: 2, lastVisit: "2026-01-15", tag: "New", status: "Inactive", feedback: 3.2 },
];

export const mockFeedback = [
  { id: 1, name: "Mugdha Sharma", emoji: "😍", rating: "Loved it", comment: "Best pizza in town! The crust was perfect.", date: "2026-02-10", sentiment: "positive" },
  { id: 2, name: "Arjun Patel", emoji: "🙂", rating: "Good", comment: "Nice ambiance, food was decent.", date: "2026-02-09", sentiment: "neutral" },
  { id: 3, name: "Priya Nair", emoji: "😍", rating: "Loved it", comment: "Absolutely loved the cookie dough shake!", date: "2026-02-08", sentiment: "positive" },
  { id: 4, name: "Karan Mehta", emoji: "😕", rating: "Could be better", comment: "Service was slow today. Food was okay.", date: "2026-02-07", sentiment: "negative" },
  { id: 5, name: "Rahul Gupta", emoji: "😍", rating: "Loved it", comment: "The new menu items are amazing!", date: "2026-02-06", sentiment: "positive" },
  { id: 6, name: "Ananya Desai", emoji: "😕", rating: "Could be better", comment: "Pizza was cold when it arrived.", date: "2026-02-05", sentiment: "negative" },
  { id: 7, name: "Vikram Singh", emoji: "🙂", rating: "Good", comment: "Good food, nice place to hang out.", date: "2026-02-04", sentiment: "neutral" },
  { id: 8, name: "Sneha Kulkarni", emoji: "😍", rating: "Loved it", comment: "Perfect date night spot! 10/10", date: "2026-02-03", sentiment: "positive" },
];

export const mockRewards = [
  { id: 1, name: "Free Cookie 🍪", unlocked: 312, redeemed: 124, expiry: "5 days", status: "Active" },
  { id: 2, name: "10% Off Next Visit 🎉", unlocked: 198, redeemed: 87, expiry: "3 days", status: "Active" },
  { id: 3, name: "Free Drink 🥤", unlocked: 456, redeemed: 302, expiry: "Expired", status: "Expired" },
  { id: 4, name: "Buy 1 Get 1 Pizza 🍕", unlocked: 89, redeemed: 34, expiry: "7 days", status: "Active" },
];

export const mockMessages = [
  { id: 1, sender: "customer", text: "Hey! I loved the pizza last time 🍕", time: "2:30 PM" },
  { id: 2, sender: "business", text: "Thanks Mugdha! Glad you enjoyed it 😊 We have a special offer for you!", time: "2:32 PM" },
  { id: 3, sender: "customer", text: "Ooh tell me more!", time: "2:33 PM" },
  { id: 4, sender: "business", text: "Show this message for a free cookie 🍪 on your next visit!", time: "2:35 PM" },
  { id: 5, sender: "customer", text: "Amazing! I'll be there this weekend 🎉", time: "2:36 PM" },
];

export const dashboardStats = {
  totalCustomers: 842,
  repeatRate: 38,
  avgFeedback: 4.4,
  whatsappReach: 89,
};
