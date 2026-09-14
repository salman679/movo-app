import { Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Button, s } from "@/components/ui";
import { colors } from "@/theme";
export default function Welcome() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={[s.screen, { justifyContent: "space-between" }]}>
        <Text style={{ fontSize: 28, fontWeight: "900", color: colors.green }}>
          movo<Text style={{ color: "#98C947" }}> •</Text>
        </Text>
        <View style={{ gap: 24 }}>
          <View
            style={{
              height: 230,
              borderRadius: 120,
              backgroundColor: colors.mint,
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "center",
              width: 230,
              borderWidth: 20,
              borderColor: "#EFF4E6",
            }}
          >
            <Ionicons name="walk-outline" size={120} color={colors.green} />
            <View
              style={{
                position: "absolute",
                right: -30,
                top: 20,
                backgroundColor: colors.lime,
                padding: 14,
                borderRadius: 20,
              }}
            >
              <Ionicons name="sparkles" size={26} color={colors.green} />
            </View>
          </View>
          <Text
            style={{
              fontSize: 49,
              lineHeight: 53,
              fontWeight: "800",
              letterSpacing: -2,
              color: colors.ink,
            }}
          >
            Small steps.{"\n"}Real possibilities.
          </Text>
          <Text style={[s.muted, { fontSize: 17, lineHeight: 26 }]}>
            Walk or run. Earn verified Movo Points. Choose a reward or give to a
            cause.
          </Text>
          <View style={s.row}>
            {[
              ["walk-outline", "MOVE"],
              ["sparkles-outline", "EARN"],
              ["heart-outline", "GIVE"],
            ].map(([icon, label]) => (
              <View
                key={label}
                style={{ alignItems: "center", gap: 8, flex: 1 }}
              >
                <Ionicons
                  name={icon as "walk-outline"}
                  size={25}
                  color={colors.green}
                />
                <Text style={s.label}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={{ gap: 12 }}>
          <Button
            title="Start your journey"
            icon="arrow-forward"
            onPress={() => router.push("/(auth)/signup")}
          />
          <Button
            secondary
            title="I already have an account"
            onPress={() => router.push("/(auth)/login")}
          />
          <Text style={[s.muted, { textAlign: "center", fontSize: 12 }]}>
            Move. Earn. Give.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
