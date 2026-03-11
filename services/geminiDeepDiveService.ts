import { Type } from "@google/genai";
import { callGeminiProxy } from './geminiProxyClient';
import { DeepDiveInput, StrategicAnalysis, DeepDiveResult, Language } from "../types";

export const analyzeProductDeepDive = async (
    parentBusinessData: StrategicAnalysis,
    parentOnboardingData: Record<string, any> | null,
    productInput: DeepDiveInput,
    lang: Language
): Promise<{ result: DeepDiveResult, costUsd: number }> => {
    const modelName = 'gemini-3.1-pro-preview';
    const inputTokenPriceUsd = 1.25 / 1000000;
    const outputTokenPriceUsd = 5.00 / 1000000;

    const languageInstruction = lang === 'es'
        ? "CRITICAL: ALL output JSON text content MUST be in SPANISH. Every single string value."
        : "CRITICAL: ALL output JSON text content MUST be in ENGLISH. Every single string value.";

    // Build comprehensive parent context
    const parentContext = buildParentContext(parentBusinessData, parentOnboardingData);

    // Build onboarding context for business identity
    let onboardingContext = '';
    if (parentOnboardingData) {
        const ob = parentOnboardingData;
        onboardingContext = `
    BUSINESS IDENTITY FROM ONBOARDING:
    - Business Name: ${ob.businessName || 'N/A'}
    - Business Type: ${JSON.stringify(ob.businessType) || 'N/A'} (THIS defines if they are manufacturer, retailer, wholesale, etc.)
    - Distribution Model: ${ob.distributionModel || 'N/A'}
    - Sales Channels: ${JSON.stringify(ob.salesChannels) || 'N/A'}
    - Target Region: ${ob.targetRegion || 'N/A'}
    - Business Stage: ${ob.businessStage || 'N/A'}
    - Team Size: ${ob.teamSize || 'N/A'}`;
    }

    let prompt = `
    You are an ELITE Go-To-Market Strategist, Behavioral Psychologist, and Sales Architect.
    You have been hired at $50,000/month to create the DEFINITIVE sales playbook for a product, service, or product line.
    
    Your output must be BRUTALLY SPECIFIC. No generic advice. No filler. Every sentence must contain either:
    - A SPECIFIC name (person, tool, platform, competitor)
    - A SPECIFIC number (price, percentage, timeline)
    - A SPECIFIC script (exact words to say or write)
    - A SPECIFIC action (do THIS, on THIS platform, at THIS time)

    =====================================================
    SECTION 0: BUSINESS IDENTITY (CRITICAL — Read First)
    =====================================================
    ⚠️ CRITICAL DISTINCTION: The BUSINESS is NOT the same as the PRODUCT BRAND.
    This business is a SALES CHANNEL / RETAILER / DISTRIBUTOR / SERVICE PROVIDER that SELLS products.
    
    EXAMPLE: If the business is a perfumery that sells Armani perfumes:
    - The BUSINESS = the perfumery (the store, the brand of the store)
    - The PRODUCT = Armani perfumes (what they sell)
    - COMPETITORS = OTHER PERFUMERIES/STORES that sell similar products, NOT Armani vs Dior
    - The business might be wholesale, retail, online, physical, or a combination
    
    Apply this logic to ALL analysis below. Competitors are ALWAYS other businesses
    of the same type/channel, never other product brands (unless the business IS the manufacturer).
    
    NOTE: This framework applies equally to PRODUCTS and SERVICES (coaching, consulting, classes,
    training, agencies, etc.). When analyzing a SERVICE, treat sessions/packages as units,
    think about client acquisition cost, and adapt all recommendations accordingly.

    Business Model Type: ${(productInput.targetAudience || []).join(' + ') || 'To be determined'}
    ${onboardingContext}

    =====================================================
    SECTION 1: COMPANY DNA (The Universe This Product Lives In)
    =====================================================
    ${parentContext}

    =====================================================
    SECTION 2: THE PRODUCT / SERVICE (Your Surgical Focus)
    =====================================================
    Analysis Scope: ${productInput.analysisScope === 'product_family' ? 'PRODUCT/SERVICE FAMILY or LINE (not a single SKU/offering — analyze the CATEGORY)' : 'SPECIFIC PRODUCT or SERVICE (one item / one offering)'}
    ${productInput.analysisScope === 'product_family' && productInput.productFamilyDescription ? `Family Description: ${productInput.productFamilyDescription}` : ''}
    Product Name: ${productInput.productName}
    Description: ${productInput.productDescription}
    URL: ${productInput.productUrl || 'Not provided'}
    Unit Price: ${productInput.unitPrice}
    Cost/Margin: ${productInput.unitCost || 'Unknown'}
    Current Margin: ${productInput.currentMargin || 'Unknown'}
    
    Product Stage: ${productInput.productStage || 'Unknown'}
    Delivery Model: ${productInput.deliveryModel || 'Unknown'}
    Repurchase Frequency: ${(productInput.repurchaseFrequency || []).join(', ') || 'Unknown'}
    Price Tier: ${productInput.priceRange || 'Unknown'}
    Key Differentiator: ${productInput.differentiator || 'Unknown'}
    Unique Angle vs Generics: ${productInput.uniqueAngle || 'Not specified'}
    Sales Model: ${productInput.salesModel || 'Not specified'} (Mayorista/Minorista/Ambos/Nuevos Mercados)

    Target Audience Model: ${(productInput.targetAudience || []).join(', ') || 'Algorithm Choice'}
    Sales Platforms: ${productInput.salesPlatforms?.join(', ') || 'Algorithm Choice'}
    Expected Monthly Volume: ${productInput.expectedVolume || 'Algorithm Choice'}

    === BATTLEFIELD INTEL ===
    Specific Pain this product solves (micro-problem): ${productInput.specificPainSolved}
    Who is buying TODAY: ${productInput.currentCustomerProfile}
    Dream customer they CAN'T reach: ${productInput.desiredCustomerProfile}
    The LETHAL objection that kills sales: "${productInput.mainObjection}"
    Named Direct Competitors (these are COMPETING BUSINESSES, not product brands): ${productInput.directCompetitors.join(', ')}

    =====================================================
    YOUR MISSION — Create a SURGICAL battle plan:
    =====================================================

    1. **SUMMARY**: Write a 3-paragraph executive brief. Paragraph 1: The product's true potential (be honest and specific). Paragraph 2: Their biggest blind spot or mistake right now. Paragraph 3: The #1 move they should make THIS WEEK.

    2. **MARKET STRATEGY**: 
       - Define the EXACT business model (B2B/B2C/B2B2C/D2C) and JUSTIFY it with numbers.
       - Name SPECIFIC niche platforms (NOT just "MercadoLibre" — name the CATEGORY within MercadoLibre, or the specific B2B portal).
       - Calculate realistic monthly volume considering the price point and market.
       - Give 3 retention strategies that are SPECIFIC to this product type.
       - Give 2 loyalty hooks that create switching cost.

    3. **PRICING STRATEGY**:
       - Assess if their current price is too high, too low, or right — and WHY.
       - Recommend an optimal price with justification.
       - Give 3 psychological anchoring techniques for THIS product.
       - Suggest 2 bundle/upsell opportunities.

    4. **UNIT ECONOMICS**:
       - Estimate CAC (cost to acquire one customer) for the best channel.
       - Estimate LTV (lifetime value) based on repurchase frequency and price.
       - Calculate break-even units per month.
       - Suggest target margin.
       - Project ROI at the recommended volume.

    5. **TARGET PERSONAS** (Generate between 5 and 8 personas — MINIMUM 5):
       Types: 'Ideal' (1-2), 'Secundario' (1-2), 'Emergente' (1), 'Nicho' (1), 'Aspiracional' (0-1).
       REMEMBER: These are customers of the BUSINESS (the store/service), not customers of the product brand.
       For a perfumery selling Armani: personas are PEOPLE WHO BUY FROM PERFUMERIES, not Armani brand fans.
       
       Create a "Day in the Life" psychographic profile. Be INSANELY specific:
       - What time they wake up. What podcast they listen to in the car.
       - What niche Reddit/TikTok communities they follow.
       - What car they drive. What they wear. What frustrates them at 10pm.
       - The EXACT "Decision Trigger" (e.g., "Their supplier delivered late for the 3rd time").
       - Go-To-Market: Primary/Secondary channel, The Perfect Pitch (literal script), Tone of Voice, 3 Specific Tactics.

    6. **OBJECTION MATRIX** (at least 4 objections):
       Include the main objection provided plus anticipate 3 more.
       For EACH: Rate severity (Alta/Media/Baja), write a 2-line killer response, identify the underlying fear, and provide a psychological reframe technique.

    7. **COMPETITOR TEARDOWN**:
       ⚠️ CRITICAL: Competitors are OTHER BUSINESSES of the same type (other stores, other service providers).
       They are NOT other product brands. If the user sells Nike shoes, competitors are other shoe stores, NOT Adidas.
       For each named competitor plus 2-3 you discover: Overlap analysis, the EXACT differentiation angle, and a specific attack strategy.
       Include at least 5 competitors total.

    8. **SOCIAL LISTENING NICHE**:
       Find 5 specific conversations/trends about this EXACT type of product. What do people secretly hate? What do they wish existed? Include platform, topic, sentiment, and an ACTIONABLE insight.

    9. **SALES SURVIVAL KIT**:
       - Cold Email Template (ready to copy-paste, with subject line)
       - Cold DM Template (for Instagram/WhatsApp, conversational tone)
       - Landing Page Structure (7 blocks in order with the copy angle for each)
       - 3 Ad Angles (Meta/Google — headline + hook + CTA for each)
       - 30-Second Elevator Pitch (literal script word by word)

    10. **CONTENT CALENDAR** (7 days):
        For EACH day of the week: Platform, Format (Reel/Carousel/Story/Post), Topic, Example Copy (ready to post), CTA.
        The content must be designed to sell THIS product specifically.

    11. **EXECUTION PLAN** (2 phases):
        - Phase 1 (Days 1-30): What to do TOMORROW. Specific focus, 4-5 concrete actions, 3 KPIs to measure.
        - Phase 2 (Days 30-90): Scaling and optimization. Focus, 4-5 actions, 3 KPIs.

    12. **SEASONALITY** (4 entries for the 4 quarters/seasons):
        For each period (Q1 Jan-Mar, Q2 Apr-Jun, Q3 Jul-Sep, Q4 Oct-Dec):
        - Sales intensity for THIS product (Alta/Media/Baja)
        - Key dates and events to leverage (Mother's Day, Black Friday, season start, etc.)
        - A SPECIFIC strategy for that season (what to do differently)

    13. **QUICK WINS** (5 actions the user can do RIGHT NOW, today, in less than 1 hour each):
        - The exact action to take
        - Time needed (e.g. "15 min", "30 min")
        - Expected impact (be specific: "+20% engagement", "First 5 leads")
        - Tools needed (be specific: Canva, WhatsApp Business, etc.)

    ${languageInstruction}
    Return the data strictly in the requested JSON schema. Be extremely detailed and specific in every field.
    `;

    const contents: any[] = [{ role: 'user', parts: [{ text: prompt }] }];

    // Handle Images (pass to AI but don't store)
    if (productInput.productImages && productInput.productImages.length > 0) {
        productInput.productImages.forEach(img => {
            const base64Data = img.split(',')[1] || img;
            contents[0].parts.push({
                inlineData: { mimeType: "image/jpeg", data: base64Data }
            });
        });
    }

    const response = await callGeminiProxy({
        action: 'analyze_deepdive',
        model: modelName,
        contents: contents,
        config: {
            tools: [{ googleSearch: {} }],
            thinkingConfig: { thinkingBudget: 24000 },
            responseMimeType: "application/json",
            responseSchema: buildResponseSchema()
        }
    });

    if (!response.text) {
        throw new Error("Failed to generate Deep Dive analysis.");
    }

    try {
        const parsedResult = JSON.parse(response.text) as DeepDiveResult;

        let costUsd = 0;
        if (response.usageMetadata) {
            costUsd = ((response.usageMetadata.promptTokenCount || 0) * inputTokenPriceUsd) +
                ((response.usageMetadata.candidatesTokenCount || 0) * outputTokenPriceUsd);
        } else {
            const estimatedPromptTokens = JSON.stringify(productInput).length / 4;
            const estimatedResponseTokens = response.text ? response.text.length / 4 : 5000;
            costUsd = (estimatedPromptTokens * inputTokenPriceUsd) + (estimatedResponseTokens * outputTokenPriceUsd);
        }

        return { result: parsedResult, costUsd };
    } catch (e) {
        console.error("JSON Parse Error", response.text);
        throw new Error("Invalid response format from AI for Deep Dive.");
    }
};

