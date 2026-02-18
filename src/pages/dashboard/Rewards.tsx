import { useState } from "react";
import { mockRewards } from "@/data/mockData";
import { Plus, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Rewards = () => {
  const [rewards, setRewards] = useState(mockRewards);
  const [showCreate, setShowCreate] = useState(false);
  const [newReward, setNewReward] = useState({ name: "", expiry: "7 days" });

  const handleCreate = () => {
    if (!newReward.name.trim()) return;
    const reward = {
      id: rewards.length + 1,
      name: newReward.name,
      unlocked: 0,
      redeemed: 0,
      expiry: newReward.expiry,
      status: "Active" as const,
    };
    setRewards([reward, ...rewards]);
    setNewReward({ name: "", expiry: "7 days" });
    setShowCreate(false);
    toast({ title: "Reward Created! 🎁", description: `"${reward.name}" is now live` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <h1 className="text-2xl font-extrabold text-foreground">Reward Campaigns</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-full hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
        >
          <Plus size={18} /> Create New
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl shadow-card p-6 w-full max-w-md animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-foreground">Create New Reward</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Reward Name</label>
                <input
                  value={newReward.name}
                  onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                  placeholder="e.g. Free Cookie 🍪"
                  className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Expiry</label>
                <select
                  value={newReward.expiry}
                  onChange={(e) => setNewReward({ ...newReward, expiry: e.target.value })}
                  className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option>3 days</option>
                  <option>5 days</option>
                  <option>7 days</option>
                  <option>14 days</option>
                  <option>30 days</option>
                </select>
              </div>
              <button
                onClick={handleCreate}
                disabled={!newReward.name.trim()}
                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-full hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                Create Reward 🎁
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {rewards.map((reward, i) => (
          <div
            key={reward.id}
            className="bg-card rounded-3xl shadow-card p-6 hover:shadow-glow hover:-translate-y-1 transition-all duration-300 animate-fade-in"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">{reward.name}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                reward.status === "Active"
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-muted text-muted-foreground border border-border"
              }`}>
                {reward.status}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xl font-extrabold text-foreground">{reward.unlocked}</p>
                <p className="text-muted-foreground text-xs">Unlocked</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-foreground">{reward.redeemed}</p>
                <p className="text-muted-foreground text-xs">Redeemed</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-foreground">{reward.expiry}</p>
                <p className="text-muted-foreground text-xs">Expiry</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Rewards;
