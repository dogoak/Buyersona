import { Type } from "@google/genai";
import { callGeminiProxy } from './geminiProxyClient';
import { BusinessInput, StrategicAnalysis, Language } from "../types";
import { scrapeGoogleTrendsApify, GoogleTrendsResult, scrapeGoogleMapsCompetitors, MapsCompetitorResult, scrapeGoogleSerpForAnalysis, SerpCompetitorResult } from './apifyClient';

export const analyzeWebsite = async (url: string, lang: Language): Promise<{ result: string, costUsd: number }> => {
    const modelName = 'gemini-2.5-flash'; // Faster model for initial scrape
    // Pricing for gemini-2.5-flash (approx): Input = $0.075 / 1M, Output = $0.30 / 1M
    const inputTokenPriceUsd = 0.075 / 1000000;
    const outputTokenPriceUsd = 0.30 / 1000000;

    // Step 1: Scrape real HTML content from the website
    let websiteContent = '';
    let scrapeConfidence: 'high' | 'low' = 'low';
    try {
        const { scrapeWebsiteContent } = await import('./apifyClient');
        const scraped = await scrapeWebsiteContent(url);
        if (scraped && scraped.content) {
            websiteContent = scraped.content;
            scrapeConfidence = scraped.confidence;
        }
    } catch (e) {
        console.error("Website scraping failed, will try with Gemini only", e);
    }

    // Step 2: Build prompt based on whether we got content or not
    let prompt: string;
    if (websiteContent && scrapeConfidence === 'high') {
        // We have real content — analyze it
        prompt = lang === 'es'
            ? `Analiza el siguiente contenido extraído del sitio web ${url}.
            
CONTENIDO REAL DEL SITIO:
---
${websiteContent}
---

Basándote EXCLUSIVAMENTE en el contenido anterior, extrae la siguiente información en formato JSON:
- description: Descripción concisa del negocio basada en lo que dice el sitio. 
- businessType: Array de strings. Opciones válidas: 'factory', 'brand', 'distributor', 'service', 'software', 'other'.
- distributionModel: String. Opciones válidas: 'b2b', 'b2c', 'both'.
- productName: Nombre del producto o servicio principal.
- targetRegion: Región o país principal (si se menciona).
- confidence: "high"

REGLAS CRÍTICAS:
- SOLO usa información que esté EXPLÍCITAMENTE en el contenido del sitio.
- NO inventes, NO asumas, NO agregues información que no esté en el texto.
- Si algo no se puede determinar del contenido, dejá el campo vacío ("").
- Es mejor dejar campos vacíos que inventar información incorrecta.

Responde SOLO con el JSON.`
            : `Analyze the following content extracted from the website ${url}.
            
ACTUAL SITE CONTENT:
---
${websiteContent}
---

Based EXCLUSIVELY on the content above, extract the following information in JSON format:
- description: Concise business description based on what the site says.
- businessType: Array of strings. Valid options: 'factory', 'brand', 'distributor', 'service', 'software', 'other'.
- distributionModel: String. Valid options: 'b2b', 'b2c', 'both'.
- productName: Main product or service name.
- targetRegion: Main target region or country (if mentioned).
- confidence: "high"

CRITICAL RULES:
- ONLY use information EXPLICITLY present in the site content.
- DO NOT invent, DO NOT assume, DO NOT add information not in the text.
- If something cannot be determined from the content, leave the field empty ("").
- It is better to leave fields empty than to provide incorrect information.

Respond ONLY with the JSON.`;
    } else {
        // No content or low confidence — return empty with warning
        const emptyResult = JSON.stringify({
            description: '',
            businessType: [],
            distributionModel: '',
            productName: '',
            targetRegion: '',
            confidence: 'low'
        });
        return { result: emptyResult, costUsd: 0 };
    }

    try {
        const response = await callGeminiProxy({
            action: 'analyze_website',
            model: modelName,
            contents: prompt,
            config: {}
        });

        // Manual JSON extraction since we can't enforce MIME type with tools
        const text = response.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const resultString = jsonMatch ? jsonMatch[0] : text;

        let costUsd = 0;
        if (response.usageMetadata) {
            costUsd = (response.usageMetadata.promptTokenCount * inputTokenPriceUsd) +
                (response.usageMetadata.candidatesTokenCount * outputTokenPriceUsd);
        } else {
            const estimatedPromptTokens = prompt.length / 4;
            const estimatedResponseTokens = resultString.length / 4;
            costUsd = (estimatedPromptTokens * inputTokenPriceUsd) + (estimatedResponseTokens * outputTokenPriceUsd);
        }

        return { result: resultString, costUsd };
    } catch (e) {
        console.error("Website analysis failed", e);
        return { result: "", costUsd: 0 };
    }
};

