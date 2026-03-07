import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const MONTHLY_PROFUNDIZAR_LIMIT = 10;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // ── Parse request ─────────────────────────────────────────
        const body = await req.json();
        const { action, model, contents, config } = body;

        if (!action || !model || !contents) {
            return new Response(JSON.stringify({ error: 'Missing required fields: action, model, contents' }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // ── Auth (required for all actions except analyze_website) ──
        const authHeader = req.headers.get('Authorization');
        let user: any = null;

        if (authHeader) {
            const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                global: { headers: { Authorization: authHeader } }
            });
            const token = authHeader.replace('Bearer ', '').trim();
            const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser(token);
            if (!authError && authUser) {
                user = authUser;
            }
        }

        // Actions that require auth
        const authRequiredActions = ['analyze_business', 'analyze_deepdive', 'profundizar'];
        if (authRequiredActions.includes(action) && !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // ── Rate limit check for profundizar ──────────────────────
        if (action === 'profundizar' && user) {
            const supabaseForQuery = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                global: { headers: { Authorization: authHeader! } }
            });
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { count, error: countError } = await supabaseForQuery
                .from('report_followups')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('created_at', startOfMonth.toISOString());

            if (countError) {
                console.error('Rate limit check error:', countError);
            }

            if ((count || 0) >= MONTHLY_PROFUNDIZAR_LIMIT) {
                return new Response(JSON.stringify({
                    error: 'Monthly limit reached',
                    limit: MONTHLY_PROFUNDIZAR_LIMIT,
                    used: count,
                }), {
                    status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        // ── Build Gemini REST API request ─────────────────────────
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

        // Build contents — handle both string and structured formats
        let geminiContents: unknown[];
        if (typeof contents === 'string') {
            geminiContents = [{ role: 'user', parts: [{ text: contents }] }];
        } else if (Array.isArray(contents)) {
            geminiContents = contents;
        } else {
            geminiContents = [contents];
        }

        const geminiBody: Record<string, unknown> = {
            contents: geminiContents,
        };

        // Generation config
        if (config) {
            const generationConfig: Record<string, unknown> = {};
            if (config.temperature !== undefined) generationConfig.temperature = config.temperature;
            if (config.maxOutputTokens !== undefined) generationConfig.maxOutputTokens = config.maxOutputTokens;
            if (config.responseMimeType) generationConfig.responseMimeType = config.responseMimeType;
            if (config.responseSchema) generationConfig.responseSchema = config.responseSchema;
            if (config.thinkingConfig) generationConfig.thinkingConfig = config.thinkingConfig;
            if (Object.keys(generationConfig).length > 0) {
                geminiBody.generationConfig = generationConfig;
            }
        }

        // System instruction
        if (config?.systemInstruction) {
            geminiBody.systemInstruction = {
                parts: [{ text: config.systemInstruction }]
            };
        }

        // Tools (e.g., Google Search)
        if (config?.tools) {
            geminiBody.tools = config.tools;
        }

        const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiBody),
        });

        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.text();
            console.error('Gemini API error:', geminiResponse.status, errorData);
            return new Response(JSON.stringify({
                error: 'Gemini API error',
                status: geminiResponse.status,
                details: errorData.substring(0, 500),
            }), {
                status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const geminiData = await geminiResponse.json();

        // Debug: log response structure  
        console.log(`Action: ${action}, Model: ${model}, Parts count: ${geminiData.candidates?.[0]?.content?.parts?.length || 0}`);
        const allParts = geminiData.candidates?.[0]?.content?.parts || [];
        allParts.forEach((p: any, i: number) => {
            console.log(`Part ${i}: thought=${!!p.thought}, hasText=${!!p.text}, textLen=${p.text?.length || 0}`);
        });

        // Extract text and usage metadata
        // Thinking models (gemini-3-pro, etc.) return multiple parts:
        // - thought parts (with 'thought: true')
        // - the actual text part
        // We need the LAST non-thought text part which contains the actual response.
        const candidates = geminiData.candidates || [];
        const parts = candidates[0]?.content?.parts || [];

        let text = '';
        for (const part of parts) {
            // Skip thought parts — they have a 'thought' field set to true
            if (part.thought) continue;
            if (part.text) {
                text = part.text;
            }
        }

        // Fallback: if no non-thought part found, use first text part
        if (!text && parts.length > 0) {
            text = parts[parts.length - 1]?.text || parts[0]?.text || '';
        }

        const usageMetadata = geminiData.usageMetadata || null;

        return new Response(JSON.stringify({
            text,
            usageMetadata: usageMetadata ? {
                promptTokenCount: usageMetadata.promptTokenCount || 0,
                candidatesTokenCount: usageMetadata.candidatesTokenCount || 0,
                totalTokenCount: usageMetadata.totalTokenCount || 0,
            } : null,
        }), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Edge Function error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error', details: String(error) }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
