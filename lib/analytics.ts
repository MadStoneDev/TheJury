// Lightweight event tracking on top of the GA4 tag already loaded in
// app/layout.tsx (@next/third-parties GoogleAnalytics). SSR-safe and never
// throws — analytics must not break a user flow.

export type JuryEvent =
  | "poll_created"
  | "poll_shared"
  | "vote_cast"
  | "upgrade_clicked"
  | "bot_installed";

type GtagWindow = Window & {
  gtag?: (command: string, event: string, params?: Record<string, unknown>) => void;
};

export function track(event: JuryEvent, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    (window as GtagWindow).gtag?.("event", event, params ?? {});
  } catch {
    // ignore — tracking is best-effort
  }
}
