import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchNotifications,
  markAllRead,
  clearAllNotifications,
  subscribeToNotifications,
} from '../lib/notifications';
import type { PlantNotification } from '../types';

export interface UseNotificationsState {
  notifications: PlantNotification[];
  unreadCount: number;
  loading: boolean;
}

export interface UseNotificationsActions {
  markAll: () => Promise<void>;
  clearAll: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useNotifications(
  userId: string | null
): UseNotificationsState & UseNotificationsActions {
  const [notifications, setNotifications] = useState<PlantNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchNotifications(userId);
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial load + real-time subscription
  useEffect(() => {
    if (!userId) return;

    void load();

    // Subscribe to new notifications via Supabase Realtime
    unsubscribeRef.current = subscribeToNotifications(userId, (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });

    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, [userId, load]);

  const markAll = useCallback(async () => {
    if (!userId) return;
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllRead(userId);
    } catch (err) {
      console.error('Failed to mark all read:', err);
      void load(); // revert
    }
  }, [userId, load]);

  const clearAll = useCallback(async () => {
    if (!userId) return;
    const backup = [...notifications];
    // Optimistic update
    setNotifications([]);
    try {
      await clearAllNotifications(userId);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
      setNotifications(backup); // revert
    }
  }, [userId, notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAll,
    clearAll,
    refetch: load,
  };
}
