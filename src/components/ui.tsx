import type { PropsWithChildren, ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "../theme";
export function Screen({
  children,
  scroll = true,
}: PropsWithChildren<{ scroll?: boolean }>) {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.cream }}
      edges={["left", "right"]}
    >
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.screen}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[s.screen, { flex: 1 }]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
export function Button({
  title,
  onPress,
  secondary,
  disabled,
  loading,
  icon,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        { opacity: disabled || loading ? 0.5 : pressed ? 0.8 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? colors.green : "white"} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={secondary ? colors.green : "white"}
            />
          )}
          <Text style={[s.buttonText, secondary && { color: colors.green }]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
export function State({
  loading,
  error,
  empty,
  retry,
}: {
  loading?: boolean;
  error?: Error | null;
  empty?: string;
  retry?: () => void;
}) {
  if (loading)
    return (
      <View style={s.state}>
        <ActivityIndicator color={colors.green} />
        <Text style={s.muted}>Loading your latest data…</Text>
      </View>
    );
  if (error)
    return (
      <View style={s.card}>
        <Text style={s.error}>{error.message}</Text>
        {retry && <Button title="Try again" onPress={retry} />}
      </View>
    );
  if (empty)
    return (
      <View style={s.card}>
        <Ionicons name="leaf-outline" size={30} color={colors.green} />
        <Text style={s.muted}>{empty}</Text>
      </View>
    );
  return null;
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#8C9A91"
        style={s.input}
        {...props}
      />
    </View>
  );
}
export function Badge({ value }: { value: string }) {
  const good = ["VERIFIED", "SYNCED", "DELIVERED"].includes(value),
    bad = ["REJECTED", "FAILED"].includes(value);
  return (
    <View
      style={[
        s.badge,
        { backgroundColor: good ? colors.mint : bad ? "#FCECE8" : "#FFF1D8" },
      ]}
    >
      <Text
        style={{
          color: good ? colors.green : bad ? colors.danger : colors.amber,
          fontWeight: "700",
          fontSize: 11,
        }}
      >
        {value.replaceAll("_", " ")}
      </Text>
    </View>
  );
}
export function Progress({
  value,
  dark = false,
}: {
  value: number;
  dark?: boolean;
}) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(Math.min(100, Math.max(0, value * 100))),
      }}
      style={{
        height: 9,
        borderRadius: 8,
        backgroundColor: dark ? "#36745D" : colors.mint,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: 9,
          width: `${Math.min(100, Math.max(0, value * 100))}%`,
          backgroundColor: dark ? colors.lime : colors.green,
          borderRadius: 8,
        }}
      />
    </View>
  );
}
export function Metric({
  label,
  value,
  light = false,
}: {
  label: string;
  value: string;
  light?: boolean;
}) {
  return (
    <View style={{ flex: 1, gap: 5 }}>
      <Text style={[s.muted, light && { color: "#D1E1D5" }, { fontSize: 11 }]}>
        {label}
      </Text>
      <Text style={[s.h2, light && { color: "white" }]}>{value}</Text>
    </View>
  );
}
export function Section({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <View style={s.row}>
      <Text style={s.h2}>{title}</Text>
      {action}
    </View>
  );
}
export const s = StyleSheet.create({
  screen: { padding: 22, gap: 18, paddingBottom: 38, flexGrow: 1 },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -1,
  },
  h2: {
    fontSize: 19,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.4,
  },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  label: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  card: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  hero: {
    backgroundColor: colors.green,
    borderRadius: 28,
    padding: 24,
    gap: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    backgroundColor: colors.green,
    padding: 17,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
    minHeight: 54,
  },
  secondary: {
    backgroundColor: colors.mint,
    borderWidth: 1,
    borderColor: colors.line,
  },
  buttonText: { color: "white", fontSize: 15, fontWeight: "700" },
  input: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.ink,
    fontSize: 16,
  },
  error: { color: colors.danger, fontSize: 14, lineHeight: 21 },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  state: { padding: 25, gap: 12, alignItems: "center" },
  link: { color: colors.green, fontWeight: "700", fontSize: 13 },
});
