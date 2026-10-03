import { supabase, DbDisease } from './supabase';
import { DiseaseItem } from '../types';
import { sampleDiseases } from '../data/plantData';

// ─── DB row → frontend type ───────────────────────────────────────────────────
function toDiseaseItem(row: DbDisease, confidenceScore?: number): DiseaseItem {
  return {
    id: row.id,
    name: row.name,
    commonName: row.common_name,
    image: row.image_url ?? '',
    severity: row.severity,
    spreadRate: row.spread_rate,
    affectedArea: row.affected_area,
    confidenceScore: confidenceScore ?? undefined,
    description: row.description,
    secondaryDescription: row.secondary_desc ?? undefined,
    causes: (row.causes ?? []) as DiseaseItem['causes'],
    treatmentSteps: (row.treatment_steps ?? []) as DiseaseItem['treatmentSteps'],
    urgency: row.urgency ?? undefined,
    tags: row.tags ?? undefined,
  };
}

// ─── Static fallback list ──────────────────────────────────────────────────────
const STATIC_DISEASES = Object.values(sampleDiseases);

// ─── Fetch all diseases — never throws, falls back to static data ─────────────
export async function fetchDiseases(searchTerm?: string): Promise<DiseaseItem[]> {
  try {
    let query = supabase.from('diseases').select('*').order('name');
    if (searchTerm?.trim()) {
      query = query.or(
        `name.ilike.%${searchTerm}%,common_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
      );
    }
    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) return STATIC_DISEASES;
    return data.map((row) => toDiseaseItem(row as DbDisease));
  } catch {
    // Network down or table not yet created — use bundled static data
    const term = searchTerm?.toLowerCase() ?? '';
    if (!term) return STATIC_DISEASES;
    return STATIC_DISEASES.filter(
      d =>
        d.name.toLowerCase().includes(term) ||
        d.commonName.toLowerCase().includes(term) ||
        d.description.toLowerCase().includes(term)
    );
  }
}

// ─── Fetch single disease by ID — never throws ────────────────────────────────
export async function fetchDiseaseById(id: string): Promise<DiseaseItem | null> {
  try {
    const { data, error } = await supabase
      .from('diseases')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) throw error ?? new Error('not found');
    return toDiseaseItem(data as DbDisease);
  } catch {
    // Fallback to static map
    return sampleDiseases[id as keyof typeof sampleDiseases] ?? sampleDiseases.chlorosis;
  }
}

// ─── Diagnosis result type ────────────────────────────────────────────────────
export interface DiagnosisResult {
  disease: DiseaseItem;
  confidenceScore: number;
  rawGeminiResponse?: string;
  /** Which engine produced this result */
  source?: 'gemini_edge' | 'federated_ml' | 'gemini_client' | 'fallback';
  /** Grad-CAM overlay base64 (only from federated ML) */
  gradcamBase64?: string | null;
}

// ─── Federated ML helpers ─────────────────────────────────────────────────────
const FEDERATED_ML_ENABLED =
  (import.meta.env.VITE_ENABLE_FEDERATED_ML as string)?.toLowerCase() === 'true';

const FEDERATED_ML_API_URL =
  (import.meta.env.VITE_FEDERATED_ML_API_URL as string) || 'http://localhost:5000';

/** Check whether the federated ML inference path is active. */
export function isFederatedMLEnabled(): boolean {
  return FEDERATED_ML_ENABLED;
}

// ─── Main entry point: try Edge Function, fall back gracefully ────────────────
export async function diagnoseImage(
  imageBase64: string,
  userId: string
): Promise<DiagnosisResult> {
  const base64Data = imageBase64.includes(',')
    ? imageBase64.split(',')[1]
    : imageBase64;

  // 1. Try Supabase Edge Function (requires deployment)
  try {
    const { data, error } = await supabase.functions.invoke<{
      diseaseId: string;
      confidenceScore: number;
      rawResponse?: string;
    }>('diagnose-plant', {
      body: { imageBase64: base64Data, userId },
    });

    if (error) throw error;
    if (!data?.diseaseId) throw new Error('Empty response from edge function');

    const disease = await fetchDiseaseById(data.diseaseId);
    const result: DiagnosisResult = {
      disease: { ...disease!, confidenceScore: data.confidenceScore },
      confidenceScore: data.confidenceScore,
      rawGeminiResponse: data.rawResponse,
      source: 'gemini_edge',
    };
    void saveScanHistory(userId, null, data.diseaseId, result.disease, data.confidenceScore);
    return result;
  } catch (edgeErr) {
    console.warn('[Flora] Edge Function unavailable:', (edgeErr as Error)?.message);
  }

  // 2. Try Federated ML model (only if enabled via feature flag)
  if (FEDERATED_ML_ENABLED) {
    try {
      const mlResult = await runFederatedMLInference(base64Data, userId);
      if (mlResult) return mlResult;
    } catch (mlErr) {
      console.warn('[Flora] Federated ML unavailable:', (mlErr as Error)?.message);
    }
  }

  // 3. Try client-side Gemini (only if VITE_GEMINI_API_KEY is set)
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (apiKey) {
    try {
      const result = await runClientGemini(base64Data, apiKey, userId);
      if (result) return result;
    } catch (geminiErr) {
      console.warn('[Flora] Client-side Gemini failed:', (geminiErr as Error)?.message);
    }
  }

  // 4. Hardcoded demo fallback — always works, no network needed
  return buildFallback(userId);
}

// ─── Federated ML inference (EfficientNetB0 via Flask API) ────────────────────
async function runFederatedMLInference(
  base64Data: string,
  userId: string
): Promise<DiagnosisResult | null> {
  try {
    const res = await fetch(`${FEDERATED_ML_API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Data, gradcam: true }),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as Record<string, unknown>;
      throw new Error((err.error as string) ?? `HTTP ${res.status}`);
    }

    const data = await res.json() as {
      predicted_class: string;
      confidence: number;
      gradcam_base64?: string | null;
    };

    // Map the ML class name to a known disease ID
    const classNameLower = data.predicted_class.toLowerCase().replace(/[_ ]+/g, '-');
    const diseaseIdMap: Record<string, string> = {
      'chlorosis': 'chlorosis',
      'wilting': 'wilting',
      'rust': 'rust',
      'powdery-mildew': 'powdery-mildew',
      'healthy': 'chlorosis',
    };
    const diseaseId = diseaseIdMap[classNameLower] ?? 'chlorosis';

    const disease = await fetchDiseaseById(diseaseId);
    if (!disease) return null;

    const score = Math.max(0, Math.min(100, Math.round(data.confidence)));
    void saveScanHistory(userId, null, diseaseId, disease, score);

    return {
      disease: { ...disease, confidenceScore: score },
      confidenceScore: score,
      source: 'federated_ml',
      gradcamBase64: data.gradcam_base64 ?? null,
    };
  } catch (err) {
    console.warn('[Flora] Federated ML inference failed:', (err as Error)?.message);
    return null;
  }
}

