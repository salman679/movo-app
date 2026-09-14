import { useState } from "react";
import { Alert, Linking, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/store/auth";
import { apiClient } from "@/services/api/client";
import { enableReminders, disableReminders } from "@/services/notifications";
import { activityTrackingService } from "@/services/tracking/ActivityTrackingService";
import { Screen, Button, Field, s } from "@/components/ui";
export default function Settings() {
  const { user, refresh, logout } = useAuth(),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <Text style={s.title}>Movo, your way.</Text>
      <Button
        secondary
        title={
          user?.profile.notificationsEnabled
            ? "Turn off daily reminder"
            : "Enable one daily reminder"
        }
        disabled={busy}
        onPress={() =>
          void run(async () => {
            if (user?.profile.notificationsEnabled) await disableReminders();
            else await enableReminders();
            await refresh();
          })
        }
      />
      <Text style={s.muted}>
        One optional reminder at 6 PM, in your device’s time zone. Redemption
        updates also appear in your inbox.
      </Text>
      <Button
        secondary
        title="Location & device permissions"
        onPress={() => void Linking.openSettings()}
      />
      <Button
        secondary
        title="Privacy Policy"
        onPress={() => router.push("/legal?type=privacy")}
      />
      <Button
        secondary
        title="Terms of Service"
        onPress={() => router.push("/legal?type=terms")}
      />
      <Button
        title="Log out"
        disabled={busy}
        onPress={() => void run(() => logout())}
      />
      <View style={s.card}>
        <Text style={s.h2}>Delete account</Text>
        <Text style={s.muted}>
          Your account, GPS recordings and sessions will be deleted or
          anonymized. Pending redemptions are cancelled. Anonymized transaction
          records are retained for the published accounting period.
        </Text>
        <Field
          label="Confirm your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button
          secondary
          title="Permanently delete account"
          loading={busy}
          disabled={!password}
          onPress={() =>
            Alert.alert(
              "Delete your Movo account?",
              "This cannot be undone. Finish or discard any active recording first.",
              [
                { text: "Keep account", style: "cancel" },
                {
                  text: "Delete account",
                  style: "destructive",
                  onPress: () =>
                    void run(async () => {
                      if (await activityTrackingService.getCurrentActivity(user!.id))
                        throw new Error(
                          "Finish or discard the active recording first.",
                        );
                      await apiClient.deleteAccount(password);
                      await logout(true);
                    }),
                },
              ],
            )
          }
        />
      </View>
      {!!error && <Text style={s.error}>{error}</Text>}
    </Screen>
  );
}
