# Flora – Backend Setup Guide

## Overview

Flora uses **Supabase** as its complete backend, providing:

| Feature | Supabase Service |
|---|---|
| User authentication (email + Google OAuth) | Supabase Auth |
| Plant & disease catalog | Supabase Database (PostgreSQL) |
| Per-user care schedule | Supabase Database + RLS |
| Per-user notifications (real-time) | Supabase Database + Realtime |
| Favorites | Supabase Database + RLS |
| Scan history | Supabase Database + RLS |
| Avatar & scan image storage | Supabase Storage |
| AI plant disease diagnosis | Supabase Edge Function → Gemini 2.0 Flash |

All resources used are on the **free tier**.

---

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New Project**, choose a name (e.g. `Flora`), set a strong DB password, and pick a region.
3. Wait ~2 minutes for provisioning.

---

## 2. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env
```

Fill in `.env` with values from your Supabase dashboard:

| Variable | Where to find it |
|---|---|
| `VITE_SUPABASE_URL` | Project Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Project Settings → API → anon / publishable key |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `VITE_APP_URL` | `http://localhost:3000` for local dev, your deployed URL for production |

> `GEMINI_API_KEY` is used **server-side only** (Supabase Edge Function). Never put it in a `VITE_` prefixed variable.

> **Note on key format:** Newer Supabase projects use a `sb_publishable_...` format for the anon/publishable key. This is correct — use it as-is in `VITE_SUPABASE_PUBLISHABLE_KEY`. The legacy env-var name `VITE_SUPABASE_ANON_KEY` is still accepted as a fallback.

---

## 3. Run the Database Migrations

In the Supabase dashboard → **SQL Editor**, run the migration files in order:

**Step 1:** Paste and run `supabase/migrations/001_initial_schema.sql`  
Creates all tables, triggers, and seeds the plant + disease catalog.

**Step 2:** Paste and run `supabase/migrations/002_storage_and_rls.sql`  
Creates storage buckets and all Row-Level Security policies.

**Step 3:** Paste and run `supabase/migrations/003_fixes.sql`  
Backfills any profiles missing from the trigger, adds `increment_plants_count` RPC.

**Step 4:** Paste and run `supabase/migrations/004_notifications_rls_fix.sql`  
Fixes the notifications INSERT RLS policy to be scoped to the authenticated user.

---

## 4. Enable Google OAuth (Optional)

1. Supabase Dashboard → **Authentication** → **Providers** → **Google** → Enable
2. Create a Google OAuth app at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
3. Set Authorized redirect URIs to: `https://<your-project>.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret into the Supabase Google provider settings.

---

## 5. Deploy the Edge Function

Install the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
# Log in
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Set the Gemini API key as a secret (never committed to git)
supabase secrets set GEMINI_API_KEY=<your-gemini-key>

# Deploy the function
npm run supabase:functions:deploy
# or manually:
supabase functions deploy diagnose-plant --no-verify-jwt
```

The function is deployed to:
```
https://<your-project>.supabase.co/functions/v1/diagnose-plant
```

> **Without the Edge Function deployed**, the app falls back to a client-side Gemini call (requires `VITE_GEMINI_API_KEY` in `.env`, not recommended for production).

---

## 6. Enable Realtime

Supabase Dashboard → **Database** → **Replication** → ensure `notifications` and `care_tasks` tables are enabled for the `supabase_realtime` publication (the migration SQL does this automatically, but verify it's active).

---

## 7. Install Dependencies & Run

```bash
npm install
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000)

---

## Architecture

```
src/
├── lib/                    ← Backend service layer
│   ├── supabase.ts         ← Typed Supabase client singleton
│   ├── auth.ts             ← signIn / signUp / Google OAuth / signOut
│   ├── plants.ts           ← Plant CRUD + favorites
│   ├── diagnosis.ts        ← AI diagnosis (Edge Function + fallback)
│   ├── careTasks.ts        ← Care schedule CRUD
│   ├── notifications.ts    ← Notifications CRUD + real-time subscribe
│   ├── profile.ts          ← Profile read/update/avatar
│   └── storage.ts          ← Image upload (avatars + plant scans)
├── hooks/                  ← React state management
│   ├── useAuth.ts          ← Session, profile, auth actions
│   ├── usePlants.ts        ← Plants + favorites with optimistic updates
│   └── useNotifications.ts ← Notifications + real-time push
supabase/
├── migrations/
│   ├── 001_initial_schema.sql   ← Tables + triggers + seed data
│   └── 002_storage_and_rls.sql  ← Buckets + RLS policies
└── functions/
    └── diagnose-plant/
        └── index.ts        ← Gemini Vision Edge Function (Deno)
```

---

## Database Schema

```
profiles        → extends auth.users (name, role, avatar_url, plants_count)
plants          → global catalog (seeded with 5 plants)
diseases        → global knowledge base (seeded with 4 diseases)
favorites       → user_id + plant_id (unique per user)
care_tasks      → user_id + plant_name + task_type + due_date + completed
notifications   → user_id + title + message + type + read
scan_history    → user_id + image_url + disease_id + confidence_score
```

All user-owned tables use **Row-Level Security** — users can only read/write their own rows.

---

## Free Tier Limits (Supabase)

| Resource | Free Limit |
|---|---|
| Database | 500 MB |
| Storage | 1 GB |
| Edge Function invocations | 500,000/month |
| Realtime connections | 200 concurrent |
| Auth users | Unlimited |

More than sufficient for development and small-scale production.
