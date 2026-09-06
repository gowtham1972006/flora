import { useState, useCallback, useEffect } from 'react';
import { type LangCode, type Translations, LANGUAGES, getTranslations } from '../lib/i18n';

const STORAGE_KEY = 'Flora_lang';

// ─── Detect initial language ──────────────────────────────────────────────────
function detectInitialLang(): LangCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in { en: 1, ta: 1, hi: 1, fr: 1, es: 1 }) {
      return stored as LangCode;
    }
  } catch { /* localStorage unavailable */ }

  // Auto-detect from browser locale
  const browserLang = navigator.language.slice(0, 2).toLowerCase();
  const map: Record<string, LangCode> = { ta: 'ta', hi: 'hi', fr: 'fr', es: 'es' };
  return map[browserLang] ?? 'en';
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export interface UseLanguageResult {
  lang: LangCode;
  setLang: (code: LangCode) => void;
  T: Translations;
  LANGUAGES: typeof LANGUAGES;
}

export function useLanguage(): UseLanguageResult {
  const [lang, setLangState] = useState<LangCode>(detectInitialLang);

  // FIX 5: set document.documentElement.lang on mount and on every change
  // (matches deployed behaviour — accessibility + SEO)
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((code: LangCode) => {
    setLangState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch { /* ignore */ }
    document.documentElement.lang = code; // immediate update without waiting for re-render
  }, []);

  return {
    lang,
    setLang,
    T: getTranslations(lang),
    LANGUAGES,
  };
}
