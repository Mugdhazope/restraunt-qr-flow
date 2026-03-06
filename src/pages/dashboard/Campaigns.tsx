import { useState } from "react";
import { useRestaurant } from "@/context/RestaurantContext";
import { campaignStats, mockCustomers } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";
import { Plus, Send, X } from "lucide-react";

const audiences = ["All Customers", "Frequent Visitors", "VIP Only", "Inactive 14+ Days"];
const tagOptions = ["VIP", "Frequent", "First-time", "Influencer", "Regular", "Frequent Visitor"];

const Campaigns = () => {
  const { selectedOutlet } = useRestaurant();
  const rid = selectedOutlet.restaurantId;
  const [selectedAudience, setSelectedAudience] = useState("All Customers");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [campaignName, setCampaignName] = useState("");
  const [message, setMessage] = useState("Hi! Weekend special is live 🍕\nShow this message for 10% off your next order.");
  const [sending, setSending] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);

  const restaurantCustomers = mockCustomers.filter((c) => c.restaurant === rid);

  const getRecipientCount = () => {
    if (selectedTags.length > 0) {
      return restaurantCustomers.filter((c) => selectedTags.includes(c.tag)).length;
    }
    switch (selectedAudience) {
      case "VIP Only": return restaurantCustomers.filter((c) => c.tag === "VIP").length;
      case "Frequent Visitors": return restaurantCustomers.filter((c) => c.visits >= 5).length;
      case "Inactive 14+ Days": return restaurantCustomers.filter((c) => c.status === "Inactive").length;
      default: return restaurantCustomers.length;
    }
  };

  const recipientCount = getRecipientCount();

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const handleSend = () => {
    if (!campaignName.trim()) {
      toast({ title: "Please enter a campaign name", variant: "destructive" });
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setShowBuilder(false);
      setCampaignName("");
      setSelectedTags([]);
      toast({ title: "Campaign sent", description: `"${campaignName}" sent to ${recipientCount} customers` });
    }, 1500);
  };

  const filteredCampaigns = campaignStats.filter((c) => c.restaurant === rid);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">WhatsApp Campaigns</h1>
          <p className="text-muted-foreground text-sm">Send targeted broadcasts to {selectedOutlet.name} customers</p>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors"
        >
          <Plus size={16} />
          New Campaign
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["Campaign", "Audience", "Sent", "Delivered", "Opened", "Responses", "Date", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.map((c) => (
                <tr key={c.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.audience}</td>
                  <td className="px-4 py-3 text-foreground">{c.sent}</td>
                  <td className="px-4 py-3 text-foreground">{c.delivered}</td>
                  <td className="px-4 py-3 text-foreground">{c.opened}</td>
                  <td className="px-4 py-3 text-foreground">{c.responses}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.date}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success">{c.status}</span>
                  </td>
                </tr>
              ))}
              {filteredCampaigns.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No campaigns yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showBuilder && (
        <div className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-bold text-foreground">Create Campaign — {selectedOutlet.name}</h2>
              <button onClick={() => setShowBuilder(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Campaign Name</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Weekend Special, VIP Exclusive"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Target Audience</label>
                <div className="grid grid-cols-2 gap-2">
                  {audiences.map((a) => (
                    <button
                      key={a}
                      onClick={() => { setSelectedAudience(a); setSelectedTags([]); }}
                      className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors border ${
                        selectedAudience === a && selectedTags.length === 0
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      <p>{a}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Or select by tags</label>
                <div className="flex flex-wrap gap-2">
                  {tagOptions.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                        selectedTags.includes(tag)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg px-4 py-3">
                <p className="text-sm text-foreground font-medium">
                  Campaign will be sent to <span className="text-primary font-bold">{recipientCount}</span> customers
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">WhatsApp Preview</label>
                <div className="bg-[hsl(var(--muted))] rounded-xl p-4 max-w-xs border border-border">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                    <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center text-white text-xs font-bold">
                      {selectedOutlet.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{selectedOutlet.name}</p>
                      <p className="text-[10px] text-muted-foreground">Business</p>
                    </div>
                  </div>
                  <div className="bg-card rounded-lg rounded-tl-none px-3 py-2.5 text-sm text-foreground whitespace-pre-line shadow-sm relative border border-border">
                    {message}
                    <span className="text-[10px] text-muted-foreground float-right mt-1 ml-2">2:30 PM ✓✓</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSend}
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 bg-foreground text-background py-3 rounded-lg font-medium text-sm hover:bg-foreground/90 transition-colors disabled:opacity-50"
              >
                <Send size={16} />
                {sending ? "Sending..." : `Send to ${recipientCount} customers`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
