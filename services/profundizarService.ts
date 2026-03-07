import { callGeminiProxy } from './geminiProxyClient';
import { Language } from "../types";

export interface ProfundizarRequest {
    sectionTitle: string;
    sectionContent: string;
    userQuestion: string;
    reportContext: string; // compressed business/product name + summary
    lang: Language;
}

export interface ProfundizarResponse {
    answer: string;
    tokensUsed: number;
    costUsd: number;
}

export const profundizarSection = async (req: ProfundizarRequest): Promise<ProfundizarResponse> => {
    const modelName = 'gemini-2.5-flash';
    // Pricing for gemini-2.5-flash: Input = $0.075 / 1M, Output = $0.30 / 1M
    const inputTokenPriceUsd = 0.075 / 1000000;
    const outputTokenPriceUsd = 0.30 / 1000000;

    const systemInstruction = req.lang === 'es'
        ? `Sos un consultor de marketing y negocios experto. Respondés de forma clara, directa y en lenguaje simple — sin jerga técnica innecesaria. Si usás un término técnico, explicalo entre paréntesis. Tus respuestas son concretas y accionables. Máximo 800 palabras. SIEMPRE completá el pensamiento, nunca cortes una frase a la mitad.`
        : `You are an expert marketing and business consultant. You respond clearly, directly and in simple language — no unnecessary jargon. If you use a technical term, explain it in parentheses. Your answers are concrete and actionable. Maximum 800 words. ALWAYS complete your thought, never cut a sentence in the middle.`;

    const prompt = `
CONTEXT FROM THE USER'S REPORT:
${req.reportContext}

SECTION THE USER WANTS TO DEEP DIVE INTO:
Title: ${req.sectionTitle}
Content: ${req.sectionContent}

USER'S QUESTION:
"${req.userQuestion}"

Respond in ${req.lang === 'es' ? 'Spanish' : 'English'}. Be specific to their business — don't give generic advice. Reference concrete actions, tools, or numbers when possible.`;

    try {
        const response = await callGeminiProxy({
            action: 'profundizar',
            model: modelName,
            contents: prompt,
            config: {
                systemInstruction,
                temperature: 0.7,
                maxOutputTokens: 4096,
            }
        });

        const answer = response.text || '';
        let costUsd = 0;
        let tokensUsed = 0;

        if (response.usageMetadata) {
            const inputTokens = response.usageMetadata.promptTokenCount || 0;
            const outputTokens = response.usageMetadata.candidatesTokenCount || 0;
            tokensUsed = inputTokens + outputTokens;
            costUsd = (inputTokens * inputTokenPriceUsd) + (outputTokens * outputTokenPriceUsd);
        } else {
            const estimatedInput = prompt.length / 4;
            const estimatedOutput = answer.length / 4;
            tokensUsed = Math.round(estimatedInput + estimatedOutput);
            costUsd = (estimatedInput * inputTokenPriceUsd) + (estimatedOutput * outputTokenPriceUsd);
        }

        return { answer, tokensUsed, costUsd };
    } catch (error: any) {
        if (error.message === 'RATE_LIMIT_EXCEEDED') {
            throw new Error('RATE_LIMIT_EXCEEDED');
        }
        console.error('Profundizar error:', error);
        throw error;
    }
};
