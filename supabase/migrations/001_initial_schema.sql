-- ============================================================
-- Flora – Initial Database Schema
-- Run this in: Supabase → SQL Editor → New Query → Run
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────────────────────────
-- 1. PROFILES
--    Extends Supabase auth.users with app-specific fields.
-- ──────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  name            text not null default '',
  role            text not null default 'Plant Enthusiast',
  avatar_url      text,
  plants_count    integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at on any profile change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ──────────────────────────────────────────────────────────────
-- 2. PLANTS  (global catalog – not per-user)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.plants (
  id              text primary key,                -- slug e.g. 'rosa-peace'
  name            text not null,
  scientific_name text not null default '',
  category        text not null check (category in ('Flowers','Leaf Plant','Succulents','Trees')),
  sub_type        text check (sub_type in ('Perennials','Annuals','Bulbs','Indoor','Outdoor')),
  image_url       text,
  sunlight        text not null default '',
  water           text not null default '',
  fertilizing     text not null default '',
  description     text not null default '',
  created_at      timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────
-- 3. DISEASES  (global knowledge base)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.diseases (
  id                  text primary key,            -- slug e.g. 'chlorosis'
  name                text not null,
  common_name         text not null default '',
  image_url           text,
  severity            text not null check (severity in ('High','Medium','Low')),
  spread_rate         text not null check (spread_rate in ('Rapid','Moderate','Slow')),
  affected_area       text not null default '',
  description         text not null default '',
  secondary_desc      text,
  urgency             text,
  tags                text[],
  causes              jsonb not null default '[]',  -- [{title,subtitle,icon}]
  treatment_steps     jsonb not null default '[]',  -- [{step,title,description}]
  created_at          timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────
-- 4. FAVORITES  (per-user plant bookmarks)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  plant_id    text not null references public.plants(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, plant_id)
);

-- ──────────────────────────────────────────────────────────────
-- 5. CARE_TASKS  (per-user plant care schedule)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.care_tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  plant_name  text not null,
  task_type   text not null check (task_type in ('Water','Fertilize','Prune','Mist')),
  due_date    date not null default current_date,
  completed   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger care_tasks_updated_at
  before update on public.care_tasks
  for each row execute procedure public.set_updated_at();

-- ──────────────────────────────────────────────────────────────
-- 6. NOTIFICATIONS  (per-user)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  message     text not null,
  type        text not null check (type in ('alert','care','system','warning')) default 'system',
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────
-- 7. SCAN_HISTORY  (per-user diagnosis log)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.scan_history (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  image_url         text,                          -- stored in Supabase Storage
  disease_id        text references public.diseases(id) on delete set null,
  disease_snapshot  jsonb,                         -- full disease object at scan time
  confidence_score  integer check (confidence_score between 0 and 100),
  notes             text,
  created_at        timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────
-- 8. SEED – Plants catalog (mirrors src/data/plantData.ts)
-- ──────────────────────────────────────────────────────────────
insert into public.plants (id, name, scientific_name, category, sub_type, image_url, sunlight, water, fertilizing, description)
values
  (
    'gladiolus-tristis',
    'Gladiolus tristis',
    'Gladiolus tristis',
    'Flowers', 'Bulbs',
    'https://images.unsplash.com/photo-1567748157439-651aca2ff064?w=800',
    'Full Sun (6+ hrs)',
    'Moderate (weekly)',
    'Monthly in growing season',
    'A fragrant, cream-colored gladiolus native to South Africa. Known for its sweet nocturnal scent and elegant, slender blooms that open toward evening. Ideal for borders and cutting gardens.'
  ),
  (
    'rosa-peace',
    'Rosa ''Peace''',
    'Rosa × hybrida ''Peace''',
    'Flowers', 'Perennials',
    'https://images.unsplash.com/photo-1490750967868-88df5691b3ae?w=800',
    'Full Sun (6+ hrs)',
    'Regular (2–3x/week)',
    'Every 4–6 weeks',
    'One of the most celebrated roses in history, the Peace rose features large, creamy-yellow blooms with pink-tinged edges. It is prized for its vigorous growth, disease resistance, and captivating fragrance.'
  ),
  (
    'delphinium-elatum',
    'Delphinium elatum',
    'Delphinium elatum',
    'Flowers', 'Perennials',
    'https://images.unsplash.com/photo-1591113837852-c5791e3f645f?w=800',
    'Full Sun (6+ hrs)',
    'Regular (2–3x/week)',
    'Monthly with high-nitrogen fertilizer',
    'Tall, stately spikes of vivid blue to violet flowers make this a classic cottage-garden staple. Delphinium elatum blooms in early to mid-summer and pairs beautifully with roses and peonies.'
  ),
  (
    'monstera-deliciosa',
    'Monstera Deliciosa',
    'Monstera deliciosa',
    'Leaf Plant', 'Indoor',
    'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800',
    'Indirect bright light',
    'Weekly (allow soil to dry)',
    'Monthly in spring/summer',
    'The Swiss Cheese Plant is beloved for its dramatic, fenestrated leaves. A fast-growing tropical vine, it thrives in indirect bright light and adds a bold, lush presence to any interior space.'
  ),
  (
    'sansevieria-trifasciata',
    'Snake Plant',
    'Dracaena trifasciata',
    'Succulents', 'Indoor',
    'https://images.unsplash.com/photo-1599598425947-5202edd56bdb?w=800',
    'Low to bright indirect',
    'Every 2–6 weeks',
    'Twice a year',
    'One of the hardiest houseplants available, the Snake Plant tolerates neglect, low light, and irregular watering. Its upright, sword-like leaves with yellow edges are architecturally striking.'
  )
on conflict (id) do nothing;

-- ──────────────────────────────────────────────────────────────
-- 9. SEED – Diseases knowledge base
-- ──────────────────────────────────────────────────────────────
insert into public.diseases (id, name, common_name, image_url, severity, spread_rate, affected_area, description, secondary_desc, urgency, tags, causes, treatment_steps)
values
  (
    'chlorosis',
    'Chlorosis',
    'Iron/Nutrient Deficiency',
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800',
    'High', 'Moderate',
    'Leaves (interveinal yellowing)',
    'Chlorosis is a condition where leaves produce insufficient chlorophyll, resulting in yellowing between the veins while veins remain green. Most commonly caused by iron, manganese, or nitrogen deficiency.',
    'If left untreated, chlorosis weakens the plant, reduces photosynthesis, and can lead to leaf drop and dieback. Early intervention with the correct nutrient amendment resolves most cases within 2–4 weeks.',
    'Treat within 1 week',
    ARRAY['nutrient-deficiency','yellowing','iron','soil-pH'],
    '[
      {"title":"Nutrient Deficiency","subtitle":"Insufficient iron, manganese, or nitrogen in the soil","icon":"science"},
      {"title":"High Soil pH","subtitle":"Alkaline soil locks out iron and micronutrients","icon":"science"},
      {"title":"Overwatering","subtitle":"Waterlogged roots cannot absorb nutrients","icon":"water_drop"},
      {"title":"Root Damage","subtitle":"Compacted soil or root-bound pot restricts uptake","icon":"bug_report"}
    ]'::jsonb,
    '[
      {"step":1,"title":"Test Soil pH","description":"Use a pH meter or test kit. Ideal range is 6.0–6.5 for most plants. If above 7.0, acidify with sulfur or acidifying fertilizer."},
      {"step":2,"title":"Apply Chelated Iron","description":"Use a chelated iron (EDTA or EDDHA) foliar spray or soil drench. Follow label rates. Reapply every 7–10 days until new growth is green."},
      {"step":3,"title":"Adjust Watering","description":"Ensure soil drains well between waterings. Allow top 2 cm of soil to dry before rewatering to prevent root suffocation."}
    ]'::jsonb
  ),
  (
    'wilting',
    'Wilting Leaves',
    'Plant Wilt Syndrome',
    'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800',
    'Medium', 'Moderate',
    'Entire plant, stems and leaves',
    'Wilting occurs when a plant cannot maintain turgor pressure in its cells, causing stems and leaves to droop. It can be caused by both underwatering and overwatering, as well as heat stress or root problems.',
    'Temporary wilting in midday heat is normal. Persistent wilting regardless of watering is a warning sign of root rot, vascular disease, or severe dehydration that needs immediate diagnosis.',
    'Assess within 24 hours',
    ARRAY['wilting','water-stress','root-rot','heat-stress'],
    '[
      {"title":"Underwatering","subtitle":"Insufficient moisture causes cell dehydration","icon":"water_drop"},
      {"title":"Overwatering / Root Rot","subtitle":"Saturated soil kills roots, blocking water uptake","icon":"water_drop"},
      {"title":"Heat Stress","subtitle":"Extreme temperatures increase transpiration rate","icon":"thermostat"},
      {"title":"Root Damage","subtitle":"Pests, compaction, or disease compromise root function","icon":"bug_report"}
    ]'::jsonb,
    '[
      {"step":1,"title":"Check Soil Moisture","description":"Insert a finger 5 cm into soil. If dry, water deeply. If wet, stop watering and investigate root health."},
      {"step":2,"title":"Inspect Roots","description":"Gently remove plant from pot. Healthy roots are white/tan and firm. Brown, mushy roots indicate rot — trim away and repot in fresh, well-draining mix."},
      {"step":3,"title":"Provide Shade & Humidity","description":"Move plant out of direct afternoon sun. Mist leaves or place a pebble tray with water nearby to raise ambient humidity."}
    ]'::jsonb
  ),
  (
    'rust',
    'Rust',
    'Fungal Rust Disease',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    'High', 'Rapid',
    'Leaf undersides, stems',
    'Rust is a group of fungal diseases causing orange, yellow, or brown powdery pustules primarily on leaf undersides. Highly contagious, it spreads via wind-borne spores and thrives in humid, cool conditions.',
    'Rust spreads rapidly in wet weather. Remove and bag all infected material immediately. Do not compost infected leaves. Treat remaining foliage promptly to prevent defoliation.',
    'Treat immediately',
    ARRAY['fungal','rust','spores','contagious'],
    '[
      {"title":"Fungal Spores","subtitle":"Puccinia and related fungi spread via wind and water splash","icon":"bug_report"},
      {"title":"High Humidity","subtitle":"Moisture on leaves for 6+ hours enables spore germination","icon":"water_drop"},
      {"title":"Poor Air Circulation","subtitle":"Dense planting prevents drying of leaf surfaces","icon":"wind"},
      {"title":"Infected Debris","subtitle":"Overwintering spores in fallen leaves re-infect in spring","icon":"science"}
    ]'::jsonb,
    '[
      {"step":1,"title":"Remove Infected Leaves","description":"Cut and bag all visibly infected leaves and stems. Disinfect pruning tools with 70% isopropyl alcohol between cuts. Do not compost."},
      {"step":2,"title":"Apply Fungicide","description":"Spray remaining foliage with a sulfur-based or neem oil fungicide, covering both upper and lower leaf surfaces. Repeat every 7–14 days."},
      {"step":3,"title":"Improve Air Flow","description":"Thin surrounding foliage and space plants to improve air circulation. Water at the base in the morning, avoiding wetting leaves."}
    ]'::jsonb
  ),
  (
    'powdery-mildew',
    'Powdery Mildew',
    'White Powder Disease',
    'https://images.unsplash.com/photo-1471086569966-db3eebc25a59?w=800',
    'Medium', 'Moderate',
    'Leaf surfaces, young shoots',
    'Powdery mildew appears as a white or grey powdery coating on leaf surfaces, shoots, and sometimes flowers. Caused by various species of obligate fungal parasites, it reduces photosynthesis and weakens the plant.',
    'Unlike most fungal diseases, powdery mildew thrives in warm, dry conditions with high humidity — not wet leaves. It typically does not kill the plant but severely reduces vigour and yield.',
    'Treat within 3 days',
    ARRAY['fungal','powdery-mildew','white-coating','common'],
    '[
      {"title":"Fungal Infection","subtitle":"Erysiphe and related fungi colonise leaf surfaces","icon":"bug_report"},
      {"title":"Warm, Dry Periods","subtitle":"Optimal conditions: 20–27°C with high humidity","icon":"thermostat"},
      {"title":"Overcrowding","subtitle":"Poor ventilation encourages fungal spread","icon":"wind"},
      {"title":"Stressed Plants","subtitle":"Over-fertilizing with nitrogen promotes susceptible new growth","icon":"science"}
    ]'::jsonb,
    '[
      {"step":1,"title":"Remove Affected Parts","description":"Prune heavily infected leaves and young shoots. Dispose of them in sealed bags — not compost. This reduces spore load immediately."},
      {"step":2,"title":"Apply Baking Soda Spray","description":"Mix 1 tsp baking soda + 1 tsp neem oil + 1 L water. Spray all surfaces weekly. For severe cases, use a potassium bicarbonate fungicide."},
      {"step":3,"title":"Increase Air Circulation","description":"Space plants appropriately and prune interior branches. Avoid overhead watering. Apply a balanced fertilizer — excess nitrogen encourages rapid, susceptible new growth."}
    ]'::jsonb
  )
on conflict (id) do nothing;
