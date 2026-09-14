import { useState } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/store/auth";
import { signupSchema } from "@movo/shared";
import { Screen, Button, Field, s } from "@/components/ui";
export default function Signup() {
  const { signup } = useAuth(),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [phone, setPhone] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const submit = async () => {
    const parsed = signupSchema.safeParse({
      name,
      email: email.trim(),
      password,
      phone: phone || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]!.message);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signup(parsed.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <Text style={s.title}>Make every move count.</Text>
      <Text style={s.muted}>Create your free Movo account.</Text>
      <Field
        label="Name"
        value={name}
        onChangeText={setName}
        autoComplete="name"
      />
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <Field
        label="Phone (optional)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <Field
        label="Password · at least 10 characters"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
      />
      {!!error && <Text style={s.error}>{error}</Text>}
      <Button
        title="Create account"
        loading={busy}
        onPress={() => void submit()}
      />
      <Text style={s.muted}>
        By creating an account, you agree to the{" "}
        <Text style={s.link} onPress={() => router.push("/legal?type=terms")}>
          Terms
        </Text>{" "}
        and acknowledge our{" "}
        <Text style={s.link} onPress={() => router.push("/legal?type=privacy")}>
          Privacy Policy
        </Text>
        .
      </Text>
    </Screen>
  );
}
