// ─── Flora Content Translation Service ───────────────────────────────────────
// Calls the translate-content Supabase Edge Function to translate
// database-driven content fields (plants, diseases) into the selected language.
//
// Design principles:
//  - English → returns source fields immediately (no network call)
//  - Empty/null fields are skipped
//  - On any failure, returns original source fields (graceful fallback)
//  - Never throws — callers always get a usable result

import { supabase } from './supabase';
import type { LangCode } from './i18n';

export interface TranslateContentRequest {
  entityType: 'plant' | 'disease';
  entityId: string;
  targetLanguage: LangCode;
  fields: Record<string, string | undefined | null>;
}

export interface TranslateContentResult {
  translations: Record<string, string>;
  /** true if the result came from the translation API; false if source/fallback */
  fromTranslation: boolean;
}

/**
 * Translate a set of content fields for one entity (plant or disease).
 *
 * - When targetLanguage === 'en': returns source fields unchanged, no request made.
 * - When translation fails: returns original source fields so the UI always has content.
 * - Fields with null/undefined/empty values are excluded from translation.
 */
export async function translateContent(
  req: TranslateContentRequest
): Promise<TranslateContentResult> {
  const { entityType, entityId, targetLanguage, fields } = req;

  // ── Normalize: filter out empty/null values ───────────────────────────────
  const cleanFields: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === 'string' && value.trim().length > 0) {
      cleanFields[key] = value;
    }
  }

  // ── No-op for English (source language) ───────────────────────────────────
  if (targetLanguage === 'en') {
    return { translations: cleanFields, fromTranslation: false };
  }

  // ── Nothing to translate ───────────────────────────────────────────────────
  if (Object.keys(cleanFields).length === 0) {
    return { translations: {}, fromTranslation: false };
  }

  // ── Call Edge Function ─────────────────────────────────────────────────────
  try {
    const { data, error } = await supabase.functions.invoke<{
      translations: Record<string, string>;
    }>('translate-content', {
      body: {
        entityType,
        entityId,
        targetLanguage,
        fields: cleanFields,
      },
    });

    if (error) {
      console.warn('[Flora] translate-content Edge Function error:', error.message);
      return { translations: cleanFields, fromTranslation: false };
    }

    if (!data?.translations || typeof data.translations !== 'object') {
      console.warn('[Flora] translate-content: unexpected response format');
      return { translations: cleanFields, fromTranslation: false };
    }

    // Merge: for any field the API didn't return, fall back to source text
    const merged: Record<string, string> = { ...cleanFields };
    for (const [key, value] of Object.entries(data.translations)) {
      if (typeof value === 'string' && value.trim().length > 0) {
        merged[key] = value;
      }
    }

    return { translations: merged, fromTranslation: true };
  } catch (err) {
    console.warn('[Flora] translate-content: network error:', (err as Error)?.message);
    return { translations: cleanFields, fromTranslation: false };
  }
}
