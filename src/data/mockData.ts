export const outlets = [
  { id: 1, name: "Dough & Joe", location: "Koramangala, Bangalore" },
  { id: 2, name: "The Nest", location: "Indiranagar, Bangalore" },
];

export const mockCustomers = [
  { id: 1, name: "Mugdha Sharma", phone: "+91 98765 43210", visits: 12, lastVisit: "2026-02-10", tag: "VIP", status: "Active", feedback: 4.8, sentiment: "positive" },
  { id: 2, name: "Arjun Patel", phone: "+91 87654 32109", visits: 8, lastVisit: "2026-02-09", tag: "Frequent", status: "Active", feedback: 4.2, sentiment: "positive" },
  { id: 3, name: "Priya Nair", phone: "+91 76543 21098", visits: 3, lastVisit: "2026-02-08", tag: "First-time", status: "Active", feedback: 4.5, sentiment: "positive" },
  { id: 4, name: "Rahul Gupta", phone: "+91 65432 10987", visits: 15, lastVisit: "2026-02-07", tag: "VIP", status: "Active", feedback: 4.9, sentiment: "positive" },
  { id: 5, name: "Ananya Desai", phone: "+91 54321 09876", visits: 1, lastVisit: "2026-01-20", tag: "First-time", status: "Inactive", feedback: 3.8, sentiment: "neutral" },
  { id: 6, name: "Vikram Singh", phone: "+91 43210 98765", visits: 6, lastVisit: "2026-02-05", tag: "Frequent", status: "Active", feedback: 4.0, sentiment: "neutral" },
  { id: 7, name: "Sneha Kulkarni", phone: "+91 32109 87654", visits: 20, lastVisit: "2026-02-11", tag: "VIP", status: "Active", feedback: 5.0, sentiment: "positive" },
  { id: 8, name: "Karan Mehta", phone: "+91 21098 76543", visits: 2, lastVisit: "2026-01-15", tag: "First-time", status: "Inactive", feedback: 3.2, sentiment: "negative" },
  { id: 9, name: "Deepika Rao", phone: "+91 10987 65432", visits: 10, lastVisit: "2026-02-12", tag: "VIP", status: "Active", feedback: 4.7, sentiment: "positive" },
  { id: 10, name: "Amit Joshi", phone: "+91 09876 54321", visits: 4, lastVisit: "2026-02-01", tag: "Frequent", status: "Active", feedback: 3.9, sentiment: "neutral" },
];

export const mockFeedback = [
  { id: 1, name: "Mugdha Sharma", rating: 5, sentiment: "positive", comment: "Best pizza in town! The crust was perfect.", date: "2026-02-10", resolved: false },
  { id: 2, name: "Arjun Patel", rating: 4, sentiment: "neutral", comment: "Nice ambiance, food was decent.", date: "2026-02-09", resolved: false },
  { id: 3, name: "Priya Nair", rating: 5, sentiment: "positive", comment: "Absolutely loved the cookie dough shake!", date: "2026-02-08", resolved: true },
  { id: 4, name: "Karan Mehta", rating: 2, sentiment: "negative", comment: "Service was slow today. Food was okay.", date: "2026-02-07", resolved: false },
  { id: 5, name: "Rahul Gupta", rating: 5, sentiment: "positive", comment: "The new menu items are amazing!", date: "2026-02-06", resolved: true },
  { id: 6, name: "Ananya Desai", rating: 2, sentiment: "negative", comment: "Pizza was cold when it arrived.", date: "2026-02-05", resolved: false },
  { id: 7, name: "Vikram Singh", rating: 3, sentiment: "neutral", comment: "Good food, nice place to hang out.", date: "2026-02-04", resolved: true },
  { id: 8, name: "Sneha Kulkarni", rating: 5, sentiment: "positive", comment: "Perfect date night spot! 10/10", date: "2026-02-03", resolved: true },
  { id: 9, name: "Deepika Rao", rating: 5, sentiment: "positive", comment: "Love the vibe and food quality.", date: "2026-02-12", resolved: false },
  { id: 10, name: "Amit Joshi", rating: 3, sentiment: "neutral", comment: "Portions could be bigger for the price.", date: "2026-02-01", resolved: false },
];

export const mockRewards = [
  { id: 1, name: "Free Cookie", unlocked: 312, redeemed: 124, expiry: "5 days", status: "Active" },
  { id: 2, name: "10% Off Next Visit", unlocked: 198, redeemed: 87, expiry: "3 days", status: "Active" },
  { id: 3, name: "Free Drink", unlocked: 456, redeemed: 302, expiry: "Expired", status: "Expired" },
  { id: 4, name: "Buy 1 Get 1 Pizza", unlocked: 89, redeemed: 34, expiry: "7 days", status: "Active" },
];