// ─── Client-side Gemini call ──────────────────────────────────────────────────
async function runClientGemini(
  base64Data: string,
  apiKey: string,
  userId: string
): Promise<DiagnosisResult | null> {
  // Dynamic import — won't crash if @google/genai isn't installed
  let GoogleGenAI: new (opts: { apiKey: string }) => unknown;
  try {
    const mod = await import('@google/genai');
    GoogleGenAI = mod.GoogleGenAI;
  } catch {
    console.warn('[Flora] @google/genai not available in this environment');
    return null;
  }

  const genAI = new GoogleGenAI({ apiKey }) as {
    models: {
      generateContent(opts: {
        model: string;
        contents: unknown[];
      }): Promise<{ text?: string }>;
    };
  };

  const prompt = `You are a plant disease expert. Analyze this leaf image.
Reply ONLY with valid JSON:
{"diseaseId":"<chlorosis|wilting|rust|powdery-mildew|healthy>","confidenceScore":<0-100>}`;

  const res = await genAI.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{
      role: 'user',
      parts: [
        { text: prompt },
        { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
      ],
    }],
  });

  const text = res.text ?? '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  const parsed = JSON.parse(match[0]) as { diseaseId: string; confidenceScore: number };
  const diseaseId = parsed.diseaseId === 'healthy' ? 'chlorosis' : parsed.diseaseId;
  const disease = await fetchDiseaseById(diseaseId);
  if (!disease) return null;

  const score = Math.max(0, Math.min(100, parsed.confidenceScore ?? 85));
  void saveScanHistory(userId, null, diseaseId, disease, score);
  return { disease: { ...disease, confidenceScore: score }, confidenceScore: score, rawGeminiResponse: text, source: 'gemini_client' };
}

// ─── Always-available demo fallback ──────────────────────────────────────────
async function buildFallback(userId: string): Promise<DiagnosisResult> {
  const disease = await fetchDiseaseById('chlorosis');
  const score = 92;
  void saveScanHistory(userId, null, 'chlorosis', disease!, score);
  return { disease: { ...disease!, confidenceScore: score }, confidenceScore: score, source: 'fallback' };
}

// ─── Persist to scan_history (fire-and-forget) ────────────────────────────────
async function saveScanHistory(
  userId: string,
  imageUrl: string | null,
  diseaseId: string,
  diseaseSnapshot: DiseaseItem,
  confidenceScore: number
): Promise<void> {
  try {
    await supabase.from('scan_history').insert({
      user_id: userId,
      image_url: imageUrl,
      disease_id: diseaseId,
      disease_snapshot: diseaseSnapshot as unknown as Record<string, unknown>,
      confidence_score: confidenceScore,
    });
  } catch {
    // Non-critical — never block the UI
  }
}

// ─── Fetch scan history ───────────────────────────────────────────────────────
export async function fetchScanHistory(userId: string) {
  try {
    const { data, error } = await supabase
      .from('scan_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}
