// Supabase Edge Function: translate-content  (HARDENED — safe for verify_jwt=false)
// Translates plant/disease content fields via Gemini, with PostgreSQL cache.
//
// SECURITY MODEL:
//   This function is intentionally public (verify_jwt=false) because plant and
//   disease content is itself public catalog data (RLS: using (true)).
//   The function is hardened against abuse by:
//     - Strict allowlist validation of entityType, entityId format, field names
//     - Per-request field count and total character limits
//     - Per-field character limit (prevent single oversized field)
//     - entityId format enforcement (lowercase slugs only)
//     - No secrets echoed in any response or log
//     - POST-only (OPTIONS handled for CORS, all others rejected)
//     - Service-role key used only inside Deno — never returned to client
//
// Deploy with:
//   supabase functions deploy translate-content --no-verify-jwt
//
// Required secrets:
//   supabase secrets set GEMINI_API_KEY=<your-key>
//   (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Constants ────────────────────────────────────────────────────────────────

// gemini-2.0-flash was deprecated; gemini-3.6-flash is the current recommended model.
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent';

const SUPPORTED_TARGET_LANGS = ['ta', 'hi', 'fr', 'es'] as const;
type TargetLang = typeof SUPPORTED_TARGET_LANGS[number];

const LANG_NAMES: Record<TargetLang, string> = {
  ta: 'Tamil',
  hi: 'Hindi',
  fr: 'French',
  es: 'Spanish',
};

// ── Limits ─────────────────────────────────────────────────────────────────────
const MAX_TOTAL_CHARS   = 8_000;  // Tighter than before (was 10,000)
const MAX_PER_FIELD     = 3_000;  // Max chars for any single field value
const MAX_FIELD_COUNT   = 20;     // Max number of fields per request
const MAX_ENTITY_ID_LEN = 100;    // Max slug length

// ── Allowlisted field names ────────────────────────────────────────────────────
// Only fields that Flora actually sends may be translated.
// Prevents an attacker from probing arbitrary field names or injecting
// unexpected keys into the Gemini prompt or cache.
const ALLOWED_FIELDS_BY_TYPE: Record<'plant' | 'disease', ReadonlySet<string>> = {
  plant: new Set([
    'name',
    'description',
    'sunlight',
    'water',
    'fertilizing',
  ]),
  disease: new Set([
    'name',
    'commonName',
    'description',
    'secondaryDescription',
    'affectedArea',
    'urgency',
    // Cause array fields: cause_0_title … cause_9_subtitle
    ...Array.from({ length: 10 }, (_, i) => [`cause_${i}_title`, `cause_${i}_subtitle`]).flat(),
    // Treatment step fields: step_0_title … step_9_description
    ...Array.from({ length: 10 }, (_, i) => [`step_${i}_title`, `step_${i}_description`]).flat(),
  ]),
};

// ─── CORS headers ─────────────────────────────────────────────────────────────
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface RequestBody {
  entityType: 'plant' | 'disease';
  entityId: string;
  targetLanguage: string;
  fields: Record<string, string>;
}

interface CachedRow {
  field_name: string;
  source_text: string;
  translated_text: string;
}

// ─── Validation helpers ───────────────────────────────────────────────────────

/** entityId must be a lowercase slug: letters, digits, hyphens. Min 2 chars. */
function isValidEntityId(id: string): boolean {
  return (
    typeof id === 'string' &&
    id.length >= 2 &&
    id.length <= MAX_ENTITY_ID_LEN &&
    /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(id)
  );
}

