import { useState } from "react";
import { Text, View, Pressable } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api/client";
import { useAuth } from "@/store/auth";
import { Screen, State, s } from "@/components/ui";
import { colors } from "@/theme";
export default function Leaderboard() {
  const [period, setPeriod] = useState("today"),
    { user } = useAuth(),
    q = useQuery({
      queryKey: ["leaderboard", period],
      queryFn: () => apiClient.leaderboard(period),
    });
  return (
    <Screen>
      <Text style={s.title}>A community in motion.</Text>
      <Text style={s.muted}>
        Ranked by verified activity points. A little friendly motivation.
      </Text>
      <View style={s.row}>
        {[
          ["today", "Today"],
          ["week", "This week"],
          ["month", "This month"],
        ].map(([v, label]) => (
          <Pressable
            key={v}
            style={[
              s.badge,
              {
                backgroundColor: period === v ? colors.green : colors.mint,
                padding: 12,
              },
            ]}
            onPress={() => setPeriod(v)}
          >
            <Text
              style={{
                color: period === v ? "white" : colors.green,
                fontWeight: "700",
              }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      <State
        loading={q.isLoading}
        error={q.error}
        retry={() => void q.refetch()}
        empty={
          !q.data?.length
            ? "Be the first to log a verified activity this period."
            : undefined
        }
      />
      {q.data?.map((r) => (
        <View
          key={r.userId}
          style={[
            s.card,
            s.row,
            r.userId === user?.id && { backgroundColor: colors.mint },
          ]}
        >
          <Text style={s.h2}>#{r.rank}</Text>
          <View
            style={{
              height: 38,
              width: 38,
              borderRadius: 20,
              backgroundColor: colors.lime,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={s.label}>{r.name.slice(0, 1)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>
              {r.name}
              {r.userId === user?.id ? " (you)" : ""}
            </Text>
            <Text style={s.muted}>{r.steps.toLocaleString()} steps</Text>
          </View>
          <Text style={s.h2}>
            {r.points} <Text style={{ fontSize: 12 }}>pts</Text>
          </Text>
        </View>
      ))}
      <Text style={[s.muted, { fontSize: 11 }]}>
        Periods use UTC. Weekly rankings start Monday.
      </Text>
    </Screen>
  );
}
