import { mockRewards } from "@/data/mockData";
import { Plus } from "lucide-react";

const Rewards = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <h1 className="text-2xl font-extrabold text-foreground">Reward Campaigns</h1>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-full hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all text-sm">
          <Plus size={18} /> Create New
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {mockRewards.map((reward, i) => (
          <div
            key={reward.id}
            className="bg-card rounded-3xl shadow-card p-6 hover:shadow-glow hover:-translate-y-1 transition-all duration-300 animate-fade-in"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">{reward.name}</h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  reward.status === "Active"
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
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
