import { useState } from "react";
import { useNavigate } from "react-router-dom";

const options = [
  { label: "Loved it", value: "loved", emoji: "😍" },
  { label: "It was okay", value: "okay", emoji: "🙂" },
  { label: "Could be better", value: "better", emoji: "😕" },
];

const CustomerFeedback = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      if (selected === "loved") {
        navigate("/google-review-prompt");
      } else {
        navigate("/");
      }
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="text-4xl">🙏</div>
          <h1 className="text-xl font-bold text-foreground">Thank you!</h1>
          <p className="text-muted-foreground text-sm">Your feedback helps us improve</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 animate-fade-in">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">How was your experience?</h1>
          <p className="text-muted-foreground text-sm mt-1.5">At Dough & Joe today</p>
        </div>

        <div className="space-y-2">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelected(opt.value)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-left transition-all border ${
                selected === opt.value
                  ? "border-foreground bg-foreground/5"
                  : "border-border bg-card hover:border-foreground/20"
              }`}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <span className="font-medium text-foreground text-sm">{opt.label}</span>
            </button>
          ))}
        </div>

        {selected && (
          <div className="animate-fade-in space-y-4">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more (optional)..."
              className="w-full bg-card border border-border rounded-xl p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none h-24"
            />
            <button
              onClick={handleSubmit}
              className="w-full bg-foreground text-background font-medium py-3 rounded-lg text-sm hover:bg-foreground/90 transition-colors"
            >
              Submit Feedback
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerFeedback;
