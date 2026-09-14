import { useState } from "react";
import { Text, View, Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "@/store/auth";
import { apiClient } from "@/services/api/client";
import { analytics } from "@/services/analytics";
import { Screen, Button, Field, s } from "@/components/ui";
import { colors } from "@/theme";
export default function Onboarding() {
  const { user, refresh } = useAuth(),
    [name, setName] = useState(user?.profile.name ?? ""),
    [goal, setGoal] = useState("10000"),
    [type, setType] = useState("BOTH"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Screen>
      <Text style={s.title}>Your pace. Your purpose.</Text>
      <Text style={s.muted}>A few details to make Movo feel like you.</Text>
      <Field
        label="What should we call you?"
        value={name}
        onChangeText={setName}
      />
      <Field
        label="Daily step goal"
        keyboardType="number-pad"
        value={goal}
        onChangeText={setGoal}
      />
      <Text style={s.label}>How do you like to move?</Text>
      <View style={s.row}>
        {["WALKING", "RUNNING", "BOTH"].map((v) => (
          <Pressable
            key={v}
            onPress={() => setType(v)}
            style={[
              s.card,
              {
                flex: 1,
                padding: 13,
                backgroundColor: v === type ? colors.mint : "white",
              },
            ]}
          >
            <Text style={s.label}>
              {v === "BOTH" ? "Both" : v === "WALKING" ? "Walk" : "Run"}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={s.card}>
        <Ionicons name="location-outline" size={26} color={colors.green} />
        <Text style={s.h2}>You control location access</Text>
        <Text style={s.muted}>
          Movo uses your location during a walk or run to measure distance and
          verify your activity. We’ll ask when you start. Screen-lock tracking
          is optional.
        </Text>
        <Text style={s.muted}>
          Step totals cover recorded activities where your device provides step
          measurements.
        </Text>
      </View>
      {!!error && <Text style={s.error}>{error}</Text>}
      <Button
        title="Let’s get moving"
        loading={busy}
        onPress={() => {
          setBusy(true);
          void apiClient
            .onboarding({
              name,
              dailyStepGoal: Number(goal),
              preferredActivity: type,
            })
            .then(() => {
              analytics.track("onboarding_completed");
              return refresh();
            })
            .catch((e) => setError(e.message))
            .finally(() => setBusy(false));
        }}
      />
    </Screen>
  );
}
