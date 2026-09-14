import { useState } from "react";
import { Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api/client";
import { Screen, State, Button, Metric, s } from "@/components/ui";
export default function Wallet() {
  const [page, setPage] = useState(1),
    q = useQuery({
      queryKey: ["ledger", page],
      queryFn: () => apiClient.points(page),
    }),
    me = useQuery({ queryKey: ["me"], queryFn: apiClient.me });
  return (
    <Screen>
      <Text style={s.title}>A record of every point.</Text>
      {me.data && (
        <View style={s.hero}>
          <Metric
            label="AVAILABLE POINTS"
            value={me.data.profile.availablePoints.toLocaleString()}
            light
          />
          <View style={s.row}>
            <Metric
              label="LIFETIME EARNED"
              value={String(me.data.profile.lifetimeEarned)}
              light
            />
            <Metric
              label="LIFETIME SPENT"
              value={String(me.data.profile.lifetimeSpent)}
              light
            />
          </View>
        </View>
      )}
      <State
        loading={q.isLoading}
        error={q.error}
        retry={() => void q.refetch()}
        empty={
          !q.data?.length
            ? "Your first points transaction will appear here."
            : undefined
        }
      />
      {q.data?.map((t) => (
        <View style={s.card} key={t.id}>
          <View style={s.row}>
            <Text style={[s.label, { flex: 1 }]}>{t.description}</Text>
            <Text style={s.h2}>
              {t.amount > 0 ? "+" : ""}
              {t.amount}
            </Text>
          </View>
          <Text style={s.muted}>
            {new Date(t.createdAt).toLocaleString()} · Balance {t.balanceAfter}
          </Text>
        </View>
      ))}
      <View style={s.row}>
        <Button
          title="Previous"
          secondary
          disabled={page === 1}
          onPress={() => setPage((v) => v - 1)}
        />
        <Button
          title="Next"
          secondary
          disabled={(q.data?.length ?? 0) < 30}
          onPress={() => setPage((v) => v + 1)}
        />
      </View>
    </Screen>
  );
}
