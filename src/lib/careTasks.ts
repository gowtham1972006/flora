import { supabase, DbCareTask } from './supabase';
import { CareTask } from '../types';

// ─── DB row → frontend type ───────────────────────────────────────────────────
function toCareTask(row: DbCareTask): CareTask {
  return {
    id: row.id,
    plantName: row.plant_name,
    taskType: row.task_type,
    dueDate: formatDueDate(row.due_date),
    completed: row.completed,
  };
}

// ─── Format a 'YYYY-MM-DD' DB date into a human-readable label ───────────────
function formatDueDate(isoDate: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(isoDate + 'T00:00:00');
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 6) {
    return due.toLocaleDateString('en-US', { weekday: 'long' });
  }
  return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── ISO date string for a day offset from today ─────────────────────────────
function dateOffsetISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ─── Fetch all care tasks for a user ─────────────────────────────────────────
export async function fetchCareTasks(userId: string): Promise<CareTask[]> {
  const { data, error } = await supabase
    .from('care_tasks')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toCareTask(row as DbCareTask));
}

// ─── Add a new care task ──────────────────────────────────────────────────────
export async function addCareTask(
  userId: string,
  plantName: string,
  taskType: CareTask['taskType'],
  dueDateOffset = 0   // days from today; 0 = today
): Promise<CareTask> {
  const { data, error } = await supabase
    .from('care_tasks')
    .insert({
      user_id: userId,
      plant_name: plantName,
      task_type: taskType,
      due_date: dateOffsetISO(dueDateOffset),
      completed: false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toCareTask(data as DbCareTask);
}

// ─── Toggle task completion ───────────────────────────────────────────────────
export async function toggleCareTask(
  taskId: string,
  completed: boolean
): Promise<void> {
  const { error } = await supabase
    .from('care_tasks')
    .update({ completed })
    .eq('id', taskId);

  if (error) throw new Error(error.message);
}

// ─── Delete a care task ───────────────────────────────────────────────────────
export async function deleteCareTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('care_tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw new Error(error.message);
}

// ─── Seed default care tasks for a brand-new user ────────────────────────────
// Called once after the user's first successful login.
export async function seedDefaultCareTasks(userId: string): Promise<void> {
  const defaults: Array<{ plantName: string; taskType: CareTask['taskType']; offset: number }> = [
    { plantName: 'Monstera Deliciosa', taskType: 'Water',     offset: 0 },
    { plantName: 'Gladiolus tristis',  taskType: 'Fertilize', offset: 1 },
    { plantName: "Rosa 'Peace'",       taskType: 'Mist',      offset: 3 },
    { plantName: 'Snake Plant',        taskType: 'Water',     offset: 4 },
  ];

  // Only seed if user has no tasks yet
  const { count } = await supabase
    .from('care_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if ((count ?? 0) > 0) return;

  for (const t of defaults) {
    await addCareTask(userId, t.plantName, t.taskType, t.offset);
  }
}
