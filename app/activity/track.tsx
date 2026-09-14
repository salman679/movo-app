import { useEffect, useState } from "react";
import { Alert, Linking, Switch, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/store/auth";
import { activityTrackingService as service } from "@/services/tracking/ActivityTrackingService";
import type { TrackingState } from "@/services/tracking/storage";
import {
  durationSeconds,
  formatTime,
  formatPace,
} from "@/services/tracking/math";
import { analytics } from "@/services/analytics";
import { Screen, Button, Metric, State, s } from "@/components/ui";
import { colors } from "@/theme";
export default function Track() {
  const { type } = useLocalSearchParams<{ type: string }>(),
    { user } = useAuth(),
    [active, setActive] = useState<TrackingState | null>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [background, setBackground] = useState(true),
    [steps, setSteps] = useState(false),
    [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!user) return;
    void service
      .recoverActivity(user.id)
      .then(setActive)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    const timer = setInterval(() => {
      setNow(Date.now());
      void service.getCurrentActivity(user.id).then(setActive).catch((e) => setError(e.message));
    }, 1000);
    return () => clearInterval(timer);
  }, [user?.id]);
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      setActive(await service.getCurrentActivity(user!.id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (loading)
    return (
      <Screen>
        <State loading />
      </Screen>
    );
  if (!active)
    return (
      <Screen>
        <Text style={s.title}>
          {type === "RUNNING" ? "Ready for a run?" : "Let’s take a walk."}
        </Text>
        <View style={s.card}>
          <Text style={s.h2}>A quick note about location</Text>
          <Text style={s.muted}>
            Movo uses your location while you walk or run to measure distance
            and verify your activity.
          </Text>
          <View style={s.row}>
            <Text style={[s.label, { flex: 1 }]}>
              Keep recording with screen locked
            </Text>
            <Switch value={background} onValueChange={setBackground} />
          </View>
          <Text style={s.muted}>
            {background
              ? "This requires background location permission. Recording stops when you pause or finish. Android shows an ongoing activity notification."
              : "Keep Movo open and the screen on during this activity."}
          </Text>
          <View style={s.row}>
            <Text style={[s.label, { flex: 1 }]}>
              Also measure steps, if available
            </Text>
            <Switch value={steps} onValueChange={setSteps} />
          </View>
          <Text style={s.muted}>
            This uses your device’s motion sensor. Step updates may pause in the
            background.
          </Text>
        </View>
        {!!error && (
          <>
            <Text style={s.error}>{error}</Text>
            <Button
              secondary
              title="Open device settings"
              onPress={() => void Linking.openSettings()}
            />
          </>
        )}
        <Button
          title={type === "RUNNING" ? "START RUN" : "START WALK"}
          loading={busy}
          onPress={() =>
            void run(async () => {
              await service.start(
                type === "RUNNING" ? "RUNNING" : "WALKING",
                user!.id,
                { background, steps },
              );
              analytics.track("activity_started", { type: type ?? "WALKING" });
            })
          }
        />
      </Screen>
    );
  const seconds = durationSeconds(active, now),
    speed = active.last?.speed ?? 0;
  return (
    <Screen>
      <Text style={s.muted}>
        {active.type === "WALKING" ? "WALKING" : "RUNNING"} ·{" "}
        {active.paused
          ? "PAUSED"
          : active.mode === "background"
            ? "SCREEN-LOCK TRACKING"
            : "KEEP MOVO OPEN"}
      </Text>
      <View style={[s.hero, { alignItems: "center" }]}>
        <Text style={{ color: "#D7E8DD" }}>DISTANCE</Text>
        <Text
          style={{
            fontSize: 70,
            fontWeight: "800",
            color: "white",
            letterSpacing: -3,
          }}
        >
          {(active.distanceMeters / 1000).toFixed(2)}
        </Text>
        <Text style={{ color: colors.lime, fontSize: 18 }}>kilometers</Text>
        <Text
          style={{
            fontSize: 35,
            fontWeight: "600",
            color: "white",
            fontVariant: ["tabular-nums"],
          }}
        >
          {formatTime(seconds)}
        </Text>
      </View>
      <View style={s.card}>
        <View style={s.row}>
          <Metric
            label="STEPS MEASURED"
            value={active.steps === null ? "Unavailable" : String(active.steps)}
          />
          <Metric
            label="AVERAGE PACE"
            value={formatPace(seconds, active.distanceMeters)}
          />
        </View>
        <View style={s.row}>
          <Metric
            label="CURRENT PACE"
            value={speed > 0.2 ? formatPace(1, speed) : "—"}
          />
          <Metric
            label="ENERGY ESTIMATE"
            value={`~${Math.round((active.distanceMeters / 1000) * (active.type === "RUNNING" ? 70 : 45))} kcal`}
          />
        </View>
        <Text style={s.muted}>
          {active.gpsError ??
            (active.last
              ? `GPS accuracy ±${Math.round(active.last.accuracy)} m`
              : "Acquiring GPS signal…")}
        </Text>
        <Text style={[s.muted, { fontSize: 11 }]}>
          Calories are a general estimate and are not used for rewards.
        </Text>
      </View>
      {!!error && <Text style={s.error}>{error}</Text>}
      <Button
        title={active.paused ? "RESUME" : "PAUSE"}
        loading={busy}
        onPress={() =>
          void run(async () => {
            if (active.paused) await service.resume();
            else {
              await service.pause();
              analytics.track("activity_paused");
            }
          })
        }
      />
      <Button
        secondary
        title="FINISH ACTIVITY"
        disabled={busy}
        onPress={() =>
          Alert.alert(
            "Finish this activity?",
            "Your recording will be saved and submitted for verification.",
            [
              { text: "Keep going", style: "cancel" },
              {
                text: "Finish",
                onPress: () =>
                  void run(async () => {
                    const id = await service.stop();
                    analytics.track("activity_completed");
                    router.replace(`/activity/summary?id=${id}`);
                  }),
              },
            ],
          )
        }
      />
      <Text
        style={[s.error, { textAlign: "center" }]}
        onPress={() =>
          Alert.alert(
            "Discard recording?",
            "This recording will be permanently removed from this device.",
            [
              { text: "Keep", style: "cancel" },
              {
                text: "Discard",
                style: "destructive",
                onPress: () =>
                  void run(async () => {
                    await service.discard();
                    router.back();
                  }),
              },
            ],
          )
        }
      >
        Discard this recording
      </Text>
    </Screen>
  );
}
