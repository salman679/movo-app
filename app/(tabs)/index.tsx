import { Text, View, Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api/client";
import { useAuth } from "@/store/auth";
import {
  Screen,
  Button,
  State,
  Section,
  Metric,
  Progress,
  s,
} from "@/components/ui";
import { colors } from "@/theme";
export default function Home() {
  const { user, offline } = useAuth(),
    me = useQuery({ queryKey: ["me"], queryFn: apiClient.me }),
    acts = useQuery({
      queryKey: ["activities", 1],
      queryFn: () => apiClient.activities(),
    }),
    rewards = useQuery({ queryKey: ["rewards"], queryFn: apiClient.rewards }),
    challenges = useQuery({
      queryKey: ["challenges"],
      queryFn: apiClient.challenges,
    });
  const u = me.data ?? user;
  if (!u)
    return (
      <Screen>
        <State
          loading={me.isLoading}
          error={me.error}
          retry={() => void me.refetch()}
        />
      </Screen>
    );
  const c = challenges.data?.[0],
    reward = rewards.data?.[0],
    a = acts.data?.[0];
  return (
    <Screen>
      <View style={s.row}>
        <View>
          <Text style={s.muted}>A little better, every day</Text>
          <Text style={s.title}>
            Let’s move, {u.profile.name.split(" ")[0]}.
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Notifications"
          onPress={() => router.push("/notifications")}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={colors.green}
          />
        </Pressable>
      </View>
      {(offline || me.error) && (
        <Text style={s.error}>
          Offline · showing your last synced totals. Tracking is still
          available.
        </Text>
      )}
      <View style={s.hero}>
        <View style={s.row}>
          <Text style={{ color: "#D7E8DD", fontWeight: "600" }}>
            TODAY’S TRACKED STEPS
          </Text>
          <Ionicons name="footsteps-outline" size={22} color={colors.lime} />
        </View>
        <View>
          <Text
            style={{
              fontSize: 52,
              fontWeight: "800",
              color: "white",
              letterSpacing: -2,
            }}
          >
            {u.today.steps.toLocaleString()}
          </Text>
          <Text style={{ color: "#D7E8DD" }}>
            of {u.profile.dailyStepGoal.toLocaleString()} steps
          </Text>
        </View>
        <Progress value={u.today.steps / u.profile.dailyStepGoal} dark />
        <View style={s.row}>
          <Metric
            label="DISTANCE"
            value={`${(u.today.distanceMeters / 1000).toFixed(2)} km`}
            light
          />
          <Metric label="POINTS TODAY" value={`+${u.today.points}`} light />
          <Metric label="STREAK" value={`${u.streak.currentDays} days`} light />
        </View>
      </View>
      <Button
        title="START WALK"
        icon="walk-outline"
        onPress={() => router.push("/activity/track?type=WALKING")}
      />
      <Button
        secondary
        title="START RUN"
        icon="fitness-outline"
        onPress={() => router.push("/activity/track?type=RUNNING")}
      />
      <Pressable
        style={[
          s.card,
          { backgroundColor: colors.lime, borderColor: colors.lime },
        ]}
        onPress={() => router.push("/wallet")}
      >
        <View style={s.row}>
          <View>
            <Text style={s.label}>Your movement, rewarded</Text>
            <Text style={s.title}>
              {u.profile.availablePoints.toLocaleString()}{" "}
              <Text style={{ fontSize: 16 }}>points</Text>
            </Text>
          </View>
          <Ionicons
            name="arrow-forward-circle-outline"
            size={36}
            color={colors.green}
          />
        </View>
        <Text style={{ color: colors.green }}>
          Choose a reward. Or make someone’s day.
        </Text>
      </Pressable>
      <Section
        title="A little extra motivation"
        action={
          <Text style={s.link} onPress={() => router.push("/challenges")}>
            View all
          </Text>
        }
      />
      {c ? (
        <Pressable
          style={s.card}
          onPress={() => router.push(`/challenges/${c.id}`)}
        >
          <Text style={s.h2}>{c.title}</Text>
          <Progress value={(c.progress?.progress ?? 0) / c.target} />
          <Text style={s.muted}>
            Earn {c.rewardPoints} bonus points · ends{" "}
            {new Date(c.endDate).toLocaleDateString()}
          </Text>
        </Pressable>
      ) : (
        <State
          loading={challenges.isLoading}
          error={challenges.error}
          retry={() => void challenges.refetch()}
          empty="New challenges will appear here."
        />
      )}
      <Section
        title="Recent activity"
        action={
          <Text style={s.link} onPress={() => router.push("/(tabs)/activity")}>
            View all
          </Text>
        }
      />
      {a ? (
        <Pressable
          style={s.card}
          onPress={() => router.push(`/activity/${a.id}`)}
        >
          <Text style={s.h2}>
            {a.type === "WALKING" ? "Walk" : "Run"} ·{" "}
            {(a.distanceMeters / 1000).toFixed(2)} km
          </Text>
          <Text style={s.muted}>
            {new Date(a.endedAt).toLocaleDateString()} · {a.pointsAwarded}{" "}
            points
          </Text>
        </Pressable>
      ) : (
        <State
          loading={acts.isLoading}
          error={acts.error}
          retry={() => void acts.refetch()}
          empty="Your first recorded activity will appear here."
        />
      )}
      <Section title="Your next little reward" />
      {reward ? (
        <Pressable
          style={s.card}
          onPress={() => router.push(`/rewards/${reward.id}`)}
        >
          <Ionicons name="gift-outline" size={28} color={colors.green} />
          <Text style={s.h2}>{reward.title}</Text>
          <Text style={s.muted}>{reward.pointsRequired} points</Text>
        </Pressable>
      ) : (
        <State
          loading={rewards.isLoading}
          error={rewards.error}
          retry={() => void rewards.refetch()}
          empty="Rewards will appear when the catalog opens."
        />
      )}
      <Text style={[s.muted, { fontSize: 11 }]}>
        Daily totals reset at midnight UTC. Only verified activity earns points.
      </Text>
    </Screen>
  );
}
