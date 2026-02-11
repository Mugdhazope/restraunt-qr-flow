import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";

const Reward = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const duration = 2000;
    const end = Date.now() + duration;
    const colors = ["#E10600", "#FFF6EA", "#1F4AE0"];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div className="min-h-screen bg-background checker-bg flex flex-col items-center justify-center p-4">
      <div className="bg-card rounded-3xl shadow-card p-10 max-w-sm w-full animate-scale-in text-center">
        <span className="text-6xl block mb-4">🎉</span>
        <h2 className="text-2xl font-extrabold text-foreground mb-2">You've unlocked</h2>
        
        <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-6 my-6">
          <span className="text-5xl block mb-3">🍪</span>
          <h3 className="text-xl font-bold text-foreground">Free Cookie</h3>
          <p className="text-muted-foreground text-sm mt-1">Valid for 5 days</p>
        </div>

        <button
          onClick={() => navigate("/")}
          className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-full text-lg hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          See You Soon! 👋
        </button>

        <p className="text-muted-foreground text-xs mt-4">Check WhatsApp for confirmation ✅</p>
      </div>
    </div>
  );
};

export default Reward;
