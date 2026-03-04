import { useNavigate } from "react-router-dom";
import { ArrowRight, Smartphone, BarChart3 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-lg w-full text-center space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            WhatsApp CRM
          </h1>
          <p className="text-muted-foreground mt-2">Restaurant Growth Platform</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate("/welcome")}
            className="w-full flex items-center justify-between px-6 py-4 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Smartphone size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground text-sm">Customer Experience</p>
                <p className="text-muted-foreground text-xs">QR scan flow preview</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full flex items-center justify-between px-6 py-4 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-foreground/5 flex items-center justify-center">
                <BarChart3 size={20} className="text-foreground" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground text-sm">Owner Dashboard</p>
                <p className="text-muted-foreground text-xs">Admin SaaS panel</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        </div>

        <p className="text-muted-foreground text-xs">Prototype · Frontend only · Mock data</p>
      </div>
    </div>
  );
};

export default Index;
