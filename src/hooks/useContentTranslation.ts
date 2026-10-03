// ─── useContentTranslation hook ──────────────────────────────────────────────
// Translates a set of entity fields reactively when the language changes.
//
// Features:
//  - In-memory session cache keyed by `entityId:lang` — no duplicate API calls
//  - Immediate result for English (source language) — no loading state
//  - Loading state while translation is in flight
//  - Falls back to original source fields on any error
//  - Safe useEffect dependencies — no infinite re-render loops

import { useState, useEffect, useRef } from 'react';
import type { LangCode } from '../lib/i18n';
import { translateContent } from '../lib/translateContent';

interface UseContentTranslationOptions {
  entityType: 'plant' | 'disease';
  entityId: string;
  /** Source-language field values (English). Pass null/undefined for fields to skip. */
  fields: Record<string, string | undefined | null>;
  lang: LangCode;
}

interface UseContentTranslationResult {
  /** Translated field values. Falls back to source values on error or while English. */
  translated: Record<string, string>;
  /** True while a translation request is in flight. */
  loading: boolean;
}

// ── Session-level in-memory cache ─────────────────────────────────────────────
// Key: `entityId:targetLang`  →  translated fields map
// Cleared on page reload — keeps memory usage bounded.
const sessionCache = new Map<string, Record<string, string>>();

/**
 * Normalise a fields object: remove null/undefined, trim strings.
 */
function normFields(
  fields: Record<string, string | undefined | null>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (typeof v === 'string' && v.trim()) out[k] = v.trim();
  }
  return out;
}

export function useContentTranslation({
  entityType,
  entityId,
  fields,
  lang,
}: UseContentTranslationOptions): UseContentTranslationResult {
  const sourceFields = normFields(fields);
  const cacheKey = `${entityId}:${lang}`;

  // Initialize state — check cache first
  const [translated, setTranslated] = useState<Record<string, string>>(
    () => sessionCache.get(cacheKey) ?? sourceFields
  );
  const [loading, setLoading] = useState<boolean>(
    () => lang !== 'en' && !sessionCache.has(cacheKey) && Object.keys(sourceFields).length > 0
  );

  // Abort flag for async safety
  const abortRef = useRef(false);
  // Track last cacheKey to reset state when entity/lang changes
  const prevCacheKeyRef = useRef<string>(cacheKey);

  useEffect(() => {
    // When cacheKey changes (new entity or new language), reset to source content
    if (prevCacheKeyRef.current !== cacheKey) {
      prevCacheKeyRef.current = cacheKey;
      const cached = sessionCache.get(cacheKey);
      if (cached) {
        setTranslated(cached);
        setLoading(false);
        return;
      }
      // Reset to source while we fetch
      setTranslated(sourceFields);
    }

    // ── English: never translate ───────────────────────────────────────────────
    if (lang === 'en') {
      setTranslated(sourceFields);
      setLoading(false);
      return;
    }

    // ── Cache hit ──────────────────────────────────────────────────────────────
    const cached = sessionCache.get(cacheKey);
    if (cached) {
      setTranslated(cached);
      setLoading(false);
      return;
    }

    // ── Nothing to translate ───────────────────────────────────────────────────
    if (Object.keys(sourceFields).length === 0) {
      setLoading(false);
      return;
    }

    // ── Fetch translation ──────────────────────────────────────────────────────
    abortRef.current = false;
    setLoading(true);

    translateContent({ entityType, entityId, targetLanguage: lang, fields: sourceFields })
      .then((result) => {
        if (abortRef.current) return;
        sessionCache.set(cacheKey, result.translations);
        setTranslated(result.translations);
      })
      .catch(() => {
        if (abortRef.current) return;
        setTranslated(sourceFields);
      })
      .finally(() => {
        if (!abortRef.current) setLoading(false);
      });

    return () => {
      abortRef.current = true;
    };
  // cacheKey encodes both entityId and lang — sufficient dependency.
  // sourceFields is intentionally excluded to avoid re-renders from object identity changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  return { translated, loading };
}
