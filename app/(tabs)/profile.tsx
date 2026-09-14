import { Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api/client";
import { Screen, State, Metric, Button, s } from "@/components/ui";
import { colors } from "@/theme";
export default function Profile() {
  const q = useQuery({ queryKey: ["me"], queryFn: apiClient.me }),
    u = q.data;
  return (
    <Screen>
      <State
        loading={q.isLoading}
        error={q.error}
        retry={() => void q.refetch()}
      />
      {u && (
        <>
          <View style={{ alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 86,
                height: 86,
                borderRadius: 45,
                backgroundColor: colors.lime,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ fontSize: 36, color: colors.green, fontWeight: "800" }}
              >
                {u.profile.name.slice(0, 1)}
              </Text>
            </View>
            <Text style={s.title}>{u.profile.name}</Text>
            <Text style={s.muted}>{u.email}</Text>
          </View>
          <View style={s.card}>
            <View style={s.row}>
              <Metric
                label="TOTAL DISTANCE"
                value={`${(u.stats.distanceMeters / 1000).toFixed(1)} km`}
              />
              <Metric label="ACTIVITIES" value={String(u.stats.activities)} />
            </View>
            <View style={s.row}>
              <Metric
                label="STEPS MEASURED"
                value={u.stats.steps.toLocaleString()}
              />
              <Metric
                label="CURRENT STREAK"
                value={`${u.streak.currentDays} days`}
              />
            </View>
          </View>
          <Pressable style={s.hero} onPress={() => router.push("/wallet")}>
            <Metric
              label="LIFETIME POINTS EARNED"
              value={u.profile.lifetimeEarned.toLocaleString()}
              light
            />
          </Pressable>
          <Button
            secondary
            title="Your redemptions"
            onPress={() => router.push("/redemptions")}
          />
          <Button
            secondary
            title="Challenges"
            onPress={() => router.push("/challenges")}
          />
          <Button title="Settings" onPress={() => router.push("/settings")} />
        </>
      )}
    </Screen>
  );
}