// ── Build parent context string ──────────────────────────────────────
function buildParentContext(
    parent: StrategicAnalysis,
    onboarding: Record<string, any> | null
): string {
    let context = `
    Company Summary: ${parent.summary}
    Classification: ${parent.businessClassification}

    MARKET INTELLIGENCE:
    - Industry: ${parent.marketInsights.industry}
    - Trends: ${parent.marketInsights.trends.join('; ')}
    - Typical CAC: ${parent.marketInsights.benchmarkCAC}
    - Conversion Rate: ${parent.marketInsights.benchmarkConversion}
    - Sales Cycle: ${parent.marketInsights.typicalSalesCycle}
    - Key Success Factors: ${parent.marketInsights.keySuccessFactors.join('; ')}

    KNOWN COMPETITORS:
    ${parent.competitors?.map(c => `- ${c.name} (${c.website}): Overlap: ${c.overlap} | Edge: ${c.differentiation}`).join('\n    ') || 'None identified'}

    EXISTING PERSONAS:
    ${parent.demandMap?.map(p => `- "${p.name}" (${p.type}): ${p.oneLiner} | Best Channel: ${p.strategy.bestChannel} | Hook: ${p.strategy.marketingHook}`).join('\n    ') || 'None'}

    BLUE OCEAN STATUS: ${parent.blueOcean?.status || 'Unknown'}
    - Diagnosis: ${parent.blueOcean?.diagnosis || 'N/A'}
    - Strategic Path: ${parent.blueOcean?.blueOceanPath || 'N/A'}

    OPERATIONAL REALITY:
    - Status: ${parent.operationalCheck?.status || 'Unknown'}
    - Max Leads/Month: ${parent.operationalCheck?.maxLeadsPerMonth || 'Unknown'}
    - Warning: ${parent.operationalCheck?.capacityWarning || 'None'}
    `;

    if (onboarding) {
        context += `
    COMPANY ONBOARDING DATA:
    - Business Name: ${onboarding.businessName || 'N/A'}
    - Business Type: ${JSON.stringify(onboarding.businessType) || 'N/A'}
    - Distribution Model: ${onboarding.distributionModel || 'N/A'}
    - Target Region: ${onboarding.targetRegion || 'N/A'}
    - Location Scope: ${onboarding.locationScope || 'N/A'}
    - Currency: ${onboarding.currency || 'N/A'}
    - Business Stage: ${onboarding.businessStage || 'N/A'}
    - Team Size: ${onboarding.teamSize || 'N/A'}
    - Ad Spend: ${onboarding.adSpendRange || 'N/A'}
    - Sales Channels: ${JSON.stringify(onboarding.salesChannels) || 'N/A'}
    - Social Media: ${JSON.stringify(onboarding.socialMediaPresence) || 'N/A'}
    - Growth Goals: ${JSON.stringify(onboarding.growthGoal) || 'N/A'}
    - Product Price: ${onboarding.productPrice || 'N/A'}
    - Differentiation: ${onboarding.differentiation || 'N/A'}
    - Primary Pain: ${JSON.stringify(onboarding.primaryPain) || 'N/A'}
    `;
    }

    return context;
}

