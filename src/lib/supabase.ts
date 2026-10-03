import { createClient } from '@supabase/supabase-js';

// ─── Environment variables (Vite exposes VITE_* vars to the client) ──────────
// Uses the Supabase publishable key format (sb_publishable_...).
// This is the recommended client-side key for browser applications.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!supabaseUrl || !supabasePublishableKey) {
  console.error(
    '[Flora] Missing Supabase credentials.\n' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file.'
  );
}

// ─── Typed Database Schema ────────────────────────────────────────────────────
export interface DbProfile {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
  plants_count: number;
  created_at: string;
  updated_at: string;
}

export interface DbPlant {
  id: string;
  name: string;
  scientific_name: string;
  category: 'Flowers' | 'Leaf Plant' | 'Succulents' | 'Trees';
  sub_type: 'Perennials' | 'Annuals' | 'Bulbs' | 'Indoor' | 'Outdoor' | null;
  image_url: string | null;
  sunlight: string;
  water: string;
  fertilizing: string;
  description: string;
  created_at: string;
}

export interface DbDisease {
  id: string;
  name: string;
  common_name: string;
  image_url: string | null;
  severity: 'High' | 'Medium' | 'Low';
  spread_rate: 'Rapid' | 'Moderate' | 'Slow';
  affected_area: string;
  description: string;
  secondary_desc: string | null;
  urgency: string | null;
  tags: string[] | null;
  causes: Array<{ title: string; subtitle: string; icon: string }>;
  treatment_steps: Array<{ step: number; title: string; description: string }>;
  created_at: string;
}

export interface DbFavorite {
  id: string;
  user_id: string;
  plant_id: string;
  created_at: string;
}

export interface DbCareTask {
  id: string;
  user_id: string;
  plant_name: string;
  task_type: 'Water' | 'Fertilize' | 'Prune' | 'Mist';
  due_date: string;    // ISO date string 'YYYY-MM-DD'
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'alert' | 'care' | 'system' | 'warning';
  read: boolean;
  created_at: string;
}

export interface DbScanHistory {
  id: string;
  user_id: string;
  image_url: string | null;
  disease_id: string | null;
  disease_snapshot: Record<string, unknown> | null;
  confidence_score: number | null;
  notes: string | null;
  created_at: string;
}

export interface DbContentTranslation {
  id: string;
  entity_type: 'plant' | 'disease';
  entity_id: string;
  field_name: string;
  source_language: string;
  target_language: string;
  source_text: string;
  translated_text: string;
  created_at: string;
  updated_at: string;
}

// ─── Database type map for createClient generic ───────────────────────────────
export interface Database {
  public: {
    Tables: {
      profiles:             { Row: DbProfile;             Insert: Partial<DbProfile>;             Update: Partial<DbProfile> };
      plants:               { Row: DbPlant;               Insert: Partial<DbPlant>;               Update: Partial<DbPlant> };
      diseases:             { Row: DbDisease;             Insert: Partial<DbDisease>;             Update: Partial<DbDisease> };
      favorites:            { Row: DbFavorite;            Insert: Partial<DbFavorite>;            Update: Partial<DbFavorite> };
      care_tasks:           { Row: DbCareTask;            Insert: Partial<DbCareTask>;            Update: Partial<DbCareTask> };
      notifications:        { Row: DbNotification;        Insert: Partial<DbNotification>;        Update: Partial<DbNotification> };
      scan_history:         { Row: DbScanHistory;         Insert: Partial<DbScanHistory>;         Update: Partial<DbScanHistory> };
      content_translations: { Row: DbContentTranslation; Insert: Partial<DbContentTranslation>;  Update: Partial<DbContentTranslation> };
    };
    Functions: {
      // RPC defined in supabase/migrations/003_fixes.sql
      increment_plants_count: {
        Args: { uid: string };
        Returns: undefined;
      };
    };
  };
}

// ─── Singleton Supabase client ────────────────────────────────────────────────
export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,   // handles OAuth redirect
  },
});

// ─── Convenience helper: get current user ID (async, Supabase v2 API) ────────
export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}
