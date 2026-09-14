import { useState } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/store/auth";
import { Screen, Button, Field, s } from "@/components/ui";
export default function Login() {
  const { login } = useAuth(),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <Text style={s.title}>Welcome back.</Text>
      <Text style={s.muted}>Your next step starts here.</Text>
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
      />
      {!!error && <Text style={s.error}>{error}</Text>}
      <Button
        title="Log in"
        loading={busy}
        disabled={!email || !password}
        onPress={() => void submit()}
      />
      <Text
        style={s.link}
        onPress={() => router.push("/(auth)/forgot-password")}
      >
        Forgot password?
      </Text>
    </Screen>
  );
}
