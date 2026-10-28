import { useEffect, useRef } from "react";
import { useTaskStore } from "../store";

export function useTaskReminders(): void {
  const tasks = useTaskStore((s) => s.tasks);
  const notificationSettings = useTaskStore((s) => s.notificationSettings);
  const notifications = useTaskStore((s) => s.notifications);
  const syncReminders = useTaskStore((s) => s.syncReminders);

  const dispatchedBrowserNotificationIdsRef = useRef<Set<string>>(new Set());

  // Re-sync reminders when tasks or notification settings change
  useEffect(() => {
    syncReminders();
  }, [tasks, notificationSettings, syncReminders]);

  // Periodic interval (every 60 seconds) to keep reminders up-to-date across date transitions
  useEffect(() => {
    const timer = setInterval(() => {
      syncReminders();
    }, 60000);
    return () => clearInterval(timer);
  }, [syncReminders]);

  // Trigger browser notifications if enabled and permission granted
  useEffect(() => {
    if (
      !notificationSettings.enabled ||
      !notificationSettings.browserNotifications ||
      typeof window === "undefined" ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    ) {
      return;
    }

    // Only dispatch for unread notifications that haven't been shown via browser alert yet
    notifications.forEach((n) => {
      if (!n.read && !dispatchedBrowserNotificationIdsRef.current.has(n.id)) {
        dispatchedBrowserNotificationIdsRef.current.add(n.id);
        try {
          const browserNotif = new Notification(n.title, {
            body: n.message,
            icon: "/favicon.ico",
          });
          browserNotif.onclick = () => {
            window.focus();
          };
        } catch (err) {
          console.warn("TaskFlow: Failed to dispatch browser notification", err);
        }
      }
    });
  }, [notifications, notificationSettings.enabled, notificationSettings.browserNotifications]);
}
