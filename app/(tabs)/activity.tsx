import { useState } from "react";
import { Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api/client";
import { useAuth } from "@/store/auth";
import { queued } from "@/services/tracking/storage";
import { syncPending } from "@/services/tracking/sync";
import { Screen, State, Button, Badge, Section, s } from "@/components/ui";
import { ActivityCard } from "@/components/ActivityCard";
export default function History() {
  const [page, setPage] = useState(1),
    { user } = useAuth(),
    query = useQueryClient(),
    list = useQuery({
      queryKey: ["activities", page],
      queryFn: () => apiClient.activities(page),
    }),
    pending = useQuery({
      queryKey: ["queue"],
      queryFn: () => queued(user!.id),
      refetchInterval: 5000,
    });
  const items = pending.data?.filter((q) => q.state !== "SYNCED") ?? [];
  return (
    <Screen>
      <Text style={s.title}>Every move matters.</Text>
      <Button
        secondary
        title="Recover active recording"
        onPress={() => router.push("/activity/track")}
      />
      {items.length > 0 && (
        <>
          <Section title="Waiting to sync" />
          {items.map((q) => (
            <Pressable
              key={q.id}
              style={s.card}
              onPress={() => router.push(`/activity/summary?id=${q.id}`)}
            >
              <View style={s.row}>
                <Text style={s.label}>
                  {new Date(q.createdAt).toLocaleString()}
                </Text>
                <Badge value={q.state} />
              </View>
              <Text style={s.muted}>
                {q.error ?? "Saved safely on this device."}
              </Text>
            </Pressable>
          ))}
          <Button
            title="Retry sync"
            onPress={() =>
              void syncPending(user!.id).then(() => query.invalidateQueries())
            }
          />
        </>
      )}
      <State
        loading={list.isLoading}
        error={list.error}
        retry={() => void list.refetch()}
        empty={
          !list.data?.length
            ? "No submitted activities yet. Start a walk to begin."
            : undefined
        }
      />
      {list.data?.map((a) => (
        <ActivityCard key={a.id} activity={a} />
      ))}
      <View style={s.row}>
        <Button
          secondary
          title="Previous"
          disabled={page === 1}
          onPress={() => setPage((v) => v - 1)}
        />
        <Text style={s.muted}>Page {page}</Text>
        <Button
          secondary
          title="Next"
          disabled={(list.data?.length ?? 0) < 30}
          onPress={() => setPage((v) => v + 1)}
        />
      </View>
    </Screen>
  );
}
