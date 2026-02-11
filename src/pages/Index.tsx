import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background checker-bg flex flex-col items-center justify-center p-4 gap-6">
      <div className="text-center animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-2">Dough & Joe 🍕</h1>
        <p className="text-muted-foreground text-lg">WhatsApp Growth CRM</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <button
          onClick={() => navigate("/welcome")}
          className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-full text-lg hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          Customer Experience 📱
        </button>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-8 py-4 bg-secondary text-secondary-foreground font-bold rounded-full text-lg hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          Owner Dashboard 🧑‍💻
        </button>
      </div>
    </div>
  );
};

export default Index;
