import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Star, Copy, ExternalLink } from "lucide-react";
import { useCustomer } from "@/context/CustomerContext";
import { toast } from "@/hooks/use-toast";
import { fetchPublicMenu } from "@/lib/api";
import { resolveScanContext } from "@/lib/scanContext";
import { useScannerTheme } from "@/lib/useScannerTheme";

const GoogleReviewPrompt = () => {
  const navigate = useNavigate();
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { apiSlug, menuKey } = useMemo(() => resolveScanContext(restaurantId), [restaurantId]);
  const pathSegment = restaurantId || menuKey;
  const { theme } = useScannerTheme(apiSlug, menuKey);
  const { customer } = useCustomer();
  const [copied, setCopied] = useState(false);
  const [reviewUrl, setReviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const menu = await fetchPublicMenu(apiSlug);
        const link = (menu.restaurant.google_review_link || "").trim();
        if (!cancelled) setReviewUrl(link || null);
      } catch {
        if (!cancelled) setReviewUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiSlug]);

  const reviewText = "Amazing experience! The food was incredible and the ambiance was perfect. Highly recommend!";

  const openReview = () => {
    const target = reviewUrl || "https://g.page/review";
    window.open(target, "_blank", "noopener,noreferrer");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reviewText).catch(() => {});
    setCopied(true);
    toast({ title: "Review copied to clipboard!" });
    setTimeout(() => {
      openReview();
    }, 500);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: theme.background }}
    >
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
          <p className="text-foreground text-sm italic">"{reviewText}"</p>
          <p className="text-muted-foreground text-xs mt-2">— {customer?.name || "Your"} feedback</p>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 bg-foreground text-background font-medium py-3 rounded-lg text-sm hover:bg-foreground/90 transition-colors"
          >
            {copied ? (
              <>
                <ExternalLink size={16} />
                Opening Google Reviews...
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy Review & Open Google
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/scan/${pathSegment}/checked-in`)}
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
