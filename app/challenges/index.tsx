import { Text, Pressable } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api/client";
import { Screen, State, Progress, s } from "@/components/ui";
export default function Challenges() {
  const q = useQuery({
    queryKey: ["challenges"],
    queryFn: apiClient.challenges,
  });
  return (
    <Screen>
      <Text style={s.title}>Find your next goal.</Text>
      <State
        loading={q.isLoading}
        error={q.error}
        retry={() => void q.refetch()}
        empty={
          !q.data?.length ? "No active challenges. Check back soon." : undefined
        }
      />
      {q.data?.map((c) => (
        <Pressable
          key={c.id}
          style={s.card}
          onPress={() => router.push(`/challenges/${c.id}`)}
        >
          <Text style={s.h2}>{c.title}</Text>
          <Text style={s.muted}>{c.description}</Text>
          <Progress value={(c.progress?.progress ?? 0) / c.target} />
          <Text style={s.label}>
            +{c.rewardPoints} points ·{" "}
            {c.progress ? "Joined" : "Join challenge"}
          </Text>
        </Pressable>
      ))}
    </Screen>
  );
}
