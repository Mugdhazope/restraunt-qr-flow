import { QrCode, Download, Eye, Smartphone } from "lucide-react";

const QREntryFlow = () => {
  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">QR & Entry Flow</h1>
        <p className="text-muted-foreground text-sm">Manage your customer onboarding QR code</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* QR Code */}
        <div className="bg-card border border-border rounded-xl p-6 animate-fade-in">
          <h3 className="text-sm font-semibold text-foreground mb-4">Your QR Code</h3>
          <div className="flex flex-col items-center">
            <div className="w-48 h-48 bg-foreground rounded-xl flex items-center justify-center mb-4">
              <QrCode size={120} className="text-background" />
            </div>
            <p className="text-muted-foreground text-sm mb-4 text-center">
              Place this QR at your restaurant entrance, tables, or receipts
            </p>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors">
                <Download size={16} />
                Download PNG
              </button>
              <button className="flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">
                <Download size={16} />
                Download SVG
              </button>
            </div>
          </div>
        </div>

        {/* Customer Preview */}
        <div className="bg-card border border-border rounded-xl p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Customer Scan Preview</h3>
            <a href="/welcome" target="_blank" className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
              <Eye size={14} />
              Open Preview
            </a>
          </div>

          {/* Phone mockup */}
          <div className="max-w-[280px] mx-auto">
            <div className="bg-foreground rounded-[2rem] p-2 shadow-lg">
              <div className="bg-background rounded-[1.5rem] overflow-hidden">
                {/* Status bar */}
                <div className="bg-foreground/5 px-4 py-2 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">9:41</span>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-2 border border-muted-foreground rounded-sm" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 text-center space-y-4">
                  <div>
                    <h4 className="font-bold text-foreground text-base">Welcome to Dough & Joe</h4>
                    <p className="text-muted-foreground text-xs mt-1">Scan, check in, and enjoy your visit.</p>
                  </div>

                  <div className="space-y-2">
                    <div className="bg-muted rounded-lg h-10 flex items-center px-3">
                      <span className="text-muted-foreground text-xs">Your name</span>
                    </div>
                    <div className="bg-muted rounded-lg h-10 flex items-center px-3">
                      <span className="text-muted-foreground text-xs">Phone number</span>
                    </div>
                  </div>

                  <div className="bg-foreground text-background rounded-lg py-2.5 text-sm font-medium">
                    Continue
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flow steps */}
      <div className="bg-card border border-border rounded-xl p-5 animate-fade-in" style={{ animationDelay: "0.15s" }}>
        <h3 className="text-sm font-semibold text-foreground mb-4">Customer Journey</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { step: "1", title: "Scan QR", desc: "Customer scans QR code at table", icon: QrCode },
            { step: "2", title: "Enter Details", desc: "Name and phone number", icon: Smartphone },
            { step: "3", title: "Verify OTP", desc: "WhatsApp OTP verification", icon: Smartphone },
            { step: "4", title: "Get Reward", desc: "Instant reward unlocked", icon: Download },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.step} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {s.step}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QREntryFlow;
