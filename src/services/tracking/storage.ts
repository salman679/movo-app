import * as SQLite from "expo-sqlite";
import type { ActivitySubmission, Coordinate } from "@movo/shared";
export type TrackingState = {
  clientActivityId: string;
  userId: string;
  type: "WALKING" | "RUNNING";
  startedAt: string;
  paused: boolean;
  pauseStartedAt: number | null;
  pauses: { startedAt: number; endedAt: number }[];
  steps: number | null;
  countSteps: boolean;
  mode: "background" | "foreground";
  distanceMeters: number;
  count: number;
  last: Coordinate | null;
  gpsError: string | null;
};
export type QueueItem = {
  id: string;
  userId: string;
  body: string;
  state: "OFFLINE" | "SYNCING" | "FAILED" | "SYNCED";
  error: string | null;
  result: string | null;
  createdAt: number;
};
let dbPromise: Promise<SQLite.SQLiteDatabase> | undefined;
export function trackingDB() {
  return (dbPromise ??= (async () => {
    const db = await SQLite.openDatabaseAsync("movo-activity.db");
    await db.execAsync(
      "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS active (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS samples (sessionId TEXT NOT NULL, timestamp INTEGER NOT NULL, data TEXT NOT NULL, PRIMARY KEY(sessionId,timestamp)); CREATE TABLE IF NOT EXISTS queue (id TEXT PRIMARY KEY,userId TEXT NOT NULL,body TEXT NOT NULL,state TEXT NOT NULL,error TEXT,result TEXT,createdAt INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS queue_owner ON queue(userId,createdAt);",
    );
    return db;
  })());
}
export async function getActive() {
  const db = await trackingDB(),
    r = await db.getFirstAsync<{ data: string }>(
      "SELECT data FROM active WHERE id=1",
    );
  return r ? (JSON.parse(r.data) as TrackingState) : null;
}
export async function updateActive(fn: (s: TrackingState) => TrackingState) {
  const db = await trackingDB();
  await db.withExclusiveTransactionAsync(async (tx) => {
    const row = await tx.getFirstAsync<{ data: string }>(
      "SELECT data FROM active WHERE id=1",
    );
    if (row)
      await tx.runAsync(
        "UPDATE active SET data=? WHERE id=1",
        JSON.stringify(fn(JSON.parse(row.data) as TrackingState)),
      );
  });
}
export async function queued(userId: string) {
  return (await trackingDB()).getAllAsync<QueueItem>(
    "SELECT * FROM queue WHERE userId=? ORDER BY createdAt DESC",
    userId,
  );
}
export async function queuedById(id: string, userId: string) {
  return (await trackingDB()).getFirstAsync<QueueItem>(
    "SELECT * FROM queue WHERE id=? AND userId=?",
    id,
    userId,
  );
}
export async function eraseLocalUser(userId: string) {
  const db = await trackingDB();
  await db.runAsync("DELETE FROM queue WHERE userId=?", userId);
}
export type PendingSubmission = ActivitySubmission;
