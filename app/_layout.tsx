import { useEffect } from "react";
import { AppState } from "react-native";
import { Stack } from "expo-router";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import * as Network from "expo-network";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/store/auth";
import { syncPending } from "@/services/tracking/sync";
import "@/services/tracking/ActivityTrackingService";
import { colors } from "@/theme";
export { ErrorBoundary } from "expo-router";
void SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
    mutations: { retry: false },
  },
});
function Navigation() {
  const { user, loading } = useAuth(),
    query = useQueryClient();
  useEffect(() => {
    if (!loading) void SplashScreen.hideAsync();
  }, [loading]);
  useEffect(() => {
    if (!user) return;
    const sync = () => {
      void syncPending(user.id).then(() => query.invalidateQueries());
    };
    sync();
    const net = Network.addNetworkStateListener((s) => {
      if (s.isConnected) sync();
    });
    const app = AppState.addEventListener("change", (s) => {
      if (s === "active") sync();
    });
    return () => {
      net.remove();
      app.remove();
    };
  }, [user?.id]);
  if (loading) return null;
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.cream },
          headerTintColor: colors.ink,
          contentStyle: { backgroundColor: colors.cream },
          headerTitleStyle: { fontSize: 17 },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Protected guard={!user}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen
            name="reset-password"
            options={{ title: "Reset password" }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!!user && !user.profile.onboardingComplete}>
          <Stack.Screen
            name="onboarding"
            options={{ title: "Make Movo yours", headerBackVisible: false }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!!user && user.profile.onboardingComplete}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="activity/track"
            options={{ title: "Your activity", gestureEnabled: false }}
          />
          <Stack.Screen
            name="activity/summary"
            options={{ title: "Activity summary" }}
          />
          <Stack.Screen
            name="activity/[id]"
            options={{ title: "Activity details" }}
          />
          <Stack.Screen
            name="rewards/[id]"
            options={{ title: "Choose your reward" }}
          />
          <Stack.Screen
            name="redemptions/index"
            options={{ title: "Your redemptions" }}
          />
          <Stack.Screen
            name="redemptions/[id]"
            options={{ title: "Redemption details" }}
          />
          <Stack.Screen
            name="challenges/index"
            options={{ title: "Challenges" }}
          />
          <Stack.Screen
            name="challenges/[id]"
            options={{ title: "Challenge details" }}
          />
          <Stack.Screen
            name="donations"
            options={{ title: "Give your points purpose" }}
          />
          <Stack.Screen name="wallet" options={{ title: "Your points" }} />
          <Stack.Screen name="settings" options={{ title: "Settings" }} />
          <Stack.Screen
            name="notifications"
            options={{ title: "Notifications" }}
          />
        </Stack.Protected>
        <Stack.Screen name="legal" options={{ title: "Movo information" }} />
      </Stack>
    </>
  );
}
export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </QueryClientProvider>
  );
}