export const analyzeBusinessGrowth = async (input: BusinessInput, lang: Language): Promise<{ result: StrategicAnalysis, costUsd: number }> => {
    const modelName = 'gemini-3.1-pro-preview';
    // Pricing for gemini-3.1-pro-preview (approx fallback to general Pro prices): Input = $1.25 / 1M, Output = $5.00 / 1M
    const inputTokenPriceUsd = 1.25 / 1000000;
    const outputTokenPriceUsd = 5.00 / 1000000;

    // ── Scrape Google Trends (fail-silent) ──
    let trendsContext = '';
    let _rawTrendsData: any[] = [];
    try {
        const trendsTerms = [input.productName, input.businessName].filter(Boolean).slice(0, 2);
        if (trendsTerms.length > 0) {
            console.log('[Strategic] Scraping Google Trends for:', trendsTerms);
            _rawTrendsData = await scrapeGoogleTrendsApify(trendsTerms);
            if (_rawTrendsData.length > 0) {
                trendsContext = `
    ═══════════════════════════════════════════
    DATOS REALES DE GOOGLE TRENDS (últimos 12 meses, Argentina):
    ═══════════════════════════════════════════
    ${_rawTrendsData.map(t => `Término: "${t.term}"
    - Tendencia: ${t.trendSummary === 'rising' ? '📈 CRECIENTE' : t.trendSummary === 'declining' ? '📉 DECRECIENTE' : '➡️ ESTABLE'}
    - Pico de interés: ${t.peakValue}/100 | Valor actual: ${t.currentValue}/100
    - Búsquedas relacionadas: ${t.relatedQueries.join(', ') || 'N/A'}`).join('\n    ')}
    
    USÁLOS para enriquecer la sección marketInsights.trends con datos REALES.
    Si la tendencia es decreciente, MENCIONALO como un riesgo.
    Si hay búsquedas relacionadas interesantes, USALAS para sugerir oportunidades.
    `;
            }
        }
    } catch (e) {
        console.error('[Strategic] Google Trends failed (non-blocking):', e);
    }

    // ── Scrape Google Maps for real competitors + SERP (fail-silent, parallel) ──
    let competitorContext = '';
    let _rawMapsData: any[] = [];
    let _rawSerpData: any[] = [];
    try {
        const businessTypes = input.businessType || [];
        const region = input.targetRegion || 'Argentina';
        const mapsQuery = `${businessTypes[0] || input.productName || 'negocio'} ${region}`;
        const serpQueries = [
            `${input.productName || input.businessName} ${region}`,
            `comprar ${input.productName || businessTypes[0] || ''} online`,
        ].filter(q => q.trim().length > 5);

        console.log('[Strategic] Scraping Maps/SERP for:', mapsQuery, serpQueries);
        [_rawMapsData, _rawSerpData] = await Promise.all([
            scrapeGoogleMapsCompetitors(mapsQuery),
            scrapeGoogleSerpForAnalysis(serpQueries),
        ]);

        const parts: string[] = [];

        if (_rawMapsData.length > 0) {
            parts.push(`
    COMPETIDORES REALES EN GOOGLE MAPS (búsqueda: "${mapsQuery}"):
    ${_rawMapsData.map((c, i) => `${i + 1}. "${c.name}" — ⭐ ${c.rating}/5 (${c.totalReviews} reseñas) | ${c.category} | ${c.address}${c.website ? ` | Web: ${c.website}` : ''}`).join('\n    ')}`);
        }

        if (_rawSerpData.length > 0) {
            parts.push(`
    QUIÉN DOMINA GOOGLE PARA ESTE RUBRO:
    ${_rawSerpData.map(s => `Búsqueda "${s.query}":\n    ${s.topResults.map(r => `    #${r.position}: ${r.title} (${r.url})`).join('\n    ')}`).join('\n    ')}`);
        }

        if (parts.length > 0) {
            competitorContext = `
    ═══════════════════════════════════════════
    DATOS REALES DE COMPETENCIA (VERIFICADOS VÍA GOOGLE):
    ═══════════════════════════════════════════
    ${parts.join('\n')}
    
    ⚠️ USÁ ESTOS COMPETIDORES REALES (no inventes).
    En la sección 'competitors', PRIORIZÁ estos negocios verificados.
    Incluí su rating real y cantidad de reseñas en el análisis.
    `;
        }
    } catch (e) {
        console.error('[Strategic] Competitor scraping failed (non-blocking):', e);
    }

    const languageInstruction = lang === 'es'
        ? "IMPORTANT: The output JSON content MUST be in SPANISH."
        : "IMPORTANT: The output JSON content MUST be in ENGLISH.";

    // Construct the prompt with new inputs
    let prompt = `
    Act as a world-class Business Growth Consultant. 
    Analyze this business profile. Move beyond general advice. 
    Provide "Actionable Intelligence": specific metrics, specific hooks, and specific channels mapped to specific people.
    
    === BUSINESS IDENTITY & CONTEXT ===
    Name: ${input.businessName}
    Stage: ${input.businessStage} (Adjust advice based on this: 'idea' needs validation, 'growth' needs scale)
    Website: ${input.websiteUrl || 'Not provided'}
    Type: ${input.businessType.join(', ')} ${input.customBusinessType ? `(${input.customBusinessType})` : ''}
    Current Model: ${input.distributionModel} (Wholesale vs Retail context)
    Offering: ${input.offeringType}
    Geography: ${input.locationScope} - Region: ${input.targetRegion} (Use this for precise localized platform recommendations like MercadoLibre vs Amazon)
    Currency Context: ${input.currency}
    Positioning: ${input.differentiation}
    Description: ${input.description}
    
    === PRODUCT TARGET SCOPE & NUANCE ===
    Target Scope: ${input.productTargetScope} (B2B, B2C, or Both)
    
    ${input.productTargetScope === 'b2b' || input.productTargetScope === 'both' ? `
    [B2B VALUE PROPOSITION]
    Use Case: ${input.b2bUseCase?.join(', ')}
    Buyer Role: ${input.b2bBuyerRole?.join(', ')}
    B2B Problem Solved: ${input.b2bProblemSolved?.includes('other') ? input.customB2bProblem : input.b2bProblemSolved?.join(', ')}
    B2B Purchase Drivers: ${input.b2bPurchaseDrivers?.join(', ')} ${input.customB2bDriver ? `(${input.customB2bDriver})` : ''}
    ` : ''}

    ${input.productTargetScope === 'b2c' || input.productTargetScope === 'both' ? `
    [B2C VALUE PROPOSITION]
    Purchase Context: ${input.b2cPurchaseContext?.join(', ')}
    Natural Discovery: ${input.b2cNaturalChannel}
    B2C Problem Solved: ${input.b2cProblemSolved?.includes('other') ? input.customB2cProblem : input.b2cProblemSolved?.join(', ')}
    B2C Purchase Drivers: ${input.b2cPurchaseDrivers?.join(', ')} ${input.customB2cDriver ? `(${input.customB2cDriver})` : ''}
    ` : ''}

    === SHARED PRODUCT INTELLIGENCE ===
    Product Name: ${input.productName}
    Secondary Benefits: ${input.secondaryBenefits.join(', ')}
    Market Positioning: ${input.marketPositioning}
    ${input.distributionModel === 'b2b'
        ? `Customer Pain of Not Buying From You (business impact for the buyer): ${input.painOfInaction}`
        : input.distributionModel === 'both'
        ? `Customer Pain of Not Using / Not Buying From You: ${input.painOfInaction}`
        : `Customer Pain of Not Using the Product: ${input.painOfInaction}`
    }
    Price Relativity: ${input.priceRelativity}
    ${input.distributionModel === 'b2b'
        ? `Repurchase / Rotation Frequency (how often the BUYER reorders from you): ${input.usageFrequency.join(', ')}`
        : input.distributionModel === 'both'
        ? `Usage and/or Repurchase Frequency (end-consumer usage OR buyer reorder cycle): ${input.usageFrequency.join(', ')}`
        : `End-Consumer Usage Frequency: ${input.usageFrequency.join(', ')}`
    }

    === ECONOMICS ===
    Target Customer: ${input.targetCustomer.join(', ')}
    Payment Model: ${input.paymentModel.join(', ')}
    Unit Price: ${input.productPrice}
    Typical Volume: ${input.purchaseVolume}
    Customer LTV: ${input.customerValue.join(', ')}
    Sales Cycle: ${input.salesCycle.join(', ')}

    === ACQUISITION & SALES ===
    Sales Channels (Transaction): ${input.salesChannels.join(', ')} ${input.customSalesChannel ? `(${input.customSalesChannel})` : ''}
    Social Media Presence: ${input.socialMediaPresence?.join(', ') || 'Not specified'} ${input.customSocialMedia ? `(${input.customSocialMedia})` : ''}
    Marketing Channels (Traffic): ${input.acquisitionChannels.join(', ')} ${input.customAcquisitionChannel ? `(${input.customAcquisitionChannel})` : ''}
    
    Ad Spend: ${input.adSpendRange === 'custom' ? input.customAdSpend : input.adSpendRange} (Analyze if this is sufficient for their goals)
    
    Best Channel (Quality): ${input.bestChannel}
    Best Client Source: ${input.bestClientChannel}

    === AMBITION & EXPANSION ===
    Goals: ${input.growthGoal.join(', ')}
    Explore Secondary Market: ${input.exploreSecondaryMarket ? `Yes, exploring ${input.secondaryMarketType}` : 'No, focus on core'}
    
    === OPERATIONS ===
    Sales Model: ${input.salesModel || 'assisted'} ${input.salesModel === 'self_service' ? '(IMPORTANT: This is a SELF-SERVICE business. The customer buys alone, no human sales interaction. Focus on UX, app onboarding, retention, and churn reduction instead of sales team capacity.)' : input.salesModel === 'mixed' ? '(Mixed model: some self-service, some assisted)' : '(Traditional assisted sales)'}
    Team Size: ${input.teamSize}
    ${input.salesModel !== 'self_service' ? `Capacity: ${input.capacityPerDay} leads/day via ${input.capacityChannel.join(', ')}` : 'Capacity: Self-service (no lead capacity constraints)'}
    Response SLA: ${input.responseSla}
    Automation Level: ${input.automationTools.join(', ')}
    Support Readiness for New Segment: ${input.supportReadiness || 'N/A'}

    === PAIN ===
    Pains: ${input.primaryPain.join(', ')} ${input.customPain ? `(${input.customPain})` : ''}
    Risk: ${input.businessRiskIfNoChange}
    ${input.additionalNotes ? `
    === ADDITIONAL CONTEXT FROM USER ===
    ${input.additionalNotes}
    ` : ''}
    ${trendsContext}
    ${competitorContext}

    Your Goal:
    1. **Executive Summary:** Write a warm, human, professional summary. Avoid robotic language. Speak directly to the business owner.
    2. **Market Pulse:** Provide industry benchmarks (CAC, Conversion, Sales Cycle) specifically for a ${input.businessType.join('/')} in ${input.targetRegion}.
    ${input.businessStage === 'idea' || input.businessStage === 'startup' ? `
    ⚠️ EARLY-STAGE BUSINESS: This business is in "${input.businessStage}" stage. Adjust ALL advice accordingly:
    - Focus on VALIDATION, product-market fit, and launch strategy instead of scaling advice.
    - Use simpler, lower-budget recommendations.
    - The pains are about uncertainty, not operations. Address them empathetically.
    - Don't assume they have established metrics or processes.
    ` : ''}
    3. **Demand Map (Personas):** Create 4 highly detailed personas. DO NOT use proper names (e.g., "Marketing Mary"). Use descriptive archetypes (e.g., "The Overwhelmed Founder").
       CRITICAL: If "Both" scopes are selected, or if "Secondary Market" is being explored, you MUST include personas from BOTH worlds (B2B and B2C) and label them accordingly.
    4. **Strategy Mapping (Crucial):** For EACH persona, you MUST define the specific "Winning Strategy".
       - **Why this persona?**: Explain briefly why this is a good target.
       - **Budget**: Estimate minimum monthly budget to see results on the best channel.
       - **Content**: Provide 3 distinct content ideas (not just one).
    5. **Operational Check:** 
       ${input.salesModel === 'self_service' ? `
       - This is a SELF-SERVICE model. Do NOT analyze lead capacity or sales team bottlenecks.
       - Instead, focus on: product UX, user onboarding flow, retention rate, churn risk, and self-service conversion optimization.
       - Recommend tools for analytics, A/B testing, and user feedback.
       ` : `
       - If they are exploring a secondary market (e.g. B2C) but marked "Partial" or "No" readiness, give a strong warning.
       `}
       - **Automation Advice**: Based on their current tools (${input.automationTools.join(', ')}), recommend 1 specific, easy-to-implement tool to improve efficiency (e.g., if no CRM, suggest a simple one like HubSpot or Pipedrive; if no AI, suggest a simple chatbot). Keep it low-tech friendly.
    6. **Competitor Analysis:** Identify 3 real competitors based on the business description and region (${input.targetRegion}).
    7. **Social Listening:** Find 5 relevant conversations or trends on social media (Reddit, LinkedIn, etc.) related to this product/service.
    8. **Action Plan:** Create a step-by-step plan that is easy to understand for a non-technical user. Avoid jargon.
    9. **Growth Opportunities:** Identify 2 specific opportunities to expand the business (e.g., "Expand to B2C" if they are B2B, or "Target Enterprise" if they are SMB). Explain the Pros and Cons of each.
    10. **Blue Ocean Strategy:** Analyze if the business is in a Red Ocean (saturated) or Blue Ocean.
        - If Red: Define a 'Blue Ocean Shift' using the ERRC Grid (Eliminate, Reduce, Raise, Create).
        - If Blue: How to defend it.

    ${languageInstruction}
    Return the data strictly in the requested JSON format.
  `;

    // Prepare contents array for multimodal input
    const contents: any[] = [{ role: 'user', parts: [{ text: prompt }] }];

    // Add images if present
    if (input.productImages && input.productImages.length > 0) {
        input.productImages.forEach(img => {
            // Assuming img is base64 string without prefix, or handle prefix stripping if needed
            // The input from UI should ideally be the base64 data part
            const base64Data = img.split(',')[1] || img;
            contents[0].parts.push({
                inlineData: {
                    mimeType: "image/jpeg", // Defaulting to jpeg, but should ideally come from input
                    data: base64Data
                }
            });
        });
    }

    // Add documents if present (as text parts if they are text, or images if they are screenshots)
    // For simplicity, we'll assume documents are text content extracted or images
    // If they are base64 PDF, Gemini supports application/pdf
    if (input.documents && input.documents.length > 0) {
        input.documents.forEach(doc => {
            const base64Data = doc.split(',')[1] || doc;
            contents[0].parts.push({
                inlineData: {
                    mimeType: "application/pdf",
                    data: base64Data
                }
            });
        });
    }

    const response = await callGeminiProxy({
        action: 'analyze_business',
        model: modelName,
        contents: contents,
        config: {
            tools: [{ googleSearch: {} }],
            thinkingConfig: { thinkingBudget: 16000 },
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING, description: "Executive summary. Warm, human, professional tone." },
                    businessClassification: { type: Type.STRING },

                    marketInsights: {
                        type: Type.OBJECT,
                        properties: {
                            industry: { type: Type.STRING },
                            trends: { type: Type.ARRAY, items: { type: Type.STRING } },
                            typicalSalesCycle: { type: Type.STRING, description: "Industry average for this type of sale" },
                            benchmarkCAC: { type: Type.STRING, description: "Estimated good Cost Per Acquisition in target currency" },
                            benchmarkConversion: { type: Type.STRING, description: "Target conversion rate %" },
                            keySuccessFactors: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ['industry', 'trends', 'typicalSalesCycle', 'benchmarkCAC', 'benchmarkConversion', 'keySuccessFactors']
                    },

                    competitors: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                website: { type: Type.STRING },
                                overlap: { type: Type.STRING, description: "How they compete" },
                                differentiation: { type: Type.STRING, description: "How you are different" }
                            },
                            required: ['name', 'website', 'overlap', 'differentiation']
                        }
                    },

                    socialListening: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                platform: { type: Type.STRING },
                                topic: { type: Type.STRING },
                                sentiment: { type: Type.STRING },
                                insight: { type: Type.STRING },
                                url: { type: Type.STRING }
                            },
                            required: ['platform', 'topic', 'sentiment', 'insight']
                        }
                    },

                    blueOcean: {
                        type: Type.OBJECT,
                        properties: {
                            status: { type: Type.STRING, enum: ['Red Ocean', 'Blue Ocean', 'Hybrid'] },
                            diagnosis: { type: Type.STRING, description: "Why they are in this state." },
                            blueOceanPath: { type: Type.STRING, description: "Strategic move to find uncontested space." },
                            errcGrid: {
                                type: Type.OBJECT,
                                properties: {
                                    eliminate: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Factors to eliminate" },
                                    raise: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Factors to raise well above industry standard" },
                                    reduce: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Factors to reduce well below industry standard" },
                                    create: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Factors to create that the industry has never offered" }
                                },
                                required: ['eliminate', 'raise', 'reduce', 'create']
                            }
                        },
                        required: ['status', 'diagnosis', 'blueOceanPath', 'errcGrid']
                    },

                    demandMap: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: "Descriptive archetype name (e.g. 'The Busy Mom'), NOT a proper name." },
                                type: { type: Type.STRING, enum: ['Primary', 'Alternative', 'Cash Cow', 'Scalable', 'Long Term'] },
                                oneLiner: { type: Type.STRING },
                                suitabilityScore: { type: Type.NUMBER },

                                demographic: {
                                    type: Type.OBJECT,
                                    properties: {
                                        role: { type: Type.STRING },
                                        companyType: { type: Type.STRING },
                                        companySize: { type: Type.STRING },
                                        industry: { type: Type.STRING },
                                        marketType: { type: Type.STRING }
                                    },
                                    required: ['role', 'companyType', 'companySize', 'industry', 'marketType']
                                },
                                psychological: {
                                    type: Type.OBJECT,
                                    properties: {
                                        motivations: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        fears: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        hates: { type: Type.STRING },
                                        decisionTriggers: { type: Type.STRING },
                                        uncertaintyDrivers: { type: Type.STRING }
                                    },
                                    required: ['motivations', 'fears', 'hates', 'decisionTriggers', 'uncertaintyDrivers']
                                },
                                social: {
                                    type: Type.OBJECT,
                                    properties: {
                                        reportsTo: { type: Type.STRING },
                                        desiredImage: { type: Type.STRING },
                                        reputationalRisk: { type: Type.STRING },
                                        adoptionStyle: { type: Type.STRING }
                                    },
                                    required: ['reportsTo', 'desiredImage', 'reputationalRisk', 'adoptionStyle']
                                },
                                economic: {
                                    type: Type.OBJECT,
                                    properties: {
                                        costsControlled: { type: Type.STRING },
                                        revenueImpacted: { type: Type.STRING },
                                        keyMetrics: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        goodPurchaseDefinition: { type: Type.STRING },
                                        badPurchaseDefinition: { type: Type.STRING }
                                    },
                                    required: ['costsControlled', 'revenueImpacted', 'keyMetrics', 'goodPurchaseDefinition', 'badPurchaseDefinition']
                                },
                                maturity: {
                                    type: Type.OBJECT,
                                    properties: {
                                        stage: { type: Type.STRING },
                                        buyingBehavior: { type: Type.STRING },
                                        decisionSpeed: { type: Type.STRING },
                                        riskTolerance: { type: Type.STRING }
                                    },
                                    required: ['stage', 'buyingBehavior', 'decisionSpeed', 'riskTolerance']
                                },
                                friction: {
                                    type: Type.OBJECT,
                                    properties: {
                                        barriers: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        approvalNeeds: { type: Type.STRING },
                                        salesTouch: { type: Type.STRING },
                                        keyObjections: { type: Type.ARRAY, items: { type: Type.STRING } }
                                    },
                                    required: ['barriers', 'approvalNeeds', 'salesTouch', 'keyObjections']
                                },

                                strategy: {
                                    type: Type.OBJECT,
                                    properties: {
                                        bestChannel: { type: Type.STRING, description: "The single most effective channel for this specific persona" },
                                        secondaryChannel: { type: Type.STRING },
                                        marketingHook: { type: Type.STRING, description: "A specific headline or message that grabs their attention" },
                                        contentIdeas: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 specific content ideas" },
                                        offerAngle: { type: Type.STRING, description: "How to frame the pricing/value to them" },
                                        minBudget: { type: Type.STRING, description: "Minimum budget to test this channel" },
                                        whyThisPersona: { type: Type.STRING, description: "Why this persona is a good fit" }
                                    },
                                    required: ['bestChannel', 'secondaryChannel', 'marketingHook', 'contentIdeas', 'offerAngle', 'minBudget', 'whyThisPersona']
                                }
                            },
                            required: ['name', 'type', 'oneLiner', 'suitabilityScore', 'demographic', 'psychological', 'social', 'economic', 'maturity', 'friction', 'strategy']
                        }
                    },

                    operationalCheck: {
                        type: Type.OBJECT,
                        properties: {
                            status: { type: Type.STRING, enum: ['Safe', 'Caution', 'Danger'] },
                            capacityWarning: { type: Type.STRING },
                            advice: { type: Type.STRING, description: "Conversational, helpful advice." },
                            maxLeadsPerMonth: { type: Type.INTEGER }
                        },
                        required: ['status', 'capacityWarning', 'advice', 'maxLeadsPerMonth']
                    },
                    actionPlan: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Step by step execution plan. Simple language."
                    },
                    growthOpportunities: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                                type: { type: Type.STRING, enum: ['Market Expansion', 'New Segment', 'Product Innovation'] },
                                pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                                cons: { type: Type.ARRAY, items: { type: Type.STRING } }
                            },
                            required: ['title', 'description', 'type', 'pros', 'cons']
                        }
                    }
                },
                required: ['summary', 'businessClassification', 'marketInsights', 'competitors', 'socialListening', 'blueOcean', 'demandMap', 'operationalCheck', 'actionPlan', 'growthOpportunities']
            }
        }
    });

    if (!response.text) {
        throw new Error("Failed to generate analysis.");
    }

    try {
        const parsedResult = JSON.parse(response.text) as StrategicAnalysis;

        // Attach enrichment data so the UI can render visual cards
        (parsedResult as any)._enrichmentData = {
            trends: _rawTrendsData.length > 0 ? _rawTrendsData : null,
            mapsCompetitors: _rawMapsData.length > 0 ? _rawMapsData : null,
            serpResults: _rawSerpData.length > 0 ? _rawSerpData : null,
        };

        let costUsd = 0;
        if (response.usageMetadata) {
            costUsd = ((response.usageMetadata.promptTokenCount || 0) * inputTokenPriceUsd) +
                ((response.usageMetadata.candidatesTokenCount || 0) * outputTokenPriceUsd);
        } else {
            // Fallback token estimation (approx 4 chars per token)
            const estimatedPromptTokens = JSON.stringify(input).length / 4;
            const estimatedResponseTokens = response.text ? response.text.length / 4 : 5000;
            costUsd = (estimatedPromptTokens * inputTokenPriceUsd) + (estimatedResponseTokens * outputTokenPriceUsd);
        }

        return { result: parsedResult, costUsd };
    } catch (e) {
        console.error("JSON Parse Error", response.text);
        throw new Error("Invalid response format from AI.");
    }
};