// ── Response Schema ──────────────────────────────────────────────────
function buildResponseSchema() {
    return {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING, description: "3-paragraph executive brief. P1: True potential. P2: Biggest blind spot. P3: #1 move this week." },

            marketStrategy: {
                type: Type.OBJECT,
                properties: {
                    businessModel: { type: Type.STRING, enum: ['B2B', 'B2C', 'B2B2C', 'D2C'] },
                    modelJustification: { type: Type.STRING },
                    recommendedPlatforms: { type: Type.ARRAY, items: { type: Type.STRING } },
                    expectedMonthlyVolume: { type: Type.STRING },
                    retentionStrategies: { type: Type.ARRAY, items: { type: Type.STRING } },
                    loyaltyHooks: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['businessModel', 'modelJustification', 'recommendedPlatforms', 'expectedMonthlyVolume', 'retentionStrategies', 'loyaltyHooks']
            },

            pricingStrategy: {
                type: Type.OBJECT,
                properties: {
                    currentPriceAssessment: { type: Type.STRING, description: "Is the current price too high, too low, or right? Be specific." },
                    recommendedPrice: { type: Type.STRING },
                    justification: { type: Type.STRING },
                    psychologicalAnchors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 specific anchoring techniques for this product" },
                    bundleOpportunities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2 bundle/upsell ideas" }
                },
                required: ['currentPriceAssessment', 'recommendedPrice', 'justification', 'psychologicalAnchors', 'bundleOpportunities']
            },

            unitEconomics: {
                type: Type.OBJECT,
                properties: {
                    estimatedCAC: { type: Type.STRING, description: "Cost to acquire one customer on the best channel" },
                    estimatedLTV: { type: Type.STRING, description: "Lifetime value based on repurchase frequency" },
                    breakEvenUnits: { type: Type.STRING, description: "Units/month needed to break even" },
                    suggestedMargin: { type: Type.STRING },
                    roiProjection: { type: Type.STRING, description: "ROI projection at recommended volume" }
                },
                required: ['estimatedCAC', 'estimatedLTV', 'breakEvenUnits', 'suggestedMargin', 'roiProjection']
            },

            contentCalendar: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        day: { type: Type.STRING, description: "Day of the week" },
                        platform: { type: Type.STRING },
                        format: { type: Type.STRING, description: "Reel, Carousel, Story, Post, etc." },
                        topic: { type: Type.STRING },
                        copyExample: { type: Type.STRING, description: "Ready-to-post copy example" },
                        cta: { type: Type.STRING }
                    },
                    required: ['day', 'platform', 'format', 'topic', 'copyExample', 'cta']
                }
            },

            targetPersonas: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "Descriptive archetype name" },
                        type: { type: Type.STRING, enum: ['Ideal', 'Secundario', 'Emergente', 'Nicho', 'Aspiracional'] },
                        oneLiner: { type: Type.STRING },
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
                        dayInTheLife: {
                            type: Type.OBJECT,
                            properties: {
                                morningRoutine: { type: Type.STRING },
                                workdayHabits: { type: Type.STRING },
                                eveningRoutine: { type: Type.STRING },
                                weekendActivities: { type: Type.STRING },
                                frequentPhysicalPlaces: { type: Type.ARRAY, items: { type: Type.STRING } },
                                frequentDigitalPlaces: { type: Type.ARRAY, items: { type: Type.STRING } },
                                musicAndEntertainment: { type: Type.STRING },
                                vehicleAndCommute: { type: Type.STRING },
                                vacationPreferences: { type: Type.STRING },
                                socialCircle: { type: Type.STRING }
                            },
                            required: ['morningRoutine', 'workdayHabits', 'eveningRoutine', 'weekendActivities', 'frequentPhysicalPlaces', 'frequentDigitalPlaces', 'musicAndEntertainment', 'vehicleAndCommute', 'vacationPreferences', 'socialCircle']
                        },
                        aspirations: {
                            type: Type.OBJECT,
                            properties: {
                                clothingBrands: { type: Type.ARRAY, items: { type: Type.STRING } },
                                roleModels: { type: Type.ARRAY, items: { type: Type.STRING } },
                                influencersFollowed: { type: Type.ARRAY, items: { type: Type.STRING } },
                                contentCreatorsConsumed: { type: Type.ARRAY, items: { type: Type.STRING } },
                                lifeGoals: { type: Type.STRING }
                            },
                            required: ['clothingBrands', 'roleModels', 'influencersFollowed', 'contentCreatorsConsumed', 'lifeGoals']
                        },
                        goToMarket: {
                            type: Type.OBJECT,
                            properties: {
                                primaryChannel: { type: Type.STRING },
                                secondaryChannel: { type: Type.STRING },
                                thePerfectPitch: { type: Type.STRING, description: "Literal selling script" },
                                toneOfVoice: { type: Type.STRING },
                                specificTactics: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 hyper-specific tactics" }
                            },
                            required: ['primaryChannel', 'secondaryChannel', 'thePerfectPitch', 'toneOfVoice', 'specificTactics']
                        }
                    },
                    required: ['name', 'type', 'oneLiner', 'demographic', 'psychological', 'social', 'dayInTheLife', 'aspirations', 'goToMarket']
                }
            },

            objectionMatrix: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        objection: { type: Type.STRING },
                        severity: { type: Type.STRING, enum: ['Alta', 'Media', 'Baja'] },
                        twoLineResponse: { type: Type.STRING, description: "Literal 2-line killer response" },
                        underlyingFear: { type: Type.STRING },
                        reframeTechnique: { type: Type.STRING, description: "Psychological reframe approach" }
                    },
                    required: ['objection', 'severity', 'twoLineResponse', 'underlyingFear', 'reframeTechnique']
                }
            },

            competitorTearDown: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        website: { type: Type.STRING },
                        overlap: { type: Type.STRING },
                        differentiation: { type: Type.STRING, description: "The EXACT angle to beat them" }
                    },
                    required: ['name', 'website', 'overlap', 'differentiation']
                }
            },

            socialListeningNiche: {
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

            salesSurvivalKit: {
                type: Type.OBJECT,
                properties: {
                    coldEmailTemplate: { type: Type.STRING, description: "Full email with subject line, ready to copy-paste" },
                    coldDmTemplate: { type: Type.STRING, description: "Instagram/WhatsApp DM, conversational tone" },
                    landingPageStructure: { type: Type.ARRAY, items: { type: Type.STRING }, description: "7 blocks with copy angle for each" },
                    adAngles: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 ad angles: headline + hook + CTA" },
                    elevatorPitch: { type: Type.STRING, description: "30-second pitch, word by word" }
                },
                required: ['coldEmailTemplate', 'coldDmTemplate', 'landingPageStructure', 'adAngles', 'elevatorPitch']
            },

            executionPlan: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        phase: { type: Type.STRING, enum: ['ShortTerm', 'MediumTerm'] },
                        timing: { type: Type.STRING },
                        focus: { type: Type.STRING },
                        actions: { type: Type.ARRAY, items: { type: Type.STRING } },
                        metrics: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['phase', 'timing', 'focus', 'actions', 'metrics']
                }
            },

            seasonality: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        period: { type: Type.STRING, description: "Quarter or season name" },
                        intensity: { type: Type.STRING, enum: ['Alta', 'Media', 'Baja'] },
                        keyDates: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key dates/events to leverage" },
                        strategy: { type: Type.STRING, description: "Specific strategy for this period" }
                    },
                    required: ['period', 'intensity', 'keyDates', 'strategy']
                }
            },

            quickWins: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        action: { type: Type.STRING, description: "Exact action to take right now" },
                        timeToExecute: { type: Type.STRING, description: "Time needed, e.g. '15 min'" },
                        expectedImpact: { type: Type.STRING, description: "Specific expected result" },
                        tools: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tools/platforms needed" }
                    },
                    required: ['action', 'timeToExecute', 'expectedImpact', 'tools']
                }
            }
        },
        required: ['summary', 'marketStrategy', 'pricingStrategy', 'unitEconomics', 'contentCalendar', 'targetPersonas', 'objectionMatrix', 'competitorTearDown', 'socialListeningNiche', 'salesSurvivalKit', 'executionPlan', 'seasonality', 'quickWins']
    };
}

