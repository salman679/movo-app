import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as Crypto from "expo-crypto";
import { Pedometer } from "expo-sensors";
import type { Coordinate, ActivitySubmission } from "@movo/shared";
import { trackingConfig } from "@movo/config";
import {
  trackingDB,
  getActive,
  updateActive,
  type TrackingState,
} from "./storage";
import { gpsDistance } from "./math";
const TASK = "movo.active.location.v1";
let foreground: Location.LocationSubscription | undefined,
  stepsSubscription: ReturnType<typeof Pedometer.watchStepCount> | undefined;
async function ingest(locations: Location.LocationObject[]) {
  const db = await trackingDB();
  await db.withExclusiveTransactionAsync(async (tx) => {
    const row = await tx.getFirstAsync<{ data: string }>(
      "SELECT data FROM active WHERE id=1",
    );
    if (!row) return;
    let s = JSON.parse(row.data) as TrackingState;
    if (s.paused) return;
    for (const l of [...locations].sort((a, b) => a.timestamp - b.timestamp)) {
      if (
        l.timestamp < Date.parse(s.startedAt) ||
        (s.last && l.timestamp <= s.last.timestamp)
      )
        continue;
      if (
        s.count >= trackingConfig.maxStoredPoints ||
        l.timestamp - Date.parse(s.startedAt) > trackingConfig.maxDurationMs
      ) {
        s.gpsError = "Recording limit reached. Finish this activity.";
        continue;
      }
      const p: Coordinate = {
        latitude: l.coords.latitude,
        longitude: l.coords.longitude,
        timestamp: Math.floor(l.timestamp),
        accuracy: l.coords.accuracy ?? 999,
        speed: l.coords.speed,
        mocked: l.mocked ?? false,
      };
      let distance = 0;
      if (
        s.last &&
        p.accuracy <= 60 &&
        s.last.accuracy <= 60 &&
        p.timestamp - s.last.timestamp <= 120000
      ) {
        const d = gpsDistance(s.last, p);
        if (d >= Math.max(2, Math.min(p.accuracy, s.last.accuracy) * 0.25))
          distance = d;
      }
      await tx.runAsync(
        "INSERT OR IGNORE INTO samples(sessionId,timestamp,data) VALUES (?,?,?)",
        s.clientActivityId,
        p.timestamp,
        JSON.stringify(p),
      );
      s = {
        ...s,
        count: s.count + 1,
        last: p,
        distanceMeters: s.distanceMeters + distance,
        gpsError:
          p.accuracy > 60 ? "Poor GPS accuracy. Move to an open area." : null,
      };
    }
    await tx.runAsync("UPDATE active SET data=? WHERE id=1", JSON.stringify(s));
  });
}
if (!TaskManager.isTaskDefined(TASK))
  TaskManager.defineTask<{ locations: Location.LocationObject[] }>(
    TASK,
    async ({ data, error }) => {
      if (error) {
        await updateActive((s) => ({
          ...s,
          gpsError: "GPS interrupted. Open Movo to recover.",
        }));
        return;
      }
      if (data?.locations) await ingest(data.locations);
    },
  );
