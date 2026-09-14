export type AnalyticsEvent =
  | "app_opened"
  | "signup_completed"
  | "onboarding_completed"
  | "activity_started"
  | "activity_paused"
  | "activity_completed"
  | "activity_verified"
  | "activity_rejected"
  | "points_earned"
  | "reward_viewed"
  | "reward_redeemed"
  | "donation_selected"
  | "challenge_joined";
export interface AnalyticsProvider {
  track: (
    event: AnalyticsEvent,
    properties?: Record<string, string | number | boolean>,
  ) => void;
  reset: () => void;
}
let provider: AnalyticsProvider = { track: () => {}, reset: () => {} };
export const analytics = {
  use: (next: AnalyticsProvider) => {
    provider = next;
  },
  track: (
    event: AnalyticsEvent,
    properties?: Record<string, string | number | boolean>,
  ) => provider.track(event, properties),
  reset: () => provider.reset(),
};