// ── Pre-Analysis (kept mostly the same, minor improvements) ──────────

export interface ProductPreAnalysis {
    productName: string;
    productDescription: string;
    unitPrice: string;
    specificPainSolved: string;
    currentCustomerProfile: string;
    directCompetitors: string[];
}

export const preAnalyzeProduct = async (
    textContext: string,
    images: string[],
    lang: Language
): Promise<ProductPreAnalysis> => {
    const modelName = 'gemini-3.1-pro-preview';
    const languageInstruction = lang === 'es'
        ? "The output JSON content MUST be in SPANISH."
        : "The output JSON content MUST be in ENGLISH.";

    const prompt = `
    Act as an elite Product & Market Analyst.
    I will provide you with context about a product or service (either text from a website, an attached flyer/image/document, or both).
    Your task is to extract the basic 'DNA' of this product/service to auto-fill an onboarding form.

    Text Context: ${textContext ? textContext : 'No text provided.'}

    If images are attached, read them carefully as they might be screenshots of the product, ads, or brochures.

    Extract the following information:
    1. productName: The name of the product, service, or offering. (Leave empty if totally unknown)
    2. productDescription: A clear, concise 2-3 sentence description of what is being sold and how it is delivered.
    3. unitPrice: The price if mentioned (e.g., "$99/mo", "Aprox. $50"). If not mentioned, guess the approximate market price or write "Desconocido".
    4. specificPainSolved: The specific micro-problem this product/service solves.
    5. currentCustomerProfile: Who seems to be buying this today? (Demographic/role).
    6. directCompetitors: A list of 1 to 3 COMPETING BUSINESSES (NOT product brands).
       ⚠️ CRITICAL DISTINCTION: If someone SELLS perfumes, their competitors are OTHER STORES/PERFUMERIES that sell perfumes, NOT other perfume brands (Dior, Armani, etc.).
       If someone offers coaching services, competitors are OTHER COACHES or coaching practices.
       If someone sells clothing, competitors are OTHER CLOTHING STORES, not clothing brands.
       ALWAYS return names of competing BUSINESSES/STORES/PRACTICES/AGENCIES.

    ${languageInstruction}
    Return ONLY a highly structured JSON according to the schema.
    `;

    const contents: any[] = [{ role: 'user', parts: [{ text: prompt }] }];

    if (images && images.length > 0) {
        images.forEach(img => {
            const base64Data = img.split(',')[1] || img;
            contents[0].parts.push({
                inlineData: { mimeType: "image/jpeg", data: base64Data }
            });
        });
    }

    const response = await callGeminiProxy({
        action: 'analyze_deepdive',
        model: modelName,
        contents: contents,
        config: {
            thinkingConfig: { thinkingBudget: 4000 },
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    productName: { type: Type.STRING },
                    productDescription: { type: Type.STRING },
                    unitPrice: { type: Type.STRING },
                    specificPainSolved: { type: Type.STRING },
                    currentCustomerProfile: { type: Type.STRING },
                    directCompetitors: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['productName', 'productDescription', 'unitPrice', 'specificPainSolved', 'currentCustomerProfile', 'directCompetitors']
            }
        }
    });

    if (!response.text) {
        throw new Error("Failed to pre-analyze product.");
    }

    try {
        return JSON.parse(response.text) as ProductPreAnalysis;
    } catch (e) {
        console.error("JSON Parse Error during Pre-Analysis", response.text);
        throw new Error("Invalid response format from AI for Product Pre-Analysis.");
    }
};
