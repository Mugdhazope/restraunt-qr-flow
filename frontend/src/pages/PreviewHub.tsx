import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Smartphone, BarChart3 } from "lucide-react";
import { DEFAULT_RESTAURANT_SLUG } from "@/lib/defaultRestaurantSlug";
import { PREVIEW_DASHBOARD_BASE, PREVIEW_SCAN_BASE, liveAppLoginUrl } from "@/lib/previewMode";
import PreviewBanner from "@/components/PreviewBanner";

const PreviewHub = () => {
  const navigate = useNavigate();
  const loginHref = liveAppLoginUrl();
  const isExternal = /^https?:\/\//i.test(loginHref);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PreviewBanner />
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-lg w-full text-center space-y-8 animate-fade-in">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Digital Menu
            </h1>
            <p className="text-muted-foreground mt-2">Interactive product preview</p>
            <p className="text-muted-foreground text-sm mt-1">
              Sample data only · No login required · No real customer or company data
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate(PREVIEW_DASHBOARD_BASE)}
              className="w-full flex items-center justify-between px-6 py-4 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-foreground/5 flex items-center justify-center">
                  <BarChart3 size={20} className="text-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground text-sm">Owner Dashboard</p>
                  <p className="text-muted-foreground text-xs">Menu, customers, analytics & more</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => navigate(`${PREVIEW_SCAN_BASE}/${DEFAULT_RESTAURANT_SLUG}/menu`)}
              className="w-full flex items-center justify-between px-6 py-4 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Smartphone size={20} className="text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground text-sm">Customer Experience</p>
                  <p className="text-muted-foreground text-xs">QR scan flow & digital menu</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          </div>

          <p className="text-muted-foreground text-xs">
            Already have an account?{" "}
            {isExternal ? (
              <a href={loginHref} className="text-primary hover:underline">
                Sign in
              </a>
            ) : (
              <Link to={loginHref} className="text-primary hover:underline">
                Sign in
              </Link>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PreviewHub;
