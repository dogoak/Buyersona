import { supabase } from './supabaseClient';

/**
 * Calls the Gemini API through the server-side Edge Function proxy.
 * This keeps the API key secure on the server.
 */

export interface GeminiProxyRequest {
    action: 'analyze_website' | 'analyze_business' | 'analyze_deepdive' | 'profundizar';
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

    const response = await fetch(`${supabaseUrl}/functions/v1/gemini-proxy`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

        if (response.status === 429) {
            throw new Error('RATE_LIMIT_EXCEEDED');
        }

        throw new Error(errorData.error || `Gemini proxy error: ${response.status}`);
    }

    return await response.json();
};
