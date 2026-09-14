import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api/client";
import { analytics } from "@/services/analytics";
import { Screen, State, Button, Progress, s } from "@/components/ui";
export default function Challenge() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    query = useQueryClient(),
    q = useQuery({
      queryKey: ["challenge", id],
      queryFn: () => apiClient.challenge(id),
    }),
    mutation = useMutation({
      mutationFn: () => apiClient.join(id),
      onSuccess: () => {
        analytics.track("challenge_joined", { challengeId: id });
        void query.invalidateQueries();
      },
    }),
    c = q.data;
  return (
    <Screen>
      <State
        loading={q.isLoading}
        error={q.error}
        retry={() => void q.refetch()}
      />
      {c && (
        <>
          <Text style={s.title}>{c.title}</Text>
          <Text style={s.muted}>{c.description}</Text>
          <View style={s.card}>
            <Text style={s.h2}>Earn {c.rewardPoints} bonus points</Text>
            <Progress value={(c.progress?.progress ?? 0) / c.target} />
            <Text style={s.muted}>
              {Math.floor(c.progress?.progress ?? 0).toLocaleString()} /{" "}
              {c.target.toLocaleString()}{" "}
              {c.type === "DISTANCE" ? "meters" : c.type.toLowerCase()}
            </Text>
            <Text style={s.muted}>
              Ends {new Date(c.endDate).toLocaleString()}
            </Text>
          </View>
          <Text style={s.muted}>
            Only verified activities started after you join and completed within
            the challenge dates count. Bonus points are awarded automatically
            once.
          </Text>
          <State error={mutation.error} />
          <Button
            title={
              c.progress
                ? c.progress.completed
                  ? "Challenge completed"
                  : "You’re in!"
                : "Join challenge"
            }
            disabled={!!c.progress || new Date(c.endDate) < new Date()}
            loading={mutation.isPending}
            onPress={() => mutation.mutate()}
          />
        </>
      )}
    </Screen>
  );
}
