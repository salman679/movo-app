import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { apiClient } from "@/services/api/client";
import { analytics } from "@/services/analytics";
import { Screen, State, Button, Field, s } from "@/components/ui";
export default function RewardDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    [recipient, setRecipient] = useState(""),
    [key, setKey] = useState(() => Crypto.randomUUID()),
    query = useQueryClient(),
    q = useQuery({
      queryKey: ["reward", id],
      queryFn: () => apiClient.reward(id),
    }),
    me = useQuery({ queryKey: ["me"], queryFn: apiClient.me }),
    mutation = useMutation({
      mutationFn: () =>
        apiClient.redeem({
          rewardId: id,
          idempotencyKey: key,
          recipient: recipient.trim(),
        }),
      onSuccess: (r) => {
        analytics.track("reward_redeemed", { rewardId: id });
        void query.invalidateQueries();
        router.replace(`/redemptions/${r.id}`);
      },
    });
  useEffect(() => analytics.track("reward_viewed", { rewardId: id }), [id]);
  const r = q.data,
    balance = me.data?.profile.availablePoints;
  return (
    <Screen>
      <State
        loading={q.isLoading}
        error={q.error}
        retry={() => void q.refetch()}
      />
      {r && (
        <>
          <Text style={s.title}>{r.title}</Text>
          <Text style={s.muted}>{r.description}</Text>
          <View style={s.card}>
            <Text style={s.title}>{r.pointsRequired} points</Text>
            <Text style={s.muted}>
              Your balance:{" "}
              {balance === undefined ? "Loading…" : `${balance} points`}
            </Text>
            <Text style={s.muted}>
              {r.stock > 0 ? `${r.stock} available` : "Out of stock"}
            </Text>
          </View>
          <Field
            label={
              r.type === "MOBILE_RECHARGE"
                ? "Mobile number to recharge"
                : "Delivery email or recipient details"
            }
            keyboardType={
              r.type === "MOBILE_RECHARGE" ? "phone-pad" : "email-address"
            }
            value={recipient}
            onChangeText={(v) => {
              setRecipient(v);
              setKey(Crypto.randomUUID());
              mutation.reset();
            }}
          />
          <Text style={s.muted}>
            The Movo team reviews and fulfills requests manually. If a request
            is rejected, your points are returned.
          </Text>
          <State error={mutation.error} />
          <Button
            title="Redeem reward"
            loading={mutation.isPending}
            disabled={
              !r.active ||
              r.stock < 1 ||
              recipient.trim().length < 3 ||
              balance === undefined ||
              balance < r.pointsRequired
            }
            onPress={() =>
              Alert.alert(
                "Confirm redemption",
                `Spend ${r.pointsRequired} points on ${r.title}?`,
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Redeem", onPress: () => mutation.mutate() },
                ],
              )
            }
          />
          {balance !== undefined && balance < r.pointsRequired && (
            <Text style={s.muted}>
              Earn {r.pointsRequired - balance} more points to redeem this
              reward.
            </Text>
          )}
          <Button
            secondary
            title="Donate points instead"
            onPress={() => {
              analytics.track("donation_selected");
              router.push("/donations");
            }}
          />
        </>
      )}
    </Screen>
  );
}
