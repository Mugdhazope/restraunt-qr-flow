/** Short vibration on supported mobile browsers (mostly Android Chrome). iOS Safari has no Web Vibration API. */
export function lightTap(): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }
  try {
    navigator.vibrate(12);
  } catch {
    /* ignore */
  }
}
