import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import type { Me, AuthResponse } from "@movo/shared";
import { apiClient, ApiError, session } from "../services/api/client";
import { analytics } from "../services/analytics";
import { activityTrackingService } from "../services/tracking/ActivityTrackingService";
import { eraseLocalUser } from "../services/tracking/storage";
type Auth = {
  user: Me | null;
  loading: boolean;
  offline: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (v: unknown) => Promise<void>;
  logout: (deleted?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
};
const C = createContext<Auth>(null!);
const CACHE = "movo.profile-cache";
export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<Me | null>(null),
    [loading, setLoading] = useState(true),
    [offline, setOffline] = useState(false);
  const query = useQueryClient();
  const refresh = async () => {
    try {
      if (!(await session.get())) {
        setUser(null);
        return;
      }
      const u = await apiClient.me();
      setUser(u);
      setOffline(false);
      await AsyncStorage.setItem(CACHE, JSON.stringify(u));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        await activityTrackingService.pause().catch(() => undefined);
        await session.clear();
        await AsyncStorage.removeItem(CACHE);
        query.clear();
        setUser(null);
      } else {
        setOffline(true);
        const raw = await AsyncStorage.getItem(CACHE);
        if (raw)
          try {
            setUser(JSON.parse(raw) as Me);
          } catch {
            /* Corrupt cache requires sign in. */
          }
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void refresh();
    analytics.track("app_opened");
  }, []);
  const authenticate = async (fn: () => Promise<AuthResponse>) => {
    const result = await fn();
    await session.set(result.token);
    await AsyncStorage.setItem(CACHE, JSON.stringify(result.user));
    query.clear();
    setOffline(false);
    setUser(result.user);
  };
  return (
    <C.Provider
      value={{
        user,
        loading,
        offline,
        refresh,
        login: (email, password) =>
          authenticate(() => apiClient.login({ email, password })),
        signup: async (v) => {
          await authenticate(() => apiClient.signup(v));
          analytics.track("signup_completed");
        },
        logout: async (deleted = false) => {
          if (await activityTrackingService.getCurrentActivity(user?.id))
            throw new Error(
              "Finish or discard your active activity before signing out.",
            );
          if (!deleted) await apiClient.logout();
          if (deleted && user) await eraseLocalUser(user.id);
          await session.clear();
          await AsyncStorage.removeItem(CACHE);
          query.clear();
          analytics.reset();
          setUser(null);
        },
      }}
    >
      {children}
    </C.Provider>
  );
}
export const useAuth = () => useContext(C);
