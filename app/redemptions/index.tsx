import { Text, Pressable } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api/client";
import { Screen, State, Badge, s } from "@/components/ui";
export default function Redemptions() {
  const q = useQuery({
    queryKey: ["redemptions"],
    queryFn: apiClient.redemptions,
  });
  return (
    <Screen>
      <Text style={s.title}>Your little wins.</Text>
      <State
        loading={q.isLoading}
        error={q.error}
        retry={() => void q.refetch()}
        empty={
          !q.data?.length
            ? "No redemptions yet. Explore the rewards catalog."
            : undefined
        }
      />
      {q.data?.map((r) => (
        <Pressable
          key={r.id}
          style={s.card}
          onPress={() => router.push(`/redemptions/${r.id}`)}
        >
          <Badge value={r.status} />
          <Text style={s.h2}>{r.reward.title}</Text>
          <Text style={s.muted}>
            {r.pointsSpent} points ·{" "}
            {new Date(r.createdAt).toLocaleDateString()}
          </Text>
        </Pressable>
      ))}
    </Screen>
  );
}
