import { useState } from "react";
import { Alert, Text, View } from "react-native";
import * as Crypto from "expo-crypto";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api/client";
import { Screen, State, Button, Field, Progress, s } from "@/components/ui";
export default function Donations() {
  const q = useQuery({ queryKey: ["donations"], queryFn: apiClient.donations }),
    query = useQueryClient(),
    [points, setPoints] = useState("50"),
    [key, setKey] = useState(() => Crypto.randomUUID()),
    [busy, setBusy] = useState(""),
    [error, setError] = useState("");
  return (
    <Screen>
      <Text style={s.title}>Good goes further.</Text>
      <Text style={s.muted}>
        Contribute points to a campaign. Campaign totals are measured in Movo
        Points, not cash.
      </Text>
      <Field
        label="Points to donate"
        value={points}
        keyboardType="number-pad"
        onChangeText={(v) => {
          setPoints(v);
          setKey(Crypto.randomUUID());
        }}
      />
      {!!error && <Text style={s.error}>{error}</Text>}
      <State
        loading={q.isLoading}
        error={q.error}
        retry={() => void q.refetch()}
        empty={
          !q.data?.length
            ? "No campaigns are accepting points right now."
            : undefined
        }
      />
      {q.data?.map((c) => (
        <View style={s.card} key={c.id}>
          <Text style={s.h2}>{c.title}</Text>
          <Text style={s.muted}>{c.description}</Text>
          <Progress value={c.currentAmount / c.targetAmount} />
          <Text style={s.muted}>
            {c.currentAmount.toLocaleString()} /{" "}
            {c.targetAmount.toLocaleString()} points
          </Text>
          <Button
            title="Donate to this cause"
            loading={busy === c.id}
            disabled={
              !!busy || !Number.isInteger(Number(points)) || Number(points) <= 0
            }
            onPress={() =>
              Alert.alert(
                "Confirm donation",
                `Contribute ${points} points to ${c.title}?`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Donate",
                    onPress: () => {
                      setBusy(c.id);
                      setError("");
                      void apiClient
                        .donate({
                          campaignId: c.id,
                          points: Number(points),
                          idempotencyKey: key,
                        })
                        .then(() => {
                          setKey(Crypto.randomUUID());
                          void query.invalidateQueries();
                          Alert.alert(
                            "Thank you",
                            "Your points have been added to the campaign.",
                          );
                        })
                        .catch((e) => setError(e.message))
                        .finally(() => setBusy(""));
                    },
                  },
                ],
              )
            }
          />
        </View>
      ))}
    </Screen>
  );
}
