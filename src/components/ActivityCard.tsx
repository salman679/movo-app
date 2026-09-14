import { Text, Pressable, View } from "react-native";
import { router } from "expo-router";
import type { Activity } from "@movo/shared";
import { Badge, s } from "./ui";
export function ActivityCard({ activity: a }: { activity: Activity }) {
  return (
    <Pressable style={s.card} onPress={() => router.push(`/activity/${a.id}`)}>
      <View style={s.row}>
        <Text style={s.h2}>{a.type === "WALKING" ? "Walk" : "Run"}</Text>
        <Badge value={a.status} />
      </View>
      <Text style={s.title}>
        {(a.distanceMeters / 1000).toFixed(2)} <Text style={s.muted}>km</Text>
      </Text>
      <Text style={s.muted}>
        {Math.round(a.durationSeconds / 60)} min ·{" "}
        {a.steps === null ? "Steps unavailable" : `${a.steps} steps`} · +
        {a.pointsAwarded} points
      </Text>
      <Text style={s.muted}>{new Date(a.endedAt).toLocaleString()}</Text>
    </Pressable>
  );
}
