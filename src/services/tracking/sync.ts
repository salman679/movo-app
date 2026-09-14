import * as Network from "expo-network";
import type { ActivitySubmission } from "@movo/shared";
import { apiClient, ApiError, session } from "../api/client";
import { queued, trackingDB } from "./storage";
import { analytics } from "../analytics";
let syncing = false;
export async function syncPending(userId: string) {
  if (syncing) return;
  const token = await session.get();
  if (!token) return;
  const network = await Network.getNetworkStateAsync();
  if (!network.isConnected) return;
  syncing = true;
  try {
    const db = await trackingDB();
    for (const q of (await queued(userId)).reverse()) {
      if (q.state === "SYNCED") continue;
      if ((await session.get()) !== token) break;
      await db.runAsync(
        "UPDATE queue SET state=?,error=NULL WHERE id=?",
        "SYNCING",
        q.id,
      );
      try {
        const result = await apiClient.submitActivity(
          JSON.parse(q.body) as ActivitySubmission,
          token,
        );
        await db.runAsync(
          "UPDATE queue SET state=?,result=?,body=?,error=NULL WHERE id=?",
          "SYNCED",
          JSON.stringify({ ...result, coordinates: undefined }),
          "{}",
          q.id,
        );
        if (result.status === "VERIFIED" || result.status === "REJECTED")
          analytics.track(
            result.status === "VERIFIED" ? "activity_verified" : "activity_rejected",
            { status: result.status },
          );
        if (result.pointsAwarded > 0)
          analytics.track("points_earned", { points: result.pointsAwarded });
      } catch (e) {
        const error = e instanceof Error ? e.message : "Sync failed";
        await db.runAsync(
          "UPDATE queue SET state=?,error=? WHERE id=?",
          e instanceof ApiError && e.status === 0 ? "OFFLINE" : "FAILED",
          error,
          q.id,
        );
        if (e instanceof ApiError && (e.status === 401 || e.status === 0))
          break;
      }
    }
  } finally {
    syncing = false;
  }
}
