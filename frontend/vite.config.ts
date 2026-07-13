import { createLogger, defineConfig } from "vite";
import type { Logger, ProxyOptions } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/** Override if Django listens elsewhere, e.g. `VITE_API_PROXY_TARGET=http://127.0.0.1:8000`. */
const API_PROXY_TARGET = process.env.VITE_API_PROXY_TARGET ?? "http://127.0.0.1:8000";

/** One concise line when Django is down instead of a stack per request. */
function loggerWithThrottledProxyErrors(base: Logger, apiTarget: string): Logger {
  let lastProxyDownLog = 0;
  const throttleMs = 12_000;

  return {
    info: (msg, o) => base.info(msg, o),
    warn: (msg, o) => base.warn(msg, o),
    warnOnce: (msg, o) => base.warnOnce(msg, o),
    clearScreen: (t) => base.clearScreen(t),
    hasErrorLogged: (e) => base.hasErrorLogged(e),
    get hasWarned() {
      return base.hasWarned;
    },
    error(msg, o) {
      const err = o?.error;
      const code = err && typeof err === "object" && "code" in err ? String((err as NodeJS.ErrnoException).code) : "";
      const isProxyConnFail =
        msg.includes("http proxy error") &&
        (code === "ECONNREFUSED" || code === "ECONNRESET" || /ECONNREFUSED|ECONNRESET/.test(msg));

      if (isProxyConnFail) {
        const now = Date.now();
        if (now - lastProxyDownLog < throttleMs) {
          return;
        }
        lastProxyDownLog = now;
        base.error(
          `API proxy: cannot reach ${apiTarget} (${code || "connection closed"}). ` +
            "Start Django on that host:port (from frontend/: `npm run dev:backend`, or `runserver` / docker compose in backend/).",
          o,
        );
        return;
      }
      base.error(msg, o);
    },
  };
}

function apiProxy(): ProxyOptions {
  return {
    target: API_PROXY_TARGET,
    changeOrigin: true,
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  clearScreen: false,
  customLogger: loggerWithThrottledProxyErrors(createLogger(), API_PROXY_TARGET),
  server: {
    // Bind IPv4 explicitly — reliable with http://localhost in Chrome on macOS.
    host: "127.0.0.1",
    port: 8080,
    strictPort: false,
    hmr: {
      overlay: false,
    },
    // One browser origin during dev: SPA on :8080, backend paths → Django on :8000.
    proxy: {
      "/api": apiProxy(),
      "/admin": apiProxy(),
      "/accounts": apiProxy(),
      "/static": apiProxy(),
      "/media": apiProxy(),
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