async function stopNative() {
  foreground?.remove();
  foreground = undefined;
  stepsSubscription?.remove();
  stepsSubscription = undefined;
  if (await Location.hasStartedLocationUpdatesAsync(TASK))
    await Location.stopLocationUpdatesAsync(TASK);
}
async function startNative(s: TrackingState) {
  const options: Location.LocationTaskOptions = {
    accuracy: Location.Accuracy.High,
    timeInterval: trackingConfig.timeIntervalMs,
    distanceInterval: trackingConfig.distanceIntervalMeters,
    deferredUpdatesInterval: 10000,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    activityType:
      s.type === "RUNNING"
        ? Location.ActivityType.Fitness
        : Location.ActivityType.OtherNavigation,
    foregroundService: {
      notificationTitle: "Movo activity in progress",
      notificationBody:
        "Your active walk or run is being recorded. Open Movo to pause or finish.",
      killServiceOnDestroy: false,
    },
  };
  if (s.mode === "background") {
    try {
      await Location.startLocationUpdatesAsync(TASK, options);
    } catch {
      await updateActive((v) => ({
        ...v,
        mode: "foreground",
        gpsError: "Background tracking unavailable. Keep Movo open.",
      }));
      foreground = await Location.watchPositionAsync(options, (l) => {
        void ingest([l]);
      });
    }
  } else
    foreground = await Location.watchPositionAsync(options, (l) => {
      void ingest([l]);
    });
  if (s.countSteps && (await Pedometer.isAvailableAsync())) {
    const base = s.steps ?? 0;
    stepsSubscription = Pedometer.watchStepCount((v) => {
      void updateActive((a) =>
        a.paused ? a : { ...a, steps: base + v.steps },
      );
    });
  }
}
export class ActivityTrackingService {
  async start(
    type: "WALKING" | "RUNNING",
    userId: string,
    options: { background: boolean; steps: boolean },
  ) {
    if (await getActive())
      throw new Error(
        "An activity is already in progress. Recover or finish it first.",
      );
    if (!(await Location.hasServicesEnabledAsync()))
      throw new Error(
        "GPS is disabled. Turn on location services and try again.",
      );
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted")
      throw new Error(
        permission.canAskAgain
          ? "Location permission is required to record distance."
          : "Location permission is blocked. Enable it in your device settings.",
      );
    let mode: TrackingState["mode"] = "foreground";
    if (options.background) {
      const bg = await Location.requestBackgroundPermissionsAsync();
      if (bg.status === "granted") mode = "background";
    }
    let countSteps = false;
    if (options.steps && (await Pedometer.isAvailableAsync())) {
      countSteps = (await Pedometer.requestPermissionsAsync()).granted;
    }
    const s: TrackingState = {
      clientActivityId: Crypto.randomUUID(),
      userId,
      type,
      startedAt: new Date().toISOString(),
      paused: false,
      pauseStartedAt: null,
      pauses: [],
      steps: countSteps ? 0 : null,
      countSteps,
      mode,
      distanceMeters: 0,
      count: 0,
      last: null,
      gpsError:
        mode === "foreground" ? "Keep Movo open to continue recording." : null,
    };
    await (
      await trackingDB()
    ).runAsync("INSERT INTO active(id,data) VALUES(1,?)", JSON.stringify(s));
    try {
      await startNative(s);
    } catch (e) {
      await updateActive((v) => ({
        ...v,
        paused: true,
        pauseStartedAt: Date.now(),
        gpsError: "Could not start GPS. Check location settings and resume.",
      }));
      throw e;
    }
    return s;
  }
  async pause() {
    const now = Date.now();
    await updateActive((s) =>
      s.paused ? s : { ...s, paused: true, pauseStartedAt: now },
    );
    await stopNative();
    return getActive();
  }
  async resume() {
    const s = await getActive();
    if (!s) return null;
    if (!s.paused) return s;
    if (!(await Location.hasServicesEnabledAsync()))
      throw new Error("Enable GPS to resume.");
    const now = Date.now();
    await updateActive((a) => ({
      ...a,
      paused: false,
      pauseStartedAt: null,
      pauses: [
        ...a.pauses,
        { startedAt: a.pauseStartedAt ?? now, endedAt: now },
      ],
      last: null,
    }));
    const active = await getActive();
    if (active)
      try {
        await startNative(active);
      } catch (e) {
        await this.pause();
        throw e;
      }
    return active;
  }
  async stop() {
    const current = await getActive();
    if (current && current.count < 2)
      throw new Error(
        "Not enough GPS samples yet. Keep recording or discard the activity.",
      );
    await stopNative();
    const db = await trackingDB();
    let id: string | null = null;
    await db.withExclusiveTransactionAsync(async (tx) => {
      const row = await tx.getFirstAsync<{ data: string }>(
        "SELECT data FROM active WHERE id=1",
      );
      if (!row) return;
      const s = JSON.parse(row.data) as TrackingState;
      const end = Date.now();
      const rows = await tx.getAllAsync<{ data: string }>(
        "SELECT data FROM samples WHERE sessionId=? ORDER BY timestamp",
        s.clientActivityId,
      );
      if (rows.length < 2)
        throw new Error(
          "Not enough GPS data yet. Resume recording or discard this activity.",
        );
      const body: ActivitySubmission = {
        clientActivityId: s.clientActivityId,
        type: s.type,
        startedAt: s.startedAt,
        endedAt: new Date(end).toISOString(),
        coordinates: rows.map((r) => JSON.parse(r.data) as Coordinate),
        pauses: [
          ...s.pauses,
          ...(s.pauseStartedAt
            ? [{ startedAt: s.pauseStartedAt, endedAt: end }]
            : []),
        ],
        steps: s.steps ?? undefined,
        stepSource: s.countSteps ? "PEDOMETER" : "UNAVAILABLE",
      };
      id = s.clientActivityId;
      await tx.runAsync(
        "INSERT INTO queue(id,userId,body,state,createdAt) VALUES(?,?,?,?,?)",
        id,
        s.userId,
        JSON.stringify(body),
        "OFFLINE",
        end,
      );
      await tx.runAsync("DELETE FROM active WHERE id=1");
      await tx.runAsync("DELETE FROM samples WHERE sessionId=?", id);
    });
    return id;
  }
  async discard() {
    await stopNative();
    const db = await trackingDB();
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync("DELETE FROM samples");
      await tx.runAsync("DELETE FROM active");
    });
  }
  async getCurrentActivity(userId?: string) {
    const active = await getActive();
    return active && (!userId || active.userId === userId) ? active : null;
  }
  async recoverActivity(userId: string) {
    const s = await getActive();
    if (!s) return null;
    if (s.userId !== userId)
      throw new Error(
        "An activity belongs to another account. Sign in to that account to recover it.",
      );
    if (
      !s.paused &&
      !(
        s.mode === "background" &&
        (await Location.hasStartedLocationUpdatesAsync(TASK))
      ) &&
      !foreground
    ) {
      const last = s.last?.timestamp ?? Date.parse(s.startedAt);
      await updateActive((v) => ({
        ...v,
        paused: true,
        pauseStartedAt: last,
        gpsError: "Recording was interrupted. Resume when you are ready.",
      }));
    }
    return getActive();
  }
}
export const activityTrackingService = new ActivityTrackingService();
