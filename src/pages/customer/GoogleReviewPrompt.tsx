import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";

const GoogleReviewPrompt = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 animate-fade-in text-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">That means a lot to us</h1>
          <p className="text-muted-foreground text-sm mt-1.5">Would you mind sharing your experience on Google?</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex justify-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={24} className="text-warning fill-warning" />
            ))}
          </div>
          <p className="text-foreground text-sm italic">"Best pizza in town! The crust was perfect."</p>
          <p className="text-muted-foreground text-xs mt-2">— Your feedback</p>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => {
              window.open("https://g.page/review", "_blank");
              navigate("/");
            }}
            className="w-full bg-foreground text-background font-medium py-3 rounded-lg text-sm hover:bg-foreground/90 transition-colors"
          >
            Post as Google Review
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full text-muted-foreground text-sm hover:text-foreground transition-colors py-2"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleReviewPrompt;
