import { supabase, DbNotification } from './supabase';
import { PlantNotification } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ─── DB row → frontend type ───────────────────────────────────────────────────
function toNotification(row: DbNotification): PlantNotification {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    time: formatTimeAgo(row.created_at),
    read: row.read,
    type: row.type,
  };
}

function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Fetch all notifications for a user ──────────────────────────────────────
export async function fetchNotifications(userId: string): Promise<PlantNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toNotification(row as DbNotification));
}

// ─── Mark all notifications as read ──────────────────────────────────────────
export async function markAllRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw new Error(error.message);
}

// ─── Mark a single notification as read ──────────────────────────────────────
export async function markOneRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) throw new Error(error.message);
}

// ─── Clear (delete) all notifications for a user ─────────────────────────────
export async function clearAllNotifications(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

// ─── Add a notification (used internally / by Edge Functions) ────────────────
export async function addNotification(
  userId: string,
  title: string,
  message: string,
  type: PlantNotification['type'] = 'system'
): Promise<PlantNotification> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, title, message, type, read: false })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toNotification(data as DbNotification);
}

// ─── Seed default notifications for new users ─────────────────────────────────
export async function seedDefaultNotifications(userId: string): Promise<void> {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if ((count ?? 0) > 0) return;

  const defaults: Array<{ title: string; message: string; type: PlantNotification['type'] }> = [
    {
      title: 'Welcome to FloraVeda!',
      message: 'Start by scanning a plant leaf to detect diseases or browse the plant catalog.',
      type: 'system',
    },
    {
      title: 'Watering Reminder',
      message: 'Your Monstera Deliciosa is due for watering today.',
      type: 'care',
    },
    {
      title: 'Weekly Garden Health',
      message: 'Your garden health score is 100%. Keep up the great work!',
      type: 'alert',
    },
  ];

  for (const n of defaults) {
    await addNotification(userId, n.title, n.message, n.type);
  }
}

// ─── Real-time subscription ───────────────────────────────────────────────────
// Returns an unsubscribe function. Call it on component unmount.
export function subscribeToNotifications(
  userId: string,
  onNew: (notification: PlantNotification) => void
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new as DbNotification;
        onNew(toNotification(row));
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
