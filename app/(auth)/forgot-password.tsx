import { useState } from "react";
import { Text } from "react-native";
import { apiClient } from "@/services/api/client";
import { Screen, Button, Field, s } from "@/components/ui";
export default function Forgot() {
  const [email, setEmail] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Screen>
      <Text style={s.title}>Let’s get you back.</Text>
      <Text style={s.muted}>
        We’ll send a password reset link to your email.
      </Text>
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {!!message && <Text style={s.muted}>{message}</Text>}
      {!!error && <Text style={s.error}>{error}</Text>}
      <Button
        title="Send reset link"
        loading={busy}
        disabled={!email}
        onPress={() => {
          setBusy(true);
          setError("");
          void apiClient
            .forgot(email.trim())
            .then((v) => setMessage(v.message))
            .catch((e) => setError(e.message))
            .finally(() => setBusy(false));
        }}
      />
    </Screen>
  );
}
