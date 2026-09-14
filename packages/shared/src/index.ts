import { z } from "zod";
export const ActivityType = z.enum(["WALKING", "RUNNING"]);
export const ActivityStatus = z.enum([
  "PENDING",
  "VERIFIED",
  "SUSPICIOUS",
  "REJECTED",
]);
export const SyncState = z.enum(["OFFLINE", "SYNCING", "SYNCED", "FAILED"]);
export const POINTS_PER_KM_DEFAULT = 10;
export const coordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timestamp: z.number().int().positive(),
  accuracy: z.number().min(0).max(100000),
  speed: z.number().nullable().optional(),
  mocked: z.boolean().optional(),
});
export const pauseSchema = z.object({
  startedAt: z.number().int().positive(),
  endedAt: z.number().int().positive(),
});
export const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().toLowerCase(),
  password: z.string().min(10).max(72),
  phone: z.string().trim().max(30).optional(),
});
export const loginSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(1).max(200),
});
export const onboardingSchema = z.object({
  name: z.string().trim().min(2).max(80),
  dailyStepGoal: z.number().int().min(1000).max(100000),
  preferredActivity: z.enum(["WALKING", "RUNNING", "BOTH"]),
});
export const activitySubmissionSchema = z.object({
  clientActivityId: z.uuid(),
  type: ActivityType,
  startedAt: z.iso.datetime(),
  endedAt: z.iso.datetime(),
  steps: z.number().int().min(0).max(200000).optional(),
  stepSource: z.enum(["PEDOMETER", "UNAVAILABLE"]).default("UNAVAILABLE"),
  coordinates: z.array(coordinateSchema).min(2).max(12000),
  pauses: z.array(pauseSchema).max(100).default([]),
});
export const rewardRedeemSchema = z.object({
  rewardId: z.uuid(),
  idempotencyKey: z.uuid(),
  recipient: z.string().trim().min(3).max(160),
});
export const donationSchema = z.object({
  campaignId: z.uuid(),
  points: z.number().int().positive().max(1000000),
  idempotencyKey: z.uuid(),
});
export const rewardInput = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(2000),
  type: z.enum(["MOBILE_RECHARGE", "GIFT_CARD", "COUPON", "DONATION"]),
  pointsRequired: z.number().int().positive().max(1000000),
  cashValue: z.number().nonnegative().nullable().optional(),
  image: z.url().nullable().optional(),
  stock: z.number().int().nonnegative().max(1000000),
  active: z.boolean(),
});
export const challengeInput = z
  .object({
    title: z.string().trim().min(2).max(120),
    description: z.string().min(2).max(2000),
    type: z.enum(["STEPS", "DISTANCE", "ACTIVITIES"]),
    target: z.number().positive().max(10000000),
    rewardPoints: z.number().int().min(0).max(100000),
    startDate: z.iso.datetime(),
    endDate: z.iso.datetime(),
    active: z.boolean(),
  })
  .refine((v) => v.endDate > v.startDate, {
    message: "End date must follow start date",
    path: ["endDate"],
  });
export const campaignInput = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().min(2).max(2000),
  targetAmount: z.number().int().positive().max(100000000),
  image: z.url().nullable().optional(),
  active: z.boolean(),
});
export type ActivitySubmission = z.infer<typeof activitySubmissionSchema>;
export type Coordinate = z.infer<typeof coordinateSchema>;
export type ActivityStatusType = z.infer<typeof ActivityStatus>;
export type ApiError = {
  error: { code: string; message: string; details?: unknown };
};
export type Profile = {
  name: string;
  avatarUrl: string | null;
  dailyStepGoal: number;
  preferredActivity: "WALKING" | "RUNNING" | "BOTH";
  onboardingComplete: boolean;
  notificationsEnabled: boolean;
  availablePoints: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
};
export type Me = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  profile: Profile;
  streak: { currentDays: number; longestDays: number };
  stats: { steps: number; distanceMeters: number; activities: number };
  today: { steps: number; distanceMeters: number; points: number };
  earningRules: {
    pointsPerKm: number;
    qualifyingDistanceMeters: number;
    timezone: string;
  };
};
export type AuthResponse = { token: string; user: Me };
export type Activity = {
  id: string;
  clientActivityId: string;
  type: "WALKING" | "RUNNING";
  status: ActivityStatusType;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  distanceMeters: number;
  steps: number | null;
  averageSpeed: number;
  pointsAwarded: number;
  verificationFlags: string[];
  coordinates?: Coordinate[];
  createdAt: string;
};
export type Reward = Omit<z.infer<typeof rewardInput>, "cashValue"> & {
  id: string;
  cashValue: string | number | null;
  createdAt: string;
};
export type Redemption = {
  id: string;
  rewardId: string;
  status: "PENDING" | "APPROVED" | "DELIVERED" | "REJECTED";
  pointsSpent: number;
  recipient: string;
  fulfillmentNote: string | null;
  reward: Reward;
  createdAt: string;
};
export type Challenge = {
  id: string;
  title: string;
  description: string;
  type: "STEPS" | "DISTANCE" | "ACTIVITIES";
  target: number;
  rewardPoints: number;
  startDate: string;
  endDate: string;
  active: boolean;
  progress: {
    progress: number;
    completed: boolean;
    rewardedAt: string | null;
  } | null;
};
export type Campaign = z.infer<typeof campaignInput> & {
  id: string;
  currentAmount: number;
};
export type LeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  steps: number;
  points: number;
};
export type PointEntry = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
};
export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};
