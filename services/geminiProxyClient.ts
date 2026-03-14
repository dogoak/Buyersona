import { supabase } from './supabaseClient';

/**
 * Calls the Gemini API through the server-side Edge Function proxy.
 * This keeps the API key secure on the server.
 */

export interface GeminiProxyRequest {
    action: 'analyze_website' | 'analyze_business' | 'analyze_deepdive' | 'analyze_digital_audit' | 'profundizar';
    model: string;
    contents: string | any[];
    config?: {
        systemInstruction?: string;
        temperature?: number;
        maxOutputTokens?: number;
        responseMimeType?: string;
        responseSchema?: any;
        tools?: any[];
        thinkingConfig?: any;
    };
}

export interface GeminiProxyResponse {
    text: string;
    usageMetadata: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
    } | null;
    groundingSources?: { uri: string; title: string }[] | null;
    searchQueries?: string[] | null;
}

export const callGeminiProxy = async (request: GeminiProxyRequest): Promise<GeminiProxyResponse> => {
    const { data: { session } } = await supabase.auth.getSession();

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    };

    // Add auth header if user is logged in
    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const MAX_RETRIES = 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (attempt > 0) {
                // Wait before retry: 3s, 6s
                const delayMs = attempt * 3000;
                console.log(`Gemini proxy retry ${attempt}/${MAX_RETRIES} in ${delayMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }

            const response = await fetch(`${supabaseUrl}/functions/v1/gemini-proxy`, {
                method: 'POST',
                headers,
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                // Retry on 502/503/504 (transient server errors)
                if ([502, 503, 504].includes(response.status) && attempt < MAX_RETRIES) {
                    console.warn(`Gemini proxy returned ${response.status}, will retry...`);
                    lastError = new Error(`Gemini proxy error: ${response.status}`);
                    continue;
                }

                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

                if (response.status === 429) {
                    throw new Error('RATE_LIMIT_EXCEEDED');
                }

                throw new Error(errorData.error || `Gemini proxy error: ${response.status}`);
            }

            return await response.json();
        } catch (err: any) {
            // Retry on network errors (Failed to fetch = CORS/connection issues)
            if (err.message?.includes('Failed to fetch') && attempt < MAX_RETRIES) {
                console.warn(`Gemini proxy network error, will retry...`);
                lastError = err;
                continue;
            }
            throw err;
        }
    }

    throw lastError || new Error('Gemini proxy failed after retries');
};
