import * as SecureStore from "expo-secure-store";
import type {
  Me,
  AuthResponse,
  Activity,
  ActivitySubmission,
  Reward,
  Redemption,
  Challenge,
  Campaign,
  LeaderboardEntry,
  PointEntry,
  NotificationItem,
} from "@movo/shared";
const BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:4000/api";
const KEY = "movo.session";
export const session = {
  get: () => SecureStore.getItemAsync(KEY),
  set: (token: string) => SecureStore.setItemAsync(KEY, token),
  clear: () => SecureStore.deleteItemAsync(KEY),
};
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
    public code = "NETWORK",
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
  fixedToken?: string,
): Promise<T> {
  const token = fixedToken ?? (await session.get()),
    controller = new AbortController(),
    timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    if (response.status === 204) return undefined as T;
    const body = await response.json().catch(() => null);
    if (!response.ok)
      throw new ApiError(
        body?.error?.message ??
          (response.status === 429
            ? "Too many requests. Try again shortly."
            : "Request failed. Please try again."),
        response.status,
        body?.error?.code ?? "REQUEST_FAILED",
      );
    return body as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(
      "Unable to connect. Your recorded activity is safe on this device.",
    );
  } finally {
    clearTimeout(timeout);
  }
}
const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
});
export const apiClient = {
  login: (body: { email: string; password: string }) =>
    api<AuthResponse>("/auth/login", json("POST", body)),
  signup: (body: unknown) =>
    api<AuthResponse>("/auth/signup", json("POST", body)),
  forgot: (email: string) =>
    api<{ message: string }>("/auth/forgot-password", json("POST", { email })),
  reset: (token: string, password: string) =>
    api("/auth/reset-password", json("POST", { token, password })),
  logout: () => api("/auth/logout", json("POST")),
  me: () => api<Me>("/users/me"),
  onboarding: (body: unknown) =>
    api("/users/me/onboarding", json("PATCH", body)),
  settings: (body: unknown) => api("/users/me/settings", json("PATCH", body)),
  deleteAccount: (password: string) =>
    api("/users/me", json("DELETE", { password })),
  activities: (page = 1) => api<Activity[]>(`/activities?page=${page}`),
  activity: (id: string) => api<Activity>(`/activities/${id}`),
  submitActivity: (body: ActivitySubmission, token?: string) =>
    api<Activity>("/activities", json("POST", body), token),
  rewards: () => api<Reward[]>("/rewards"),
  reward: (id: string) => api<Reward>(`/rewards/${id}`),
  redeem: (body: {
    rewardId: string;
    idempotencyKey: string;
    recipient: string;
  }) => api<Redemption>("/rewards/redeem", json("POST", body)),
  redemptions: () => api<Redemption[]>("/redemptions"),
  redemption: (id: string) => api<Redemption>(`/redemptions/${id}`),
  challenges: () => api<Challenge[]>("/challenges"),
  challenge: (id: string) => api<Challenge>(`/challenges/${id}`),
  join: (id: string) => api(`/challenges/${id}/join`, json("POST")),
  donations: () => api<Campaign[]>("/donations"),
  donate: (body: unknown) => api("/donations", json("POST", body)),
  leaderboard: (period: string) =>
    api<LeaderboardEntry[]>(`/leaderboard?period=${period}`),
  points: (page = 1) => api<PointEntry[]>(`/points?page=${page}`),
  notifications: () => api<NotificationItem[]>("/notifications"),
  readNotification: (id: string) =>
    api(`/notifications/${id}/read`, json("PATCH")),
  device: (expoPushToken: string) =>
    api("/notifications/devices", json("POST", { expoPushToken })),
};
