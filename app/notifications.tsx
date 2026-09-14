import { Text, Pressable } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api/client";
import { Screen, State, s } from "@/components/ui";
export default function Notifications() {
  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: apiClient.notifications,
  });
  return (
    <Screen>
      <Text style={s.title}>Good things to know.</Text>
      <State
        loading={q.isLoading}
        error={q.error}
        retry={() => void q.refetch()}
        empty={
          !q.data?.length
            ? "You’re all caught up. Reward updates will appear here."
            : undefined
        }
      />
      {q.data?.map((n) => (
        <Pressable
          key={n.id}
          style={s.card}
          onPress={() =>
            void apiClient.readNotification(n.id).then(() => q.refetch())
          }
        >
          <Text style={s.h2}>
            {n.title}
            {n.readAt ? "" : " •"}
          </Text>
          <Text style={s.muted}>{n.body}</Text>
          <Text style={s.muted}>{new Date(n.createdAt).toLocaleString()}</Text>
        </Pressable>
      ))}
    </Screen>
  );
}
