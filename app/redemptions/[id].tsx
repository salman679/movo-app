import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api/client";
import { Screen, State, Badge, s } from "@/components/ui";
export default function Redemption() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    q = useQuery({
      queryKey: ["redemption", id],
      queryFn: () => apiClient.redemption(id),
    }),
    r = q.data;
  return (
    <Screen>
      <State
        loading={q.isLoading}
        error={q.error}
        retry={() => void q.refetch()}
      />
      {r && (
        <>
          <Text style={s.title}>{r.reward.title}</Text>
          <Badge value={r.status} />
          <View style={s.card}>
            <Text style={s.h2}>{r.pointsSpent} points</Text>
            <Text style={s.muted}>Recipient: {r.recipient}</Text>
            <Text style={s.muted}>
              Requested {new Date(r.createdAt).toLocaleString()}
            </Text>
            <Text style={s.muted}>
              {r.fulfillmentNote ??
                "Your request is awaiting review by the Movo team."}
            </Text>
          </View>
          {r.status === "REJECTED" && (
            <Text style={s.muted}>
              Your points have been returned to your wallet.
            </Text>
          )}
          <Text style={[s.muted, { fontSize: 11 }]}>Reference: {r.id}</Text>
        </>
      )}
    </Screen>
  );
}
