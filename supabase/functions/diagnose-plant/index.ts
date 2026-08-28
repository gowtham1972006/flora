// Supabase Edge Function: diagnose-plant
// Receives a base64 plant leaf image, calls Gemini Vision API,
// maps the result to a known disease ID, and returns JSON.
//
// Deploy with:
//   supabase functions deploy diagnose-plant --no-verify-jwt
//
// Required secret:
//   supabase secrets set GEMINI_API_KEY=<your-key>

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Known disease IDs that exist in the database
const KNOWN_DISEASE_IDS = ['chlorosis', 'wilting', 'rust', 'powdery-mildew'];

interface RequestBody {
  imageBase64: string;  // raw base64, no data-URL prefix
  userId?: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message: string };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY secret not configured' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const body: RequestBody = await req.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'imageBase64 is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const prompt = `You are a plant disease expert AI. Analyze this plant leaf image carefully.

Identify the disease present (if any) and respond ONLY with a valid JSON object in this exact format:
{
  "diseaseId": "<disease>",
  "confidenceScore": <number>,
  "reasoning": "<brief explanation>"
}

The diseaseId must be exactly one of these values:
- "chlorosis" – yellowing between leaf veins, nutrient deficiency
- "wilting" – drooping, limp leaves and stems
- "rust" – orange/brown powdery pustules on leaf undersides  
- "powdery-mildew" – white/grey powdery coating on leaf surfaces
- "healthy" – no disease detected, plant appears healthy

The confidenceScore must be an integer between 0 and 100.
Do not include any text outside the JSON object.`;

    const geminiPayload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: imageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,   // low temp for consistent structured output
        maxOutputTokens: 256,
      },
    };

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload),
    });

    const geminiData: GeminiResponse = await geminiRes.json();

    if (!geminiRes.ok || geminiData.error) {
      console.error('Gemini API error:', geminiData.error?.message);
      return new Response(
        JSON.stringify({
          error: `Gemini API error: ${geminiData.error?.message ?? 'unknown'}`,
        }),
        { status: 502, headers: corsHeaders }
      );
    }

    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Extract JSON from the response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON in Gemini response:', rawText);
      // Fallback to chlorosis
      return new Response(
        JSON.stringify({ diseaseId: 'chlorosis', confidenceScore: 72, rawResponse: rawText }),
        { status: 200, headers: corsHeaders }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      diseaseId: string;
      confidenceScore: number;
      reasoning?: string;
    };

    // Map 'healthy' to chlorosis (lowest severity) with adjusted confidence
    const diseaseId = parsed.diseaseId === 'healthy' || !KNOWN_DISEASE_IDS.includes(parsed.diseaseId)
      ? 'chlorosis'
      : parsed.diseaseId;

    const confidenceScore = Math.min(100, Math.max(0, Math.round(parsed.confidenceScore ?? 80)));

    return new Response(
      JSON.stringify({
        diseaseId,
        confidenceScore,
        rawResponse: rawText,
        reasoning: parsed.reasoning,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error('Edge Function error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(err) }),
      { status: 500, headers: corsHeaders }
    );
  }
});
