import { useEffect, useState, useMemo } from "react";
import QRCode from "qrcode";
import { useRestaurant } from "@/context/RestaurantContext";
import { QrCode, Download, Eye } from "lucide-react";
import { buildScanMenuUrl, getPublicAppOrigin, isLocalAppOrigin } from "@/lib/publicAppOrigin";

const QREntryFlow = () => {
  const { selectedOutlet } = useRestaurant();
  const scanUrl = useMemo(
    () => buildScanMenuUrl(selectedOutlet.restaurantId),
    [selectedOutlet.restaurantId],
  );
  const usesLocalOrigin = useMemo(() => isLocalAppOrigin(getPublicAppOrigin()), [scanUrl]);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(scanUrl, { width: 220, margin: 2, errorCorrectionLevel: "M" })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [scanUrl]);

  const downloadPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qr-${selectedOutlet.restaurantId}.png`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">QR & Entry Flow</h1>
        <p className="text-muted-foreground text-sm">Digital menu QR for {selectedOutlet.name}</p>
        <p className="text-xs text-muted-foreground mt-2 rounded-lg border border-border bg-muted/40 px-3 py-2 break-all">
          Scan URL: <span className="text-foreground font-mono">{scanUrl}</span>
        </p>
        {usesLocalOrigin && (
          <p className="text-xs mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200 px-3 py-2">
            QR uses a local origin — set <code className="font-mono">VITE_PUBLIC_APP_ORIGIN</code> (e.g.
            https://your-domain.com) before printing codes for production.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-6 animate-fade-in">
          <h3 className="text-sm font-semibold text-foreground mb-4">Your QR Code</h3>
          <div className="flex flex-col items-center">
            <div className="w-56 h-56 bg-white rounded-xl flex items-center justify-center mb-4 p-2 border border-border">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Restaurant menu QR" className="max-w-full max-h-full" />
              ) : (
                <QrCode size={120} className="text-muted-foreground" />
              )}
            </div>
            <p className="text-muted-foreground text-sm mb-4 text-center">
              Place this QR at your restaurant entrance, tables, or receipts
            </p>
            <button
              type="button"
              onClick={downloadPng}
              disabled={!qrDataUrl}
              className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              <Download size={16} />
              Download PNG
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Menu Preview</h3>
            <a
              href={scanUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
            >
              <Eye size={14} />
              Open live menu
            </a>
          </div>

          <div className="max-w-[280px] mx-auto">
            <div className="bg-foreground rounded-[2rem] p-2 shadow-lg">
              <div className="bg-background rounded-[1.5rem] overflow-hidden">
                <div className="bg-foreground/5 px-4 py-2 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">9:41</span>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-2 border border-muted-foreground rounded-sm" />
                  </div>
                </div>

                <div className="p-5 text-center space-y-4">
                  <div>
                    <h4 className="font-bold text-foreground text-base">{selectedOutlet.name}</h4>
                    <p className="text-muted-foreground text-xs mt-1">Digital menu — browse dishes & prices</p>
                  </div>
                  <div className="bg-muted rounded-lg py-8 px-3 space-y-2">
                    <div className="h-2 bg-foreground/10 rounded w-2/3 mx-auto" />
                    <div className="h-2 bg-foreground/10 rounded w-1/2 mx-auto" />
                    <div className="h-2 bg-foreground/10 rounded w-3/5 mx-auto" />
                  </div>
                  <div className="bg-foreground text-background rounded-lg py-2.5 text-sm font-medium">View Menu</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 animate-fade-in" style={{ animationDelay: "0.15s" }}>
        <h3 className="text-sm font-semibold text-foreground mb-4">Customer Journey</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { step: "1", title: "Scan QR", desc: "Customer scans QR at table" },
            { step: "2", title: "Menu opens", desc: "Browse categories, prices, and photos" },
            { step: "3", title: "Optional check-in", desc: "Name & phone at /scan/… for visit tracking" },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold flex-shrink-0">
                {s.step}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QREntryFlow;
