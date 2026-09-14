import { Text, Pressable, View } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api/client";
import { Screen, State, Button, s } from "@/components/ui";
import { colors } from "@/theme";
export default function Rewards() {
  const q = useQuery({ queryKey: ["rewards"], queryFn: apiClient.rewards });
  return (
    <Screen>
      <Text style={s.title}>You moved. You earned.</Text>
      <Text style={s.muted}>Turn verified points into something good.</Text>
      <View style={s.row}>
        <Text style={s.link} onPress={() => router.push("/wallet")}>
          View wallet
        </Text>
        <Text style={s.link} onPress={() => router.push("/redemptions")}>
          My redemptions
        </Text>
      </View>
      <State
        loading={q.isLoading}
        error={q.error}
        retry={() => void q.refetch()}
        empty={
          !q.data?.length ? "The rewards catalog is being prepared." : undefined
        }
      />
      {q.data?.map((r) => (
        <Pressable
          key={r.id}
          style={s.card}
          onPress={() => router.push(`/rewards/${r.id}`)}
        >
          <View style={s.row}>
            <View
              style={{
                backgroundColor: colors.mint,
                padding: 16,
                borderRadius: 18,
              }}
            >
              <Ionicons
                name={
                  r.type === "MOBILE_RECHARGE"
                    ? "phone-portrait-outline"
                    : "gift-outline"
                }
                size={32}
                color={colors.green}
              />
            </View>
            <Text style={s.h2}>{r.pointsRequired} pts</Text>
          </View>
          <Text style={s.h2}>{r.title}</Text>
          <Text style={s.muted}>
            {r.stock > 0 ? `${r.stock} available` : "Out of stock"}
          </Text>
        </Pressable>
      ))}
      <View style={[s.card, { backgroundColor: colors.mint }]}>
        <Ionicons name="heart-outline" size={30} color={colors.green} />
        <Text style={s.h2}>Give your movement a purpose.</Text>
        <Text style={s.muted}>
          Contribute points to an active community campaign.
        </Text>
        <Button
          title="Donate points"
          onPress={() => router.push("/donations")}
        />
      </View>
    </Screen>
  );
}