export const mockMessages = [
  { id: 1, sender: "customer", text: "Hey! I loved the pizza last time", time: "2:30 PM" },
  { id: 2, sender: "business", text: "Thanks Mugdha! Glad you enjoyed it. We have a special offer for you!", time: "2:32 PM" },
  { id: 3, sender: "customer", text: "Tell me more!", time: "2:33 PM" },
  { id: 4, sender: "business", text: "Show this message for a free cookie on your next visit!", time: "2:35 PM" },
  { id: 5, sender: "customer", text: "Amazing! I'll be there this weekend", time: "2:36 PM" },
];

export const dashboardStats = {
  totalCustomers: 842,
  customersThisWeek: 47,
  feedbackCollected: 324,
  positiveFeedbackRate: 78,
  googleReviewsGenerated: 156,
  campaignsSent: 23,
  repeatRate: 38,
  avgFeedback: 4.4,
  whatsappReach: 89,
};

export const customerGrowthData = [
  { month: "Sep", customers: 520 },
  { month: "Oct", customers: 580 },
  { month: "Nov", customers: 640 },
  { month: "Dec", customers: 710 },
  { month: "Jan", customers: 780 },
  { month: "Feb", customers: 842 },
];

export const feedbackSentimentData = [
  { name: "Positive", value: 65, fill: "hsl(142, 71%, 45%)" },
  { name: "Neutral", value: 22, fill: "hsl(220, 9%, 46%)" },
  { name: "Negative", value: 13, fill: "hsl(0, 72%, 51%)" },
];

export const visitFrequencyData = [
  { range: "1 visit", count: 180 },
  { range: "2-3", count: 240 },
  { range: "4-6", count: 200 },
  { range: "7-10", count: 130 },
  { range: "10+", count: 92 },
];

export const reviewFunnelStats = {
  feedbackReceived: 324,
  positiveFeedback: 253,
  reviewRequestsSent: 198,
  googleReviewsGenerated: 156,
};

export const campaignStats = [
  { id: 1, name: "Weekend Special", audience: "All Customers", sent: 842, delivered: 812, opened: 634, responses: 89, date: "2026-02-10", status: "Completed" },
  { id: 2, name: "VIP Exclusive", audience: "VIP Only", sent: 89, delivered: 87, opened: 72, responses: 34, date: "2026-02-08", status: "Completed" },
  { id: 3, name: "Comeback Offer", audience: "Inactive 14+ Days", sent: 64, delivered: 61, opened: 45, responses: 18, date: "2026-02-05", status: "Completed" },
];

export const automationRules = [
  { id: 1, trigger: "Positive feedback received", action: "Send Google review prompt via WhatsApp", status: "Active", runs: 253 },
  { id: 2, trigger: "No visit for 14 days", action: "Send comeback message with 10% off", status: "Active", runs: 64 },
  { id: 3, trigger: "3rd visit completed", action: "Tag as Frequent + send loyalty reward", status: "Active", runs: 128 },
  { id: 4, trigger: "Negative feedback received", action: "Alert manager + send apology message", status: "Paused", runs: 18 },
  { id: 5, trigger: "Birthday detected", action: "Send birthday discount (20% off)", status: "Active", runs: 42 },
];

export const analyticsData = {
  returnRate: [
    { month: "Sep", rate: 28 },
    { month: "Oct", rate: 31 },
    { month: "Nov", rate: 33 },
    { month: "Dec", rate: 35 },
    { month: "Jan", rate: 36 },
    { month: "Feb", rate: 38 },
  ],
  reviewGeneration: [
    { month: "Sep", reviews: 12 },
    { month: "Oct", reviews: 18 },
    { month: "Nov", reviews: 24 },
    { month: "Dec", reviews: 32 },
    { month: "Jan", reviews: 38 },
    { month: "Feb", reviews: 32 },
  ],
  campaignPerformance: [
    { month: "Sep", sent: 320, opened: 210 },
    { month: "Oct", sent: 450, opened: 320 },
    { month: "Nov", sent: 380, opened: 280 },
    { month: "Dec", sent: 520, opened: 410 },
    { month: "Jan", sent: 610, opened: 480 },
    { month: "Feb", sent: 842, opened: 634 },
  ],
  visitTrends: [
    { week: "W1", visits: 120 },
    { week: "W2", visits: 145 },
    { week: "W3", visits: 132 },
    { week: "W4", visits: 168 },
    { week: "W5", visits: 155 },
    { week: "W6", visits: 178 },
    { week: "W7", visits: 162 },
    { week: "W8", visits: 190 },
  ],
};
