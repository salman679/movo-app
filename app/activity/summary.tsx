import { useEffect } from "react";
import { Text, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import type { Activity, ActivitySubmission } from "@movo/shared";
import { queuedById } from "@/services/tracking/storage";
import { syncPending } from "@/services/tracking/sync";
import { useAuth } from "@/store/auth";
import { Screen, State, Button, Badge, Metric, s } from "@/components/ui";
import { formatPace, formatTime } from "@/services/tracking/math";
export default function Summary() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    { user } = useAuth(),
    query = useQueryClient(),
    q = useQuery({
      queryKey: ["queue-item", id],
      queryFn: () => queuedById(id, user!.id),
      refetchInterval: 2000,
    });
  useEffect(() => {
    void syncPending(user!.id).then(() => query.invalidateQueries());
  }, [id]);
  if (!q.data)
    return (
      <Screen>
        <State
          loading={q.isLoading}
          error={q.error}
          retry={() => void q.refetch()}
          empty="Recording could not be found."
        />
      </Screen>
    );
  const item = q.data,
    a = item.result ? (JSON.parse(item.result) as Activity) : null,
    input =
      item.body !== "{}" ? (JSON.parse(item.body) as ActivitySubmission) : null;
  return (
    <Screen>
      <Text style={s.title}>
        {a?.status === "REJECTED"
          ? "Activity reviewed."
          : "Great job showing up!"}
      </Text>
      <Text style={s.muted}>
        {a
          ? "Your activity has been checked by Movo."
          : "Your recording is saved. Points will appear after server verification."}
      </Text>
      <Badge value={a?.status ?? item.state} />
      <View style={s.hero}>
        <Text style={{ color: "white", fontSize: 42, fontWeight: "800" }}>
          {a?.status === "VERIFIED" ? `+${a.pointsAwarded}` : a?.status === "REJECTED" ? "0" : "Pending"}{" "}
          <Text style={{ fontSize: 16 }}>Movo Points</Text>
        </Text>
      </View>
      {a && (
        <View style={s.card}>
          <View style={s.row}>
            <Metric
              label="DISTANCE"
              value={`${(a.distanceMeters / 1000).toFixed(2)} km`}
            />
            <Metric label="DURATION" value={formatTime(a.durationSeconds)} />
          </View>
          <View style={s.row}>
            <Metric
              label="STEPS"
              value={a.steps === null ? "Unavailable" : String(a.steps)}
            />
            <Metric
              label="AVERAGE PACE"
              value={formatPace(a.durationSeconds, a.distanceMeters)}
            />
          </View>
        </View>
      )}
      {input && (
        <Text style={s.muted}>
          {input.coordinates.length} recorded GPS samples ·{" "}
          {input.type.toLowerCase()}
        </Text>
      )}
      {a?.verificationFlags.length ? (
        <Text style={s.muted}>
          Review notes:{" "}
          {a.verificationFlags
            .map((f) => f.toLowerCase().replaceAll("_", " "))
            .join(", ")}
        </Text>
      ) : null}
      {item.error && <Text style={s.error}>{item.error}</Text>}
      {!a && (
        <Button
          title="Retry sync"
          onPress={() =>
            void syncPending(user!.id).then(() => query.invalidateQueries())
          }
        />
      )}
      {a && (
        <Button
          title="View activity"
          onPress={() => router.replace(`/activity/${a.id}`)}
        />
      )}
      <Button
        secondary
        title="Back to home"
        onPress={() => router.replace("/(tabs)")}
      />
    </Screen>
  );
}
