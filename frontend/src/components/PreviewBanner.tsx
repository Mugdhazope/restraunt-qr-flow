import { Info } from "lucide-react";
import { isPreviewMode, liveAppLoginUrl } from "@/lib/previewMode";

export default function PreviewBanner() {
  if (!isPreviewMode()) return null;
  const loginHref = liveAppLoginUrl();

  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center justify-center gap-2 text-xs text-amber-950 dark:text-amber-100 shrink-0 relative z-[60]">
      <Info size={14} className="shrink-0" />
      <span>
        <strong>Preview mode</strong> — You&apos;re exploring with sample data. Changes won&apos;t be saved.
        {loginHref ? (
          <>
            {" "}
            <a
              href={loginHref}
              className="underline underline-offset-2 font-medium hover:text-amber-900 dark:hover:text-white"
            >
              Sign in for your account
            </a>
          </>
        ) : null}
      </span>
    </div>
  );
}
