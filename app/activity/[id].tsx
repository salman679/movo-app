import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api/client";
import { Screen, State, Badge, Metric, s } from "@/components/ui";
import { formatTime, formatPace } from "@/services/tracking/math";
export default function Details() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    q = useQuery({
      queryKey: ["activity", id],
      queryFn: () => apiClient.activity(id),
    }),
    a = q.data;
  return (
    <Screen>
      <State
        loading={q.isLoading}
        error={q.error}
        retry={() => void q.refetch()}
      />
      {a && (
        <>
          <Text style={s.title}>
            {a.type === "WALKING"
              ? "A walk well taken."
              : "Your run, recorded."}
          </Text>
          <Text style={s.muted}>{new Date(a.endedAt).toLocaleString()}</Text>
          <Badge value={a.status} />
          <View style={s.card}>
            <Text style={s.title}>
              {(a.distanceMeters / 1000).toFixed(2)} km
            </Text>
            <View style={s.row}>
              <Metric label="DURATION" value={formatTime(a.durationSeconds)} />
              <Metric
                label="AVERAGE PACE"
                value={formatPace(a.durationSeconds, a.distanceMeters)}
              />
            </View>
            <View style={s.row}>
              <Metric
                label="STEPS MEASURED"
                value={a.steps === null ? "Unavailable" : String(a.steps)}
              />
              <Metric label="POINTS EARNED" value={`+${a.pointsAwarded}`} />
            </View>
          </View>
          {a.status === "SUSPICIOUS" && (
            <Text style={s.muted}>
              Your activity needs a manual review. Redeemable points remain
              pending.
            </Text>
          )}
          {a.status === "REJECTED" && (
            <Text style={s.error}>
              No points were issued for this recording.
            </Text>
          )}
          {a.verificationFlags.length > 0 && (
            <Text style={s.muted}>
              {a.verificationFlags
                .join(", ")
                .toLowerCase()
                .replaceAll("_", " ")}
            </Text>
          )}
        </>
      )}
    </Screen>
  );
}
