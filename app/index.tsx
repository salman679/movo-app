import { Redirect } from "expo-router";
import { useAuth } from "@/store/auth";
export default function Index() {
  const { user } = useAuth();
  return (
    <Redirect
      href={
        !user
          ? "/(auth)/welcome"
          : user.profile.onboardingComplete
            ? "/(tabs)"
            : "/onboarding"
      }
    />
  );
}
