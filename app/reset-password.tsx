import { useState } from "react";
import { Text } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { apiClient } from "@/services/api/client";
import { Screen, Button, Field, s } from "@/components/ui";
export default function Reset() {
  const { token } = useLocalSearchParams<{ token: string }>(),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Screen>
      <Text style={s.title}>A fresh start.</Text>
      <Field
        label="New password · at least 10 characters"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {!!error && <Text style={s.error}>{error}</Text>}
      <Button
        title="Update password"
        disabled={!token || password.length < 10}
        loading={busy}
        onPress={() => {
          setBusy(true);
          void apiClient
            .reset(token, password)
            .then(() => router.replace("/(auth)/login"))
            .catch((e) => setError(e.message))
            .finally(() => setBusy(false));
        }}
      />
    </Screen>
  );
}