// ─── Main handler ─────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  // ── CORS preflight ───────────────────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // ── Only accept POST ─────────────────────────────────────────────────────────
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    // ── Secrets — read once, never echoed ────────────────────────────────────
    const geminiKey      = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl    = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!geminiKey || !supabaseUrl || !serviceRoleKey) {
      console.error('[translate-content] One or more required secrets are not set');
      return json({ error: 'Server configuration error' }, 503);
    }

    // ── Parse body — guard against non-JSON payloads ─────────────────────────
    let body: RequestBody;
    try {
      body = await req.json() as RequestBody;
    } catch {
      return json({ error: 'Request body must be valid JSON' }, 400);
    }

    const { entityType, entityId, targetLanguage, fields } = body;

    // ── Validate entityType ──────────────────────────────────────────────────
    if (entityType !== 'plant' && entityType !== 'disease') {
      return json({ error: 'entityType must be "plant" or "disease"' }, 400);
    }

    // ── Validate entityId ────────────────────────────────────────────────────
    if (!isValidEntityId(entityId)) {
      return json({ error: 'entityId must be a lowercase alphanumeric slug (hyphens allowed, 2-100 chars)' }, 400);
    }

    // ── Validate targetLanguage ──────────────────────────────────────────────
    if (!SUPPORTED_TARGET_LANGS.includes(targetLanguage as TargetLang)) {
      return json({ error: `targetLanguage must be one of: ${SUPPORTED_TARGET_LANGS.join(', ')}` }, 400);
    }

    // ── Validate fields shape ────────────────────────────────────────────────
    if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
      return json({ error: 'fields must be a non-empty object' }, 400);
    }
    if (Object.keys(fields).length === 0) {
      return json({ error: 'fields must be a non-empty object' }, 400);
    }

    // ── Reject excess field count ────────────────────────────────────────────
    if (Object.keys(fields).length > MAX_FIELD_COUNT) {
      return json({ error: `Too many fields (max ${MAX_FIELD_COUNT})` }, 400);
    }

    // ── Allowlist + normalise field values ────────────────────────────────────
    const allowedFields = ALLOWED_FIELDS_BY_TYPE[entityType];
    const filteredFields: Record<string, string> = {};
    const rejectedKeys: string[] = [];

    for (const [k, v] of Object.entries(fields)) {
      if (!allowedFields.has(k)) { rejectedKeys.push(k); continue; }
      if (typeof v !== 'string') continue;
      const trimmed = v.trim();
      if (trimmed.length === 0) continue;
      if (trimmed.length > MAX_PER_FIELD) {
        return json({ error: `Field "${k}" exceeds maximum length of ${MAX_PER_FIELD} characters` }, 400);
      }
      filteredFields[k] = trimmed;
    }

    if (rejectedKeys.length > 0) {
      console.warn('[translate-content] Rejected unknown field names:', rejectedKeys.join(', '));
    }
    if (Object.keys(filteredFields).length === 0) {
      return json({ translations: {} }, 200);
    }

    // ── Enforce total payload size ────────────────────────────────────────────
    const totalChars = Object.values(filteredFields).reduce((s, v) => s + v.length, 0);
    if (totalChars > MAX_TOTAL_CHARS) {
      return json({ error: `Total input exceeds ${MAX_TOTAL_CHARS} characters` }, 400);
    }

    const lang = targetLanguage as TargetLang;

    // ── Supabase service-role client (cache r/w) ──────────────────────────────
    const db = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // ── Check DB translation cache ────────────────────────────────────────────
    const fieldNames = Object.keys(filteredFields);
    const { data: cachedRows } = await db
      .from('content_translations')
      .select('field_name, source_text, translated_text')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('source_language', 'en')
      .eq('target_language', lang)
      .in('field_name', fieldNames);

    const cached = (cachedRows ?? []) as CachedRow[];
    const cachedByField: Record<string, CachedRow> = {};
    for (const row of cached) { cachedByField[row.field_name] = row; }

    // Cache HITs: row exists AND source_text still matches (stale-detection)
    const hitMap: Record<string, string> = {};
    for (const fieldName of fieldNames) {
      const row = cachedByField[fieldName];
      if (row && row.source_text === filteredFields[fieldName]) {
        hitMap[fieldName] = row.translated_text;
      }
    }

    // Fields still needing a fresh Gemini translation
    const missingFields: Record<string, string> = {};
    for (const fieldName of fieldNames) {
      if (!(fieldName in hitMap)) missingFields[fieldName] = filteredFields[fieldName];
    }

    const translatedMap: Record<string, string> = { ...hitMap };

    // ── Call Gemini only for cache misses ─────────────────────────────────────
    if (Object.keys(missingFields).length > 0) {
      const langName = LANG_NAMES[lang];

      const prompt =
        `You are a professional botanical translator. Translate the JSON values below to ${langName}.\n` +
        `\nRules:\n` +
        `- Return ONLY a valid JSON object with the same keys as the input.\n` +
        `- Translate only the values, never the keys.\n` +
        `- Do NOT translate scientific/Latin species names (e.g. "Rosa × hybrida", "Monstera deliciosa").\n` +
        `- Preserve botanical terminology accuracy.\n` +
        `- Preserve formatting (line breaks, bullet lists if present).\n` +
        `- If a value is very short (1-3 words like "Full Sun", "Moderate"), translate it naturally.\n` +
        `- Do not add any explanation or text outside the JSON.\n` +
        `\nInput JSON:\n` +
        `${JSON.stringify(missingFields, null, 2)}\n` +
        `\nOutput (${langName} JSON only):`;

      const geminiPayload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
        },
      };

      const geminiRes = await fetch(`${GEMINI_API_URL}?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiPayload),
      });

      if (!geminiRes.ok) {
        const status = geminiRes.status;
        console.error(`[translate-content] Gemini API returned HTTP ${status}`);
        for (const [k, v] of Object.entries(missingFields)) {
          translatedMap[k] = v;
        }
      } else {
        const geminiData = await geminiRes.json() as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };

        const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
          console.error('[translate-content] Gemini response contained no JSON block');
          for (const [k, v] of Object.entries(missingFields)) {
            translatedMap[k] = v;
          }
        } else {
          let parsed: Record<string, string> = {};
          try {
            parsed = JSON.parse(jsonMatch[0]) as Record<string, string>;
          } catch {
            console.error('[translate-content] Failed to parse Gemini JSON response');
            for (const [k, v] of Object.entries(missingFields)) {
              translatedMap[k] = v;
            }
          }

          const cacheUpserts: Array<{
            entity_type: string;
            entity_id: string;
            field_name: string;
            source_language: string;
            target_language: string;
            source_text: string;
            translated_text: string;
          }> = [];

          for (const [fieldName, sourceText] of Object.entries(missingFields)) {
            const translated = parsed[fieldName];
            if (typeof translated === 'string' && translated.trim().length > 0) {
              translatedMap[fieldName] = translated;
              cacheUpserts.push({
                entity_type: entityType,
                entity_id: entityId,
                field_name: fieldName,
                source_language: 'en',
                target_language: lang,
                source_text: sourceText,
                translated_text: translated,
              });
            } else {
              translatedMap[fieldName] = sourceText;
            }
          }

          // Write cache in background — does not block response delivery
          if (cacheUpserts.length > 0) {
            db.from('content_translations')
              .upsert(cacheUpserts, {
                onConflict:
                  'entity_type,entity_id,field_name,source_language,target_language,source_text',
                ignoreDuplicates: false,
              })
              .then(({ error }) => {
                if (error) {
                  console.error('[translate-content] Cache write error:', error.message);
                }
              });
          }
        }
      }
    }

    return json({ translations: translatedMap }, 200);

  } catch (err) {
    console.error('[translate-content] Unhandled error:', (err as Error)?.message ?? err);
    return json({ error: 'Internal server error' }, 500);
  }
});

// ─── Response helper ──────────────────────────────────────────────────────────
function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}
