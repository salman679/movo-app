import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { apiClient } from "../api/client";
export async function enableReminders() {
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync("helpful-reminders", {
      name: "Movo reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted)
    throw new Error(
      "Notifications are disabled. You can enable them in system settings.",
    );
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "A little movement goes a long way",
      body: "Ready for a walk? Open Movo and start an activity.",
      data: { type: "daily_goal_reminder" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 18,
      minute: 0,
      channelId: "helpful-reminders",
    },
  });
  const projectId = Constants.easConfig?.projectId;
  if (projectId) {
    try {
      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      await apiClient.device(token.data);
    } catch {
      /* Local reminder remains available without push registration. */
    }
  }
  await apiClient.settings({ notificationsEnabled: true });
}
export async function disableReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await apiClient.settings({ notificationsEnabled: false });
}
