
import { callGeminiProxy } from './geminiProxyClient';
import { GoogleGenAI, Type } from "@google/genai";
import { DigitalAuditInput, DigitalPreScanResult, DigitalAuditResult, StrategicAnalysis, Language, InstagramScrapeResult, GoogleMapsScrapeResult, FacebookScrapeResult, TikTokScrapeResult, XScrapeResult, LinkedInScrapeResult, YouTubeScrapeResult, PinterestScrapeResult, MetaAdsScrapeResult, MercadoLibreScrapeResult, GoogleSerpResult } from "../types";
import { supabase } from './supabaseClient';


// ── Web Scraper: Extracts real data from HTML ────────────────────────
export interface WebScraperResult {
    url: string;
    hasSSL: boolean;
    platform: string;
    socialLinks: { platform: string; url: string }[];
    detectedTools: string[];
    metaTags: {
        title: string | null;
        description: string | null;
        ogTitle: string | null;
        ogDescription: string | null;
        ogImage: string | null;
        viewport: string | null;
        robots: string | null;
    };
    contactInfo: {
        emails: string[];
        phones: string[];
    };
    schemaOrg: { type: string; name?: string; description?: string }[];
    conversionElements: {
        hasWhatsAppButton: boolean;
        hasEmailCapture: boolean;
        hasClearCTAs: boolean;
        hasSearchBar: boolean;
        hasCart: boolean;
        hasPopup: boolean;
        hasLiveChat: boolean;
    };
    siteMetrics: {
        pageSizeKb: number;
        imageCount: number;
        scriptCount: number;
        cssCount: number;
        productCountOnPage: number | null;
        hasBlog: boolean;
        detectedLanguage: string | null;
        canonicalUrl: string | null;
        favicon: string | null;
    };
    error?: string;
}

export const scrapeWebsite = async (url: string): Promise<WebScraperResult> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/web-scraper`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ url }),
    });

    if (!response.ok) {
        throw new Error(`Scraper failed with status ${response.status}`);
    }

    return await response.json();
};

export const scrapeInstagramApify = async (username: string): Promise<InstagramScrapeResult | null> => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const cleanUsername = username.replace(/[@\/]|\s/g, ''); // Remove @, /, spaces
        
        if (!cleanUsername) return null;

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/apify-proxy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token || ''}`,
            },
            body: JSON.stringify({
                action: 'scrape_instagram_profile',
                payload: { username: cleanUsername }
            }),
        });

        if (!response.ok) {
            console.error('Apify Proxy failed HTTP status:', response.status);
            return null;
        }

        const data = await response.json();
        
        if (!data.success) {
            console.error('Apify scrape failed:', data.error);
            return null;
        }

        return data.profile as InstagramScrapeResult;
    } catch (e) {
        console.error('Network error calling Apify proxy:', e);
        return null;
    }
};

export const scrapeGoogleMapsApify = async (searchUrl: string): Promise<GoogleMapsScrapeResult | null> => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!searchUrl) return null;

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        
        // Detect if it's a URL or a text query / place_id
        const isRealUrl = searchUrl.startsWith('http');
        const payload = isRealUrl 
            ? { searchUrl }
            : { searchQuery: searchUrl.replace('place_id:', '') };
        
        const response = await fetch(`${supabaseUrl}/functions/v1/apify-proxy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token || ''}`,
            },
            body: JSON.stringify({
                action: 'scrape_google_maps',
                payload
            }),
        });

        if (!response.ok) {
            console.error('Apify Proxy Maps failed HTTP status:', response.status);
            return null;
        }

        const data = await response.json();
        
        if (!data.success) {
            console.error('Apify Maps scrape failed:', data.error);
            return null;
        }

        return data.result as GoogleMapsScrapeResult;
    } catch (e) {
        console.error('Network error calling Apify Maps proxy:', e);
        return null;
    }
};

export const scrapeFacebookApify = async (pageUrl: string): Promise<FacebookScrapeResult | null> => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!pageUrl) return null;

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/apify-proxy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token || ''}`,
            },
            body: JSON.stringify({
                action: 'scrape_facebook_page',
                payload: { pageUrl }
            }),
        });

        if (!response.ok) return null;
        const data = await response.json();
        if (!data.success) return null;
        return data.result as FacebookScrapeResult;
    } catch (e) {
        console.error('Facebook scrape error:', e);
        return null;
    }
};

export const scrapeTikTokApify = async (profileUrl: string): Promise<TikTokScrapeResult | null> => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!profileUrl) return null;

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/apify-proxy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token || ''}`,
            },
            body: JSON.stringify({
                action: 'scrape_tiktok_profile',
                payload: { profileUrl }
            }),
        });

        if (!response.ok) return null;
        const data = await response.json();
        if (!data.success) return null;
        return data.result as TikTokScrapeResult;
    } catch (e) {
        console.error('TikTok scrape error:', e);
        return null;
    }
};

export const scrapeXApify = async (profileUrl: string): Promise<XScrapeResult | null> => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!profileUrl) return null;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/apify-proxy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
            body: JSON.stringify({ action: 'scrape_x_profile', payload: { profileUrl } }),
        });
        if (!response.ok) return null;
        const data = await response.json();
        if (!data.success) return null;
        return data.result as XScrapeResult;
    } catch (e) {
        console.error('X scrape error:', e);
        return null;
    }
};

export const scrapeLinkedInApify = async (profileUrl: string): Promise<LinkedInScrapeResult | null> => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!profileUrl) return null;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/apify-proxy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
            body: JSON.stringify({ action: 'scrape_linkedin_profile', payload: { profileUrl } }),
        });
        if (!response.ok) return null;
        const data = await response.json();
        if (!data.success) return null;
        return data.result as LinkedInScrapeResult;
    } catch (e) {
        console.error('LinkedIn scrape error:', e);
        return null;
    }
};

export const scrapeYouTubeApify = async (channelUrl: string): Promise<YouTubeScrapeResult | null> => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!channelUrl) return null;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/apify-proxy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
            body: JSON.stringify({ action: 'scrape_youtube_channel', payload: { channelUrl } }),
        });
        if (!response.ok) return null;
        const data = await response.json();
        if (!data.success) return null;
        return data.result as YouTubeScrapeResult;
    } catch (e) {
        console.error('YouTube scrape error:', e);
        return null;
    }
};

export const scrapePinterestApify = async (profileUrl: string): Promise<PinterestScrapeResult | null> => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!profileUrl) return null;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/apify-proxy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
            body: JSON.stringify({ action: 'scrape_pinterest_profile', payload: { profileUrl } }),
        });
        if (!response.ok) return null;
        const data = await response.json();
        if (!data.success) return null;
        return data.result as PinterestScrapeResult;
    } catch (e) {
        console.error('Pinterest scrape error:', e);
        return null;
    }
};

export const scrapeMetaAdsApify = async (pageUrl?: string, searchQuery?: string): Promise<MetaAdsScrapeResult | null> => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!pageUrl && !searchQuery) return null;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/apify-proxy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
            body: JSON.stringify({ action: 'scrape_meta_ads', payload: { pageUrl, searchQuery } }),
        });
        if (!response.ok) return null;
        const data = await response.json();
        if (!data.success) return null;
        return data.result as MetaAdsScrapeResult;
    } catch (e) {
        console.error('Meta Ads scrape error:', e);
        return null;
    }
};

export const scrapeMercadoLibreApify = async (storeName?: string, searchQuery?: string): Promise<MercadoLibreScrapeResult | null> => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!storeName && !searchQuery) return null;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/apify-proxy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
            body: JSON.stringify({ action: 'scrape_mercadolibre', payload: { storeName, searchQuery } }),
        });
        if (!response.ok) return null;
        const data = await response.json();
        if (!data.success) return null;
        return data.result as MercadoLibreScrapeResult;
    } catch (e) {
        console.error('MercadoLibre scrape error:', e);
        return null;
    }
};

export const scrapeGoogleAdsApify = async (advertiserName?: string, domain?: string): Promise<any> => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!advertiserName && !domain) return null;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/apify-proxy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
            body: JSON.stringify({ action: 'scrape_google_ads', payload: { advertiserName, domain } }),
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.success ? data.result : null;
    } catch (e) {
        console.error('Google Ads scrape error:', e);
        return null;
    }
};

export const scrapeTikTokAdsApify = async (keyword: string, countryCode = 'AR'): Promise<any> => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!keyword) return null;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/apify-proxy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
            body: JSON.stringify({ action: 'scrape_tiktok_ads', payload: { keyword, countryCode } }),
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.success ? data.result : null;
    } catch (e) {
        console.error('TikTok Ads scrape error:', e);
        return null;
    }
};

export const scrapeLinkedInAdsApify = async (advertiserName: string): Promise<any> => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!advertiserName) return null;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/apify-proxy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
            body: JSON.stringify({ action: 'scrape_linkedin_ads', payload: { advertiserName } }),
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.success ? data.result : null;
    } catch (e) {
        console.error('LinkedIn Ads scrape error:', e);
        return null;
    }
};

export const scrapeGoogleSerpApify = async (
    queries: string[],
    businessName: string,
    websiteDomain: string,
    competitors?: { name: string; website: string }[]
): Promise<{ queries: GoogleSerpResult[] } | null> => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!queries || queries.length === 0) return null;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/apify-proxy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
            body: JSON.stringify({
                action: 'scrape_google_serp',
                payload: { queries, businessName, websiteDomain, competitors }
            }),
        });
        if (!response.ok) return null;
        const data = await response.json();
        if (!data.success) return null;
        return data.result as { queries: GoogleSerpResult[] };
    } catch (e) {
        console.error('Google SERP scrape error:', e);
        return null;
    }
};

// ── Pre-scan: Scrape first, then enrich with Gemini ──────────────────
export const preScanDigitalPresence = async (
    websiteUrl: string,
    socialUrls: { instagram?: string; tiktok?: string; linkedin?: string; facebook?: string; youtube?: string; googleMaps?: string },
    lang: Language
): Promise<DigitalPreScanResult> => {
    const modelName = 'gemini-2.5-flash';
    const languageInstruction = lang === 'es'
        ? "The output JSON content MUST be in SPANISH."
        : "The output JSON content MUST be in ENGLISH.";

    const socialContext = Object.entries(socialUrls)
        .filter(([, url]) => url)
        .map(([platform, url]) => `${platform}: ${url}`)
        .join('\n');

    // Extract domain name for search queries
    let domainName = websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    let brandHint = domainName.split('.')[0]; // e.g. "alsurtextil" from "alsurtextil.com.ar"

    const prompt = `
    You are a digital research assistant. Your job is to find ALL digital presence information about this business using Google Search.
    
    Website URL: ${websiteUrl}
    Domain: ${domainName}
    Brand name hint: ${brandHint}
    ${socialContext ? `Already known Social Media URLs:\n${socialContext}` : 'No social media URLs provided yet — you MUST find them.'}
    
    IMPORTANT: You CANNOT visit or read websites directly. You MUST use Google Search for everything.
    
    STEP-BY-STEP INSTRUCTIONS:
    
    1. FIND SOCIAL MEDIA PROFILES — Run these Google searches:
       - Search: "${brandHint} instagram"
       - Search: "${brandHint} facebook"
       - Search: "${brandHint} tiktok"
       - Search: "${brandHint} linkedin"
       - Search: "${brandHint} youtube"
       - Search: "site:instagram.com ${brandHint}"
       - Search: "site:facebook.com ${brandHint}"
       - Search: "${domainName} redes sociales" or "${domainName} social media"
       Return the REAL profile URLs you find.
    
    2. GET REAL FOLLOWER COUNTS — For each social profile found:
       - Search: "[profile name] instagram followers"
       - Search: "[profile name] seguidores"
       Return REAL numbers, not estimates.
    
    3. GOOGLE REVIEWS — Search:
       - "${brandHint} google reviews"
       - "${brandHint} opiniones google"
       - "${brandHint} reseñas"
       Return rating (e.g. 4.5) and review count.
    
    4. PLATFORM DETECTION — Search:
       - "${domainName} tienda nube" OR "${domainName} shopify" OR "${domainName} wordpress" OR "${domainName} woocommerce"
       - "site:${domainName}" to see what Google indexes
       Common Argentine platforms: Tienda Nube, Mercado Shops, Empretienda
    
    5. TOOLS — Search:
       - "${domainName} google analytics" or "${domainName} meta pixel"
       - If you can't determine tools, return an empty array.
    
    CRITICAL RULES:
    - Do NOT make up URLs. Only return URLs you actually found via search.
    - Do NOT guess follower counts. Only return numbers you found in search results.
    - If you can't find something, omit it or use "No encontrado".
    - Run ALL the searches listed above, not just some.
    
    ${languageInstruction}
    
    Return ONLY valid JSON (no markdown, no \`\`\`, no extra text) with this exact structure:
    {
      "platform": "string (e.g. Tienda Nube, Shopify, WordPress, Custom)",
      "hasSSL": true/false,
      "detectedTools": ["Google Analytics", "Meta Pixel", ...],
      "socialLinks": [{"platform": "Instagram", "url": "https://..."}, ...],
      "estimatedFollowers": [{"platform": "Instagram", "count": "24,000"}, ...],
      "googleRating": "4.5",
      "googleReviewCount": "120"
    }
    `;

    const response = await callGeminiProxy({
        action: 'analyze_website',
        model: modelName,
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.3,
            maxOutputTokens: 4096,
        }
    });

    if (!response.text) {
        throw new Error("Failed to pre-scan digital presence.");
    }

    try {
        // Try direct parse first
        let jsonText = response.text.trim();
        // Strip markdown code fences if present
        if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }
        return JSON.parse(jsonText) as DigitalPreScanResult;
    } catch (e) {
        // Try to extract JSON from response text
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]) as DigitalPreScanResult;
            } catch (_) {}
        }
        console.error("JSON Parse Error during Pre-Scan", response.text);
        throw new Error("Invalid response format from AI for Digital Pre-Scan.");
    }
};

// ── Screenshot Capture via Google PageSpeed Insights API ─────────────
export const captureWebsiteScreenshot = async (url: string): Promise<string | null> => {
    try {
        const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=performance&strategy=mobile`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
            console.error('PageSpeed API failed:', response.status);
            return null;
        }
        const data = await response.json();
        const screenshotData = data?.lighthouseResult?.audits?.['final-screenshot']?.details?.data;
        if (screenshotData && typeof screenshotData === 'string') {
            // Returns data:image/jpeg;base64,... format
            return screenshotData;
        }
        return null;
    } catch (e) {
        console.error('Screenshot capture failed:', e);
        return null;
    }
};

// ── Deep Research: Google Search grounded investigation ──────────────
export const deepResearchForAudit = async (
    businessName: string,
    websiteUrl: string,
    instagramUrl?: string,
    industry?: string,
    distributionModel?: string,
    websiteScreenshot?: string | null,
    preScanData?: { estimatedFollowers?: { platform: string; count: string }[]; googleRating?: string; googleReviewCount?: string; socialLinks?: { platform: string; url: string }[] } | null,
    instagramData?: InstagramScrapeResult | null,
): Promise<{ research: string, sources: { uri: string; title: string }[], costUsd: number }> => {
    const modelName = 'gemini-2.5-flash';
    const inputTokenPriceUsd = 0.15 / 1000000;
    const outputTokenPriceUsd = 0.60 / 1000000;

    let domainName = websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    let brandHint = domainName.split('.')[0];
    const isWholesale = distributionModel === 'b2b' || distributionModel === 'both';

    // Build pre-scan context
    let preScanContext = '';
    if (preScanData) {
        preScanContext = `
    DATOS YA VERIFICADOS POR NUESTRO SISTEMA (Pre-Scan automático):
    ${preScanData.estimatedFollowers?.map(f => `- ${f.platform}: ${f.count} seguidores`).join('\n    ') || '- Seguidores: No verificados aún'}
    - Google Rating: ${preScanData.googleRating || 'No encontrado'}
    - Google Reviews Count: ${preScanData.googleReviewCount || 'No encontrado'}
    ${preScanData.socialLinks?.map(s => `- ${s.platform}: ${s.url}`).join('\n    ') || ''}
    USÁLOS como referencia. Si encontrás datos diferentes, citá la fuente.
    `;
    }

    let igContext = '';
    if (instagramData) {
        const postsText = instagramData.latestPosts.map((p, i) => `Post ${i+1} (${p.type || 'Post'}): ${(p.caption || '').substring(0, 50)}... Likes: ${p.likesCount}, Comments: ${p.commentsCount}`).join('\n      ');
        igContext = `
    ═══════════════════════════════════════════
    DATOS REALES DE INSTAGRAM (VERIFICADOS VÍA API - NO LOS INVENTES NI PIERDAS TIEMPO BUSCÁNDOLOS):
    ═══════════════════════════════════════════
    - Usuario: @${instagramData.username || 'Desconocido'} (${instagramData.fullName || ''})
    - Seguidores EXACTOS: ${instagramData.followersCount?.toLocaleString() || '0'}
    - Siguiendo: ${instagramData.followsCount?.toLocaleString() || '0'}
    - Cantidad de Posts: ${instagramData.postsCount?.toLocaleString() || '0'}
    - Verificado: ${instagramData.isVerified ? 'Sí' : 'No'}
    - Cuenta Profesional/Negocio: ${instagramData.isBusinessAccount ? `Sí (${instagramData.businessCategoryName || 'Categoría oculta'})` : 'No'}
    - Link en Bio: ${instagramData.externalUrl || 'Ninguno'}
    - Biografía de perfil: "${instagramData.biography}"
    
    - ÚLTIMOS POSTS REALES:
      ${postsText}
      
    ⚠️ REGLA: Usá estos datos EXACTOS en tu análisis. No busques esto en Google.
    `;
    }

    // Use exact Instagram handle if available
    let igHandle = '';
    if (instagramUrl) {
        const igMatch = instagramUrl.match(/instagram\.com\/([^/?\s]+)/);
        if (igMatch) igHandle = igMatch[1];
    }

    const prompt = `
    Sos un investigador digital experto. Tu trabajo es investigar la PRESENCIA DIGITAL ONLINE de esta marca.
    ${websiteScreenshot ? '\n    ⚠️ Te adjunto un SCREENSHOT de su página web. ANALIZALO VISUALMENTE.' : ''}
    
    ═══════════════════════════════════════════
    DATOS DEL NEGOCIO (VERIFICADOS POR NOSOTROS):
    ═══════════════════════════════════════════
    MARCA: ${businessName}
    WEB EXACTA: ${websiteUrl}
    DOMINIO: ${domainName}
    ${instagramUrl ? `INSTAGRAM EXACTO: ${instagramUrl}` : 'INSTAGRAM: No proporcionado'}
    ${igHandle ? `USUARIO DE INSTAGRAM: @${igHandle}` : ''}
    RUBRO: ${industry || 'No especificado'}
    MODELO: ${isWholesale ? 'MAYORISTA' : 'MINORISTA'}
    ${preScanContext}
    ${igContext}
    
    ═══════════════════════════════════════════
    🚨 REGLAS ANTI-ALUCINACIÓN (LEÉLAS ANTES DE EMPEZAR):
    ═══════════════════════════════════════════
    
    1. SOLO reportá información que ENCONTRASTE REALMENTE en Google Search (o en los Datos de Instagram de arriba).
    2. Para CADA dato que reportes, indicá DE DÓNDE LO SACASTE (URL o resultado de búsqueda).
    3. Si NO encontrás información sobre algo, escribí: "❌ No encontré información verificable sobre esto."
    4. NO asumas ni inventes: dirección física, locales, CRM, herramientas internas, ni nada que no puedas ver online.
    5. Este análisis es de PRESENCIA DIGITAL ONLINE solamente. No analices procesos internos del negocio.
    6. Si hay varias marcas/negocios con nombre similar, asegurate de hablar del que tiene EXACTAMENTE la web ${websiteUrl}
    7. NO confundas esta marca con otra del mismo rubro. VERIFICÁ que estás hablando de ${domainName}.
    
    ═══════════════════════════════════════════
    BUSCÁ ESTA INFORMACIÓN (Google Search + Datos Proporcionados):
    ═══════════════════════════════════════════
    
    1. ANÁLISIS CUALITATIVO DE INSTAGRAM:
       - Basado en los "DATOS REALES DE INSTAGRAM" proporcionados arriba (sus seguidores exactos, bio y últimos posts), analizá cualitativamente:
       - ¿La bio está optimizada?
       - ¿Qué demuestran sus últimos posts sobre su estrategia (venden directo, hacen branding)?
       - ¿Tienen buena tasa de interacción (likes vs followers)?
       - (Opcional, si necesitás ver el feed visualmente: buscá "${businessName} instagram")
       - ¿Cuántos seguidores tiene? FUENTE: ¿de dónde sacaste el número?
       - ¿Qué tipo de contenido publican? ¿Fotos, reels, carruseles?
       - ¿Las fotos son de producto solo o hay personas/modelos?
       - ¿Aparece la dueña/o del negocio? ¿Muestra la cara en el feed, stories, reels?
       - ¿El feed tiene variedad o parece un catálogo repetitivo?
       - ¿Tienen historias destacadas? ¿Cuáles?
       - ¿Con qué frecuencia publican?
       - Describí brevemente los últimos posts que puedas ver.
       - ¿Qué estética visual tiene? ¿Es coherente?
    
    2. SITIO WEB (referite SOLO a ${websiteUrl}):
       ${websiteScreenshot ? '⚠️ ANALIZÁ EL SCREENSHOT ADJUNTO — describí lo que ves.' : ''}
       - ¿Es claramente mayorista, minorista, o ambiguo?
       - ¿Qué plataforma usa? (Tienda Nube, Shopify, etc.)
       - ¿Las fotos de productos son profesionales?
       - ¿Tiene propuesta de valor clara? ¿Hero banner?
       - ¿Tiene pop-ups, newsletter, chat en vivo?
       ${websiteScreenshot ? `
       - DEL SCREENSHOT: Describí TODO lo que ves: colores, layout, tipografía, imágenes, navegación.
       - DEL SCREENSHOT: ¿Se ve profesional o casero? ¿Transmite confianza? ¿Es atractivo?` : ''}
    
    3. GOOGLE BUSINESS PROFILE Y DIRECCIÓN FÍSICA:
       - Buscá "${businessName}" y "${businessName} ${industry} dirección" en Google.
       - ¿Aparece un panel de Google Business (Knowledge Panel) a la derecha?
       - Si SÍ: ¿Qué rating tiene? ¿Cuántas reseñas? ¿Qué dirección muestra? ¿Tienen local a la calle?
       - Si NO aparece: decí "No se encontró perfil de Google Business para ${businessName} asociado a ${domainName}".
       - ⚠️ CUIDADO: puede haber otra marca con nombre similar. VERIFICÁ que el perfil corresponda a ${domainName}.
    
    4. PRESENCIA EN OTROS CANALES CLAVE (LinkedIn y Mercado Libre):
       - Buscá: "site:linkedin.com/company ${businessName}" para ver si tienen página de empresa en LinkedIn.
       - Buscá: "site:mercadolibre.com.ar ${businessName}" o "tienda oficial ${businessName} mercado libre" para ver si venden allí.
       - Si encontrás los perfiles, anotá las URLs. Si no, poné explícitamente "No encontrado".
       
    5. COMPETIDORES (buscá "${industry} ${isWholesale ? 'mayorista' : 'minorista'} argentina online"):
       - ⚠️ CRÍTICO: Encontrá 3-5 competidores REALES que vendan EXACTAMENTE los mismos productos y usen el mismo modelo (${isWholesale ? 'mayorista' : 'minorista'}).
       - NO elijas marcas famosas multinacionales si este es un negocio local.
       - Para cada uno: nombre, web real, y sus seguidores en Instagram (buscálos).
    
    6. RESEÑAS (buscá "${domainName} opiniones" y "${businessName} reseñas"):
       - ¿Qué dicen los clientes en foros o redes?
       - ¿Hay problemas recurrentes mencionados online?
    
    ═══════════════════════════════════════════
    FORMATO DE RESPUESTA:
    ═══════════════════════════════════════════
    
    Para CADA sección, incluí:
    - Los datos encontrados
    - [FUENTE: URL o "búsqueda de Google: query usada"]
    - Si no encontraste algo: ❌ No encontré información verificable.
    
    Respondé en texto narrativo organizado por secciones, NO en JSON.
    `;

    try {
        // Build contents: text + optional screenshot image
        const parts: any[] = [{ text: prompt }];

        if (websiteScreenshot) {
            const base64Data = websiteScreenshot.includes(',') ? websiteScreenshot.split(',')[1] : websiteScreenshot;
            const mimeType = websiteScreenshot.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
            parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
            });
        }

        const response = await callGeminiProxy({
            action: 'analyze_website',
            model: modelName,
            contents: [{ role: 'user', parts }],
            config: {
                tools: [{ googleSearch: {} }],
                temperature: 0.2,
                maxOutputTokens: 8192,
            }
        });

        let costUsd = 0;
        if (response.usageMetadata) {
            costUsd = ((response.usageMetadata.promptTokenCount || 0) * inputTokenPriceUsd) +
                ((response.usageMetadata.candidatesTokenCount || 0) * outputTokenPriceUsd);
        }

        // Capture grounding sources from the proxy response
        const sources = response.groundingSources || [];

        return { research: response.text || '', sources, costUsd };
    } catch (e) {
        console.error('Deep research failed, continuing without it:', e);
        return { research: '', sources: [], costUsd: 0 };
    }
};

// ── Full Digital Audit Analysis ──────────────────────────────────────
export const analyzeDigitalAudit = async (
    input: DigitalAuditInput,
    parentBusinessData: StrategicAnalysis,
    parentOnboardingData: Record<string, any> | null,
    lang: Language
): Promise<{ result: DigitalAuditResult, costUsd: number }> => {
    const modelName = 'gemini-3.1-pro-preview';
    const inputTokenPriceUsd = 1.25 / 1000000;
    const outputTokenPriceUsd = 10.00 / 1000000;

    // PHASE 0: Fetch specific external API data (like Instagram Apify)
    let instagramData: InstagramScrapeResult | null = null;
    if (input.instagramUrl) {
        try {
            const igMatch = input.instagramUrl.match(/instagram\.com\/([^/?\s]+)/);
            if (igMatch && igMatch[1]) {
                instagramData = await scrapeInstagramApify(igMatch[1]);
            }
        } catch (e) {
            console.error('Failed to scrape Instagram via Apify:', e);
        }
    }
    
    // Inject the real fetched data into the input so the remainder of the pipeline uses it
    if (instagramData) {
        input.instagramData = instagramData;
    }

    let googleMapsData: GoogleMapsScrapeResult | null = null;
    if (input.googleMapsUrl) {
        try {
            googleMapsData = await scrapeGoogleMapsApify(input.googleMapsUrl);
        } catch (e) {
            console.error('Failed to scrape Google Maps via Apify:', e);
        }
    }

    if (googleMapsData) {
        input.googleMapsData = googleMapsData;
    }

    let facebookData: FacebookScrapeResult | null = null;
    if (input.facebookUrl) {
        try {
            facebookData = await scrapeFacebookApify(input.facebookUrl);
        } catch (e) {
            console.error('Failed to scrape Facebook via Apify:', e);
        }
    }
    if (facebookData) {
        input.facebookData = facebookData;
    }

    let tiktokData: TikTokScrapeResult | null = null;
    if (input.tiktokUrl) {
        try {
            tiktokData = await scrapeTikTokApify(input.tiktokUrl);
        } catch (e) {
            console.error('Failed to scrape TikTok via Apify:', e);
        }
    }
    if (tiktokData) {
        input.tiktokData = tiktokData;
    }

    // X (Twitter)
    let xData: XScrapeResult | null = null;
    if (input.xUrl) {
        try {
            xData = await scrapeXApify(input.xUrl);
        } catch (e) {
            console.error('Failed to scrape X via Apify:', e);
        }
    }
    if (xData) {
        input.xData = xData;
    }

    // LinkedIn
    let linkedinData: LinkedInScrapeResult | null = null;
    if (input.linkedinUrl) {
        try {
            linkedinData = await scrapeLinkedInApify(input.linkedinUrl);
        } catch (e) {
            console.error('Failed to scrape LinkedIn via Apify:', e);
        }
    }
    if (linkedinData) {
        input.linkedinData = linkedinData;
    }

    // YouTube
    let youtubeData: YouTubeScrapeResult | null = null;
    if (input.youtubeUrl) {
        try {
            youtubeData = await scrapeYouTubeApify(input.youtubeUrl);
        } catch (e) {
            console.error('Failed to scrape YouTube via Apify:', e);
        }
    }
    if (youtubeData) {
        input.youtubeData = youtubeData;
    }

    // Pinterest
    let pinterestData: PinterestScrapeResult | null = null;
    if (input.pinterestUrl) {
        try {
            pinterestData = await scrapePinterestApify(input.pinterestUrl);
        } catch (e) {
            console.error('Failed to scrape Pinterest via Apify:', e);
        }
    }
    if (pinterestData) {
        input.pinterestData = pinterestData;
    }

    // MercadoLibre — only scrape if user provided a direct URL
    let mercadolibreData: MercadoLibreScrapeResult | null = null;
    try {
        const mlMarketplace = input.marketplaces?.find(m => m.platform.toLowerCase().includes('mercado'));
        const mlStoreUrl = mlMarketplace?.storeName;
        // Only scrape if we have a URL (starts with http) — avoid keyword search that returns junk
        if (mlStoreUrl && mlStoreUrl.trim().startsWith('http')) {
            mercadolibreData = await scrapeMercadoLibreApify(mlStoreUrl, undefined);
        }
    } catch (e) {
        console.error('Failed to scrape MercadoLibre:', e);
    }
    if (mercadolibreData) {
        input.mercadolibreData = mercadolibreData;
    }

    // Google SERP Scraper (Auto-generated queries)
    try {
        const queries = [];
        const bName = parentOnboardingData?.businessName || '';
        const ind = parentBusinessData.businessClassification || parentOnboardingData?.industry || '';
        
        if (bName) queries.push(bName);
        if (ind) queries.push(`comprar ${ind.toLowerCase()}`);
        if (bName && ind) queries.push(`${ind.toLowerCase()} ${bName.toLowerCase()}`);
        
        // Add one main competitor if exists
        const mainCompetitor = (input.competitors || [])[0];
        if (mainCompetitor?.name) {
            queries.push(mainCompetitor.name);
            if (ind) queries.push(`${ind.toLowerCase()} ${mainCompetitor.name.toLowerCase()}`);
        }

        // Filter and cap to 5
        const uniqueQueries = [...new Set(queries.filter(q => q.trim().length > 0))].slice(0, 5);

        if (uniqueQueries.length > 0) {
            const serpResult = await scrapeGoogleSerpApify(
                uniqueQueries, 
                bName, 
                input.websiteUrl, 
                input.competitors
            );
            if (serpResult && serpResult.queries) {
                input.serpData = serpResult.queries;
            }
        }
    } catch (e) {
        console.error('Failed to scrape Google SERP via Apify:', e);
    }

    // Meta Ads Library — check if user runs ads
    let metaAdsData: MetaAdsScrapeResult | null = null;
    try {
        // Use Facebook URL if available, otherwise search by business name
        const parentBusinessName = parentOnboardingData?.businessName;
        metaAdsData = await scrapeMetaAdsApify(input.facebookUrl || undefined, parentBusinessName || undefined);
    } catch (e) {
        console.error('Failed to scrape Meta Ads Library:', e);
    }
    if (metaAdsData) {
        input.metaAdsData = metaAdsData;
    }

    // Ad Intelligence — scrape Google Ads, TikTok Ads, LinkedIn Ads
    let googleAdsData: any = null;
    let tiktokAdsData: any = null;
    let linkedinAdsData: any = null;
    try {
        const businessName = parentOnboardingData?.businessName || '';
        const websiteDomain = input.websiteUrl?.replace(/https?:\/\//, '').replace(/\/$/, '') || '';
        const industryKeyword = parentOnboardingData?.industry || businessName;
        
        // Run all 3 ad scrapers in parallel but without failing all if one fails
        const results = await Promise.allSettled([
            scrapeGoogleAdsApify(businessName, websiteDomain),
            scrapeTikTokAdsApify(industryKeyword),
            scrapeLinkedInAdsApify(businessName),
        ]);

        googleAdsData = results[0].status === 'fulfilled' ? results[0].value : null;
        tiktokAdsData = results[1].status === 'fulfilled' ? results[1].value : null;
        linkedinAdsData = results[2].status === 'fulfilled' ? results[2].value : null;

        if (results[0].status === 'rejected') console.error('Failed to scrape Google Ads:', results[0].reason);
        if (results[1].status === 'rejected') console.error('Failed to scrape TikTok Ads:', results[1].reason);
        if (results[2].status === 'rejected') console.error('Failed to scrape LinkedIn Ads:', results[2].reason);
    } catch (e) {
        console.error('Failed to scrape ads:', e);
    }

    // PHASE 0b: Scrape COMPETITORS — ONLY Instagram for comparison
    interface CompetitorScrapeData {
        name: string;
        website: string;
        webData: WebScraperResult | null;
        igData: InstagramScrapeResult | null;
    }
    const competitorScrapedData: CompetitorScrapeData[] = [];

    if (input.competitors && input.competitors.length > 0) {
        // Run all competitor scrapes in parallel for speed
        const competitorPromises = input.competitors.map(async (comp) => {
            const compData: CompetitorScrapeData = { name: comp.name, website: comp.website, webData: null, igData: null };

            // If user provided Instagram URL directly, use it (skip website scrape)
            if (comp.instagramUrl) {
                const igHandle = comp.instagramUrl.replace(/^@/, '').replace(/.*instagram\.com\//, '').replace(/[/?#].*/, '').trim();
                if (igHandle) {
                    try {
                        compData.igData = await scrapeInstagramApify(igHandle);
                    } catch (e) {
                        console.error(`Failed to scrape competitor IG @${igHandle}:`, e);
                    }
                }
                // Still scrape website for basic data (platform, tools, meta tags) — cheap, 1 call
                try {
                    compData.webData = await scrapeWebsite(comp.website);
                } catch (e) {
                    console.error(`Failed to scrape competitor website ${comp.website}:`, e);
                }
            } else {
                // No IG URL provided — scrape website and try to discover Instagram
                try {
                    compData.webData = await scrapeWebsite(comp.website);
                } catch (e) {
                    console.error(`Failed to scrape competitor website ${comp.website}:`, e);
                }

                // Look for Instagram in discovered social links
                if (compData.webData?.socialLinks) {
                    for (const link of compData.webData.socialLinks) {
                        if (link.platform.toLowerCase().includes('instagram') && !compData.igData) {
                            const igMatch = link.url.match(/instagram\.com\/([^/?\s]+)/);
                            if (igMatch && igMatch[1]) {
                                try {
                                    compData.igData = await scrapeInstagramApify(igMatch[1]);
                                } catch (e) {
                                    console.error(`Failed to scrape competitor IG:`, e);
                                }
                            }
                        }
                    }
                }
            }

            return compData;
        });

        const results = await Promise.allSettled(competitorPromises);
        for (const result of results) {
            if (result.status === 'fulfilled') {
                competitorScrapedData.push(result.value);
            }
        }
    }

    // Build business context from parent analysis
    const businessName = parentOnboardingData?.businessName || 'Unknown';
    const industry = parentBusinessData.marketInsights?.industry || 'Unknown';
    const distributionModel = parentOnboardingData?.distributionModel || parentBusinessData.businessClassification || '';

    // PHASE 1: Deep research with Google Search grounding + visual analysis
    const { research: deepResearchText, sources: groundingSources, costUsd: researchCostUsd } = await deepResearchForAudit(
        businessName,
        input.websiteUrl,
        input.instagramUrl,
        industry,
        distributionModel,
        null, // No screenshot
        input.preScanData ? {
            estimatedFollowers: input.preScanData.estimatedFollowers,
            googleRating: input.preScanData.googleRating,
            googleReviewCount: input.preScanData.googleReviewCount,
            socialLinks: input.preScanData.socialLinks,
        } : null,
        input.instagramData
    );
    
    let businessContext = `
    ═══════════════════════════════════════════
    BUSINESS CONTEXT (from previous Strategic Analysis — USE THIS):
    ═══════════════════════════════════════════
    Name: ${businessName}
    Summary: ${parentBusinessData.summary}
    Industry/Niche: ${industry}
    Classification: ${parentBusinessData.businessClassification}
    Distribution Model: ${distributionModel || 'N/A'}
    Trends del mercado: ${parentBusinessData.marketInsights?.trends?.join('; ') || 'N/A'}
    Competitors (from strategic analysis): ${parentBusinessData.competitors?.map(c => `${c.name} (${c.website})`).join(', ') || 'None identified'}
    Target Personas:
    ${parentBusinessData.demandMap?.map(p => `  - "${p.name}": Canal ideal: ${p.strategy.bestChannel} | Tono: ${(p.strategy as any).messagingTone || 'N/A'} | Dolor: ${(p as any).painPoints?.[0] || 'N/A'}`).join('\n') || 'N/A'}
    USÁ ESTAS PERSONAS para cruzar con tus recomendaciones de contenido y canales.
    `;

    if (parentOnboardingData) {
        const ob = parentOnboardingData;
        businessContext += `
    Business Type: ${JSON.stringify(ob.businessType) || 'N/A'}
    Target Region: ${ob.targetRegion || 'N/A'}
    Sales Channels: ${JSON.stringify(ob.salesChannels) || 'N/A'}
    Social Media (from onboarding): ${JSON.stringify(ob.socialMediaPresence) || 'N/A'}
    Ad Spend (from onboarding): ${ob.adSpendRange || 'N/A'}
        `;
    }

    // User-declared marketing context (from audit onboarding — THE USER TOLD US THIS)
    let userMarketingContext = '';
    if (input.paidAds || input.emailMarketing || input.crmTool || input.marketingObjective) {
        userMarketingContext = `
    ═══════════════════════════════════════════
    DATOS DECLARADOS POR EL USUARIO (confiables, el usuario los ingresó):
    ═══════════════════════════════════════════
    Publicidad paga: ${input.paidAds?.active ? `SÍ — Plataformas: ${input.paidAds.platforms?.join(', ') || 'No especificó'}` : 'NO pauta'}
    Presupuesto publicidad: ${input.adBudgetRange || 'No declarado'}
    Email marketing: ${input.emailMarketing?.active ? `SÍ — Plataforma: ${input.emailMarketing.platform || 'No especificó'}` : 'NO hace email marketing'}
    Recuperación de carritos: ${input.cartRecovery ? 'SÍ' : 'NO'}
    CRM: ${input.crmTool?.active ? `SÍ — ${input.crmTool.name || 'No especificó cuál'}` : 'NO usa CRM'}
    Objetivo principal: ${input.marketingObjective || 'No declarado'}
    Equipo de marketing: ${input.marketingTeamSize || 'No declarado'}
    ⚠️ ESTOS DATOS SON DEL USUARIO. NO los contradigas. Si el usuario dice que hace email marketing con Perfit, NO digas que "no hace email marketing".
    ⚠️ USÁLOS para dar recomendaciones ajustadas a su presupuesto, equipo y objetivos.
        `;
    }

    // Build pre-scan context
    let preScanContext = '';
    if (input.preScanData) {
        const ps = input.preScanData;
        preScanContext = `
    PRE-SCAN DATA (already verified):
    - Platform: ${ps.platform}
    - SSL: ${ps.hasSSL ? 'Yes' : 'No'}
    - Tools: ${ps.detectedTools?.join(', ') || 'None'}
    - Social: ${ps.socialLinks?.map(s => `${s.platform}: ${s.url}`).join(', ') || 'None'}
    - Followers: ${ps.estimatedFollowers?.map(f => `${f.platform}: ${f.count}`).join(', ') || 'Unknown'}
    - Google Rating: ${ps.googleRating || 'Not found'}
    - Google Reviews: ${ps.googleReviewCount || 'Not found'}
        `;
    }

    // Deep research context (REAL data from Google Search)
    let deepResearchContext = '';
    if (deepResearchText) {
        const sourcesText = groundingSources.length > 0
            ? `\n    FUENTES UTILIZADAS EN ESTA INVESTIGACIÓN:\n    ${groundingSources.map((s, i) => `${i + 1}. ${s.title}: ${s.uri}`).join('\n    ')}`
            : '';
        deepResearchContext = `
    ═══════════════════════════════════════════
    INVESTIGACIÓN REAL DE LA MARCA (datos verificados con Google Search):
    ═══════════════════════════════════════════
    ${deepResearchText}
    ${sourcesText}
    
    ⚠️ REGLA CRÍTICA: Basá tu análisis en esta investigación verificada.
    NO inventes datos que no estén aquí. Si algo no fue encontrado, reportalo como "No verificado" o "Sin datos".
    NO confundas esta marca con otra del mismo rubro. La web es EXACTAMENTE: ${input.websiteUrl}
    ═══════════════════════════════════════════
        `;
    }

    let igContext = '';
    if (input.instagramData) {
        const ig = input.instagramData;
        const posts = ig.latestPosts || [];
        igContext = `
    ═══════════════════════════════════════════
    DATOS REALES DE INSTAGRAM (VERIFICADOS VÍA API):
    ═══════════════════════════════════════════
    - Usuario: @${ig.username}
    - Nombre completo: ${ig.fullName || 'N/A'}
    - Seguidores EXACTOS: ${ig.followersCount?.toLocaleString() || '0'}
    - Siguiendo: ${ig.followsCount?.toLocaleString() || '0'}
    - Posts totales: ${ig.postsCount?.toLocaleString() || '0'}
    - Bio: "${ig.biography || 'Sin bio'}"
    - Cuenta business: ${ig.isBusinessAccount ? 'SÍ' : 'NO'} ${ig.businessCategoryName ? `(${ig.businessCategoryName})` : ''}
    - Verificado: ${ig.isVerified ? 'SÍ ✅' : 'NO'}
    - Web en bio: ${ig.externalUrl || 'No tiene'}
    ${posts.length > 0 ? `
    ÚLTIMOS ${posts.length} POSTS CON CONTENIDO REAL:
    ${posts.map((p: any, i: number) => `    Post ${i + 1}: "${(p.caption || 'Sin caption').slice(0, 200)}"
      → ${p.likesCount?.toLocaleString() || 0} likes | ${p.commentsCount?.toLocaleString() || 0} comentarios
      → URL: ${p.url || 'N/A'}`).join('\n')}
    ` : ''}
    USÁ ESTOS NÚMEROS Y CONTENIDO EXACTOS. Citá los captions de los posts cuando analices contenido.
        `;
    }

    let googleMapsContext = '';
    if (input.googleMapsData) {
        const gm = input.googleMapsData;
        googleMapsContext = `
    ═══════════════════════════════════════════
    DATOS REALES DE GOOGLE MAPS / REPUTACIÓN LOCAL (VERIFICADOS VÍA API):
    ═══════════════════════════════════════════
    - Nombre del Negocio: ${gm.title}
    - Rating Exacto: ${gm.rating} estrellas
    - Cantidad de Reseñas: ${gm.reviewsCount?.toLocaleString() || '0'}
    - Dirección: ${gm.address}
    
    ÚLTIMAS RESEÑAS DE CLIENTES REALES:
    ${gm.reviews.map(r => `"${r.text}" (${r.rating} estrellas)`).join('\n    ')}
    
    ⚠️ REGLA CRÍTICA: USÁ ESTOS NÚMEROS EXACTOS para tu evaluación de 'reputationAnalysis'.
    Lee las reseñas reales e incluyelas en tu diagnóstico. NO inventes un rating de Google ni hables de un servicio sin reseñas si acá ves que las tienen.
        `;
    }

    let fbContext = '';
    if (input.facebookData) {
        const fb = input.facebookData;
        const fbPosts = fb.latestPosts || [];
        fbContext = `
    ═══════════════════════════════════════════
    DATOS REALES DE FACEBOOK (VERIFICADOS VÍA API):
    ═══════════════════════════════════════════
    - Página: ${fb.pageName}
    - Seguidores EXACTOS: ${fb.followers?.toLocaleString() || '0'}
    - Likes de Página: ${fb.likes?.toLocaleString() || '0'}
    - Categoría: ${fb.category}
    - Acerca de: "${fb.about?.slice(0, 200) || 'N/A'}"
    - Web: ${fb.website || 'N/A'}
    ${fbPosts.length > 0 ? `
    ÚLTIMOS ${fbPosts.length} POSTS CON CONTENIDO REAL:
    ${fbPosts.map((p: any, i: number) => `    Post ${i + 1}: "${(p.text || 'Sin texto').slice(0, 200)}"
      → 👍 ${p.likes?.toLocaleString() || 0} | 💬 ${p.comments?.toLocaleString() || 0} | 🔄 ${p.shares?.toLocaleString() || 0}
      → URL: ${p.url || 'N/A'}`).join('\n')}
    ` : ''}
    USÁ ESTOS NÚMEROS Y CONTENIDO EXACTOS. Citá los posts cuando analices contenido de Facebook.
        `;
    }

    let tiktokContext = '';
    if (input.tiktokData) {
        const tk = input.tiktokData;
        const tkVids = tk.latestVideos || [];
        tiktokContext = `
    ═══════════════════════════════════════════
    DATOS REALES DE TIKTOK (VERIFICADOS VÍA API):
    ═══════════════════════════════════════════
    - Usuario: @${tk.username}
    - Apodo: ${tk.nickname || 'N/A'}
    - Seguidores EXACTOS: ${tk.followers?.toLocaleString() || '0'}
    - Siguiendo: ${tk.following?.toLocaleString() || '0'}
    - Total Likes: ${tk.likes?.toLocaleString() || '0'}
    - Videos Publicados: ${tk.videos}
    - Bio: "${tk.bio || 'Sin bio'}"
    - Verificado: ${tk.verified ? 'SÍ ✅' : 'NO'}
    ${tkVids.length > 0 ? `
    ÚLTIMOS ${tkVids.length} VIDEOS CON CONTENIDO REAL:
    ${tkVids.map((v: any, i: number) => `    Video ${i + 1}: "${(v.description || 'Sin descripción').slice(0, 200)}"
      → 👀 ${v.views?.toLocaleString() || 0} vistas | ❤️ ${v.likes?.toLocaleString() || 0} | 💬 ${v.comments?.toLocaleString() || 0} | 🔄 ${v.shares?.toLocaleString() || 0}
      → URL: ${v.url || 'N/A'}`).join('\n')}
    ` : ''}
    USÁ ESTOS NÚMEROS Y CONTENIDO EXACTOS. Citá las descripciones de los TikToks.
        `;
    }

    let xContext = '';
    if (input.xData) {
        const x = input.xData;
        const tweets = x.latestTweets || [];
        xContext = `
    ═══════════════════════════════════════════
    DATOS REALES DE X / TWITTER (VERIFICADOS VÍA API):
    ═══════════════════════════════════════════
    - Usuario: @${x.username}
    - Nombre: ${x.name}
    - Seguidores EXACTOS: ${x.followers?.toLocaleString() || '0'}
    - Siguiendo: ${x.following?.toLocaleString() || '0'}
    - Verificado: ${x.isVerified ? 'SÍ ✅' : 'NO'}
    - Bio: "${(x as any).description || 'Sin descripción'}"
    ${tweets.length > 0 ? `
    ÚLTIMOS ${tweets.length} TWEETS CON CONTENIDO REAL:
    ${tweets.map((t: any, i: number) => `    Tweet ${i + 1}: "${(t.text || '').slice(0, 200)}"
      → ❤️ ${t.likes?.toLocaleString() || 0} | 🔁 ${t.retweets?.toLocaleString() || 0} | 💬 ${t.replies?.toLocaleString() || 0} | 👀 ${t.views?.toLocaleString() || 0} vistas
      → URL: ${t.url || 'N/A'}`).join('\n')}
    ` : ''}
    USÁ ESTOS DATOS Y CONTENIDO EXACTOS. Citá los tweets en tu análisis.
        `;
    }

    let linkedinContext = '';
    if (input.linkedinData) {
        const li = input.linkedinData;
        linkedinContext = `
    ═══════════════════════════════════════════
    DATOS REALES DE LINKEDIN (VERIFICADOS VÍA API):
    ═══════════════════════════════════════════
    - Nombre: ${li.name}
    - Titular: ${li.headline}
    - Seguidores EXACTOS: ${li.followers?.toLocaleString() || '0'}
    - Conexiones: ${li.connections?.toLocaleString() || '0'}
    - Industria: ${li.industry || 'N/A'}
    - Ubicación: ${li.location || 'N/A'}
    - About: ${li.about?.slice(0, 200) || 'N/A'}
    - Es empresa: ${li.isCompany ? 'Sí' : 'No'}
    - Empleados: ${li.employeeCount || 'N/A'}
    USÁ ESTOS DATOS EXACTOS.
        `;
    }

    let youtubeContext = '';
    if (input.youtubeData) {
        const yt = input.youtubeData;
        youtubeContext = `
    ═══════════════════════════════════════════
    DATOS REALES DE YOUTUBE (VERIFICADOS VÍA API):
    ═══════════════════════════════════════════
    - Canal: ${yt.channelName}
    - Suscriptores EXACTOS: ${yt.subscribers?.toLocaleString() || '0'}
    - Views totales: ${yt.totalViews}
    - Videos publicados: ${yt.totalVideos}
    - Miembro desde: ${yt.joinedDate || 'N/A'}
    - Monetizado: ${yt.isMonetized ? 'Sí' : 'No'}
    - Últimos videos: ${yt.latestVideos?.map(v => `"${v.title}" (${v.views?.toLocaleString()} views)`).join(' | ') || 'N/A'}
    USÁ ESTOS DATOS EXACTOS.
        `;
    }

    let pinterestContext = '';
    if (input.pinterestData) {
        const pt = input.pinterestData;
        pinterestContext = `
    ═══════════════════════════════════════════
    DATOS REALES DE PINTEREST (VERIFICADOS VÍA API):
    ═══════════════════════════════════════════
    - Usuario: ${pt.username}
    - Seguidores EXACTOS: ${pt.followers?.toLocaleString() || '0'}
    - Siguiendo: ${pt.following?.toLocaleString() || '0'}
    - Pines totales: ${pt.pins}
    - Tableros: ${pt.boards}
    USÁ ESTOS DATOS EXACTOS.
        `;
    }

    let metaAdsContext = '';
    if (input.metaAdsData) {
        const ma = input.metaAdsData;
        const searchedSource = (ma as any).searchedUrl ? `\n    📌 FUENTE: Buscado en ${(ma as any).searchedUrl}` : '';
        if (ma.isRunningAds) {
            metaAdsContext = `
    ═══════════════════════════════════════════
    DATOS REALES DE META ADS LIBRARY (VERIFICADOS VÍA API):${searchedSource}
    ═══════════════════════════════════════════
    - ¿Está pautando en Meta? SÍ ✅
    - Total de anuncios activos: ${ma.totalAds}
    - Detalle de anuncios:
    ${ma.ads.slice(0, 5).map((ad, i) => `    Anuncio ${i + 1}: Página: "${ad.pageName || 'N/A'}" | "${ad.body?.slice(0, 100) || ad.title || 'Sin texto'}" | CTA: ${ad.ctaText || 'N/A'} | Desde: ${ad.startedRunning || 'N/A'} | Plataformas: ${ad.platforms?.join(', ') || 'Meta'}`).join('\n')}
    CITÁ EL NOMBRE DE LA PÁGINA DEL ANUNCIO. Si el pageName no coincide con el negocio analizado, MENCIONALO.
            `;
        } else {
            metaAdsContext = `
    ═══════════════════════════════════════════
    DATOS REALES DE META ADS LIBRARY (VERIFICADOS VÍA API):${searchedSource}
    ═══════════════════════════════════════════
    - ¿Está pautando en Meta? NO ❌
    - No se encontraron anuncios activos en Facebook/Instagram Ads.
    ESTE DATO ES CLAVE: el cliente NO invierte en publicidad paga en Meta.
            `;
        }
    }

    let mercadolibreContext = '';
    if (input.mercadolibreData) {
        const ml = input.mercadolibreData;
        if (ml.found) {
            mercadolibreContext = `
    ═══════════════════════════════════════════
    DATOS REALES DE MERCADOLIBRE (VERIFICADOS VÍA API):
    ═══════════════════════════════════════════
    ${ml.seller ? `
    VENDEDOR:
    - Nombre: ${ml.seller.name}
    - Reputación: ${ml.seller.reputation}
    - Transacciones completadas: ${ml.seller.transactions}
    - Calificaciones positivas: ${ml.seller.positiveRatings}%
    - Ubicación: ${ml.seller.location}` : ''}
    
    PRODUCTOS ENCONTRADOS (${ml.totalProducts} resultados):
    ${ml.products.slice(0, 5).map((p, i) => `    ${i + 1}. "${p.title}" — $${p.price?.toLocaleString()} ${p.currency} | Vendidos: ${p.soldQuantity} | ${p.freeShipping ? 'Envío gratis ✅' : 'Envío c/ cargo'} | ${p.url}`).join('\n')}
    USÁ ESTOS DATOS EXACTOS. Si el negocio vende en MercadoLibre, analizá precios, reputación y volumen de ventas.
            `;
        } else {
            mercadolibreContext = `
    ═══════════════════════════════════════════
    MERCADOLIBRE: No se encontraron productos del negocio en MercadoLibre.
    ═══════════════════════════════════════════
            `;
        }
    }

    // Ad Intelligence contexts
    let googleAdsContext = '';
    if (googleAdsData) {
        const searchedDomain = googleAdsData.searchedDomain ? `\n    📌 FUENTE: Dominio buscado: ${googleAdsData.searchedDomain}` : '';
        if (googleAdsData.isRunningAds) {
            googleAdsContext = `
    ═══════════════════════════════════════════
    GOOGLE ADS — DATOS REALES (Transparency Center):${searchedDomain}
    ═══════════════════════════════════════════
    Anunciante: ${googleAdsData.advertiserName}
    Verificación: ${googleAdsData.verificationStatus || 'N/A'}
    Total anuncios encontrados: ${googleAdsData.totalAds}
    ${googleAdsData.ads?.slice(0, 5).map((a: any, i: number) => `    ${i + 1}. Formato: ${a.format} | Plataformas: ${a.platforms?.join(', ') || 'N/A'} | Desde: ${a.firstShown} | Contenido: "${(a.content || '').slice(0, 100)}"`).join('\n')}
    PAUTA EN GOOGLE ✅ — Esto indica inversión activa en publicidad digital.
            `;
        } else {
            googleAdsContext = `
    GOOGLE ADS: No se encontraron anuncios activos en Google Ads Transparency Center.${searchedDomain}
    NO pauta en Google ❌
            `;
        }
    }

    let tiktokAdsContext = '';
    if (tiktokAdsData && tiktokAdsData.found) {
        tiktokAdsContext = `
    ═══════════════════════════════════════════
    TIKTOK CREATIVE CENTER — TOP ADS DEL NICHO:
    ═══════════════════════════════════════════
    ${tiktokAdsData.ads?.slice(0, 5).map((a: any, i: number) => `    ${i + 1}. Marca: ${a.brandName} | Caption: "${(a.caption || '').slice(0, 80)}" | Likes: ${a.likes} | CTR: ${a.ctrRank} | Industria: ${a.industry}`).join('\n')}
    Estos son los anuncios más exitosos del nicho en TikTok. Usá esto para recomendar estrategia de contenido pago.
        `;
    }

    let linkedinAdsContext = '';
    if (linkedinAdsData) {
        if (linkedinAdsData.isRunningAds) {
            linkedinAdsContext = `
    ═══════════════════════════════════════════
    LINKEDIN ADS — DATOS REALES (Ad Library):
    ═══════════════════════════════════════════
    Total anuncios: ${linkedinAdsData.totalAds}
    ${linkedinAdsData.ads?.slice(0, 5).map((a: any, i: number) => `    ${i + 1}. Formato: ${a.format} | CTA: "${a.ctaText}" | Copy: "${(a.body || '').slice(0, 100)}" | Desde: ${a.startDate}`).join('\n')}
    PAUTA EN LINKEDIN ✅
            `;
        } else {
            linkedinAdsContext = `
    LINKEDIN ADS: No se encontraron anuncios activos. NO pauta en LinkedIn ❌
            `;
        }
    }

    // Build scraper context (from real HTML fetch)
    let scraperContext = '';
    if (input.scraperData) {
        const sd = input.scraperData;
        scraperContext = `
    ═══════════════════════════════════════════
    REAL DATA EXTRACTED FROM WEBSITE HTML (use this as ground truth):
    ═══════════════════════════════════════════
    - Final URL: ${sd.url || 'N/A'}
    - SSL: ${sd.hasSSL ? 'Yes ✅' : 'No ❌'}
    - Platform: ${sd.platform || 'Not detected'}
    - Social Links Found in HTML: ${sd.socialLinks?.map((s: any) => `${s.platform}: ${s.url}`).join('\n      ') || 'None'}
    - Marketing Tools Detected: ${sd.detectedTools?.join(', ') || 'None'}
    - Meta Tags:
      · Title: ${sd.metaTags?.title || 'Missing!'}
      · Description: ${sd.metaTags?.description || 'Missing!'}
      · OG Title: ${sd.metaTags?.ogTitle || 'Missing'}
      · OG Image: ${sd.metaTags?.ogImage || 'Missing'}
      · Viewport: ${sd.metaTags?.viewport || 'Missing (not mobile-optimized!)'}
      · Robots: ${sd.metaTags?.robots || 'Not set'}
    - Contact Info:
      · Emails: ${sd.contactInfo?.emails?.join(', ') || 'None found'}
      · Phones: ${sd.contactInfo?.phones?.join(', ') || 'None found'}
    - Schema.org Structured Data: ${sd.schemaOrg?.length > 0 ? sd.schemaOrg.map((s: any) => `${s.type}: ${s.name || ''}`).join(', ') : 'None detected ❌'}
    - Conversion Elements:
      · WhatsApp Button: ${sd.conversionElements?.hasWhatsAppButton ? 'Yes' : 'No'}
      · Email Capture: ${sd.conversionElements?.hasEmailCapture ? 'Yes' : 'No'}
      · Clear CTAs: ${sd.conversionElements?.hasClearCTAs ? 'Yes' : 'No'}
      · Search Bar: ${sd.conversionElements?.hasSearchBar ? 'Yes' : 'No'}
      · Cart: ${sd.conversionElements?.hasCart ? 'Yes' : 'No'}
      · Live Chat: ${sd.conversionElements?.hasLiveChat ? 'Yes' : 'No'}
    - Site Metrics:
      · Page Size: ${sd.siteMetrics?.pageSizeKb || '?'} KB
      · Images: ${sd.siteMetrics?.imageCount || '?'}
      · External Scripts: ${sd.siteMetrics?.scriptCount || '?'}
      · CSS Files: ${sd.siteMetrics?.cssCount || '?'}
      · Products on Page: ${sd.siteMetrics?.productCountOnPage || 'N/A'}
      · Has Blog: ${sd.siteMetrics?.hasBlog ? 'Yes' : 'No'}
      · Language: ${sd.siteMetrics?.detectedLanguage || 'Not specified'}
    
    ⚠️ INFERENCIAS AUTOMÁTICAS:
    - SI VES "Meta Pixel (Facebook)" en Marketing Tools, ASUMÍ QUE CORREN ADS EN META (Facebook/Instagram).
    - SI VES "Google Ads" o "Google Tag Manager", ASUMÍ QUE CORREN ADS EN GOOGLE.
    - REVISÁ ATENTAMENTE los 'Social Links Found in HTML' para ver si está Mercado Libre, LinkedIn, etc.
    
    USE THIS DATA! It was extracted from the REAL HTML. Don't contradict it.
    ═══════════════════════════════════════════
        `;
    }

    // Build SERP context
    let serpContext = '';
    if (input.serpData && input.serpData.length > 0) {
        serpContext = `
    ═══════════════════════════════════════════
    DATOS REALES DE POSICIONAMIENTO EN GOOGLE (SERP):
    ═══════════════════════════════════════════
    Buscamos palabras clave reales en Google Argentina. Estos son los resultados exactos:
    
    ${input.serpData.map(s => {
        let block = `    - Búsqueda: "${s.query}"\n`;
        block += `      * Posición del usuario: ${s.userPosition ? `#${s.userPosition} (vía ${s.userMatchedBy})` : 'NO APARECE en el Top 10 ❌'}\n`;
        if (s.competitorPositions && s.competitorPositions.length > 0) {
            block += `      * Competidores detectados: ${s.competitorPositions.map(c => `${c.name} (#${c.position})`).join(', ')}\n`;
        }
        if (s.userInLocalPack) {
            block += `      * ¡USUARIO APARECE EN LOCAL PACK (Mapa)!\n`;
        }
        if (s.organicResults && s.organicResults.length > 0) {
            block += `      * Top 3 Resultados orgánicos:\n`;
            s.organicResults.slice(0, 3).forEach(org => {
                block += `        #${org.position} - ${org.title} (${org.url})\n`;
                if (org.isFeaturedSnippet) block += `          (Este resultado es un FEATURED SNIPPET)\n`;
            });
        }
        return block;
    }).join('\n')}
    
    IMPORTANTE: USÁ ESTA INFORMACIÓN para redactar la sección 'seoAnalysis'.
    Si el usuario no aparece, resáltalo en ROJO como Riesgo o en Oportunidades.
    Si MercadoLibre u otro marketplace gana los primeros puestos, dáselo como Insight.
    Si el competidor le gana, inclúyelo en el Competitor Benchmark.
    ═══════════════════════════════════════════
        `;
    }

    const socialUrlsContext = [
        input.instagramUrl ? `Instagram: ${input.instagramUrl}` : null,
        input.tiktokUrl ? `TikTok: ${input.tiktokUrl}` : null,
        input.linkedinUrl ? `LinkedIn: ${input.linkedinUrl}` : null,
        input.facebookUrl ? `Facebook: ${input.facebookUrl}` : null,
        input.youtubeUrl ? `YouTube: ${input.youtubeUrl}` : null,
        input.xUrl ? `X (Twitter): ${input.xUrl}` : null,
        input.pinterestUrl ? `Pinterest: ${input.pinterestUrl}` : null,
        input.googleMapsUrl ? `Google Maps / Business: ${input.googleMapsUrl}` : null,
        ...(input.marketplaces?.map(m => `Marketplace — ${m.platform}: ${m.storeName || 'Sí, vende ahí'}`) || []),
    ].filter(Boolean).join('\n    ');

    // Build competitor data context from real scraping
    let competitorDataContext = '';
    if (competitorScrapedData.length > 0) {
        competitorDataContext = `
    ═══════════════════════════════════════════
    DATOS REALES DE COMPETIDORES (SCRAPEADOS DE SUS WEBS):
    ═══════════════════════════════════════════
    El usuario proporcionó estos competidores directos. Usá ESTOS datos para el competitorBenchmark.
    NO inventes otros competidores. Usá los que el usuario te dio.

    ${competitorScrapedData.map((c, i) => {
        let block = `--- COMPETIDOR ${i + 1}: ${c.name} ---\n    Web: ${c.website}`;
        if (c.webData) {
            block += `\n    Plataforma: ${c.webData.platform || 'Desconocida'}`;
            block += `\n    SSL: ${c.webData.hasSSL ? 'Sí' : 'No'}`;
            block += `\n    Herramientas: ${c.webData.detectedTools?.join(', ') || 'Ninguna detectada'}`;
            block += `\n    Meta Title: ${c.webData.metaTags?.title || 'Sin título'}`;
            block += `\n    Meta Description: ${c.webData.metaTags?.description || 'Sin descripción'}`;
            block += `\n    Redes encontradas en su web: ${c.webData.socialLinks?.map(s => `${s.platform}: ${s.url}`).join(', ') || 'Ninguna'}`;
            block += `\n    Email capture: ${c.webData.conversionElements?.hasEmailCapture ? 'Sí' : 'No'}`;
            block += `\n    WhatsApp: ${c.webData.conversionElements?.hasWhatsAppButton ? 'Sí' : 'No'}`;
            block += `\n    Blog: ${c.webData.siteMetrics?.hasBlog ? 'Sí' : 'No'}`;
            block += `\n    Productos visibles: ${c.webData.siteMetrics?.productCountOnPage || 'N/A'}`;
        } else {
            block += `\n    (No se pudo scrappear la web)`;
        }
        if (c.igData) {
            block += `\n    Instagram: @${c.igData.username}`;
            block += `\n    IG Seguidores: ${c.igData.followersCount?.toLocaleString() || '0'}`;
            block += `\n    IG Posts: ${c.igData.postsCount || '0'}`;
            block += `\n    IG Verificado: ${c.igData.isVerified ? 'Sí' : 'No'}`;
            block += `\n    IG Bio: ${c.igData.biography || 'Sin bio'}`;
            // Include latest posts engagement for comparison
            const igPosts = c.igData.latestPosts || [];
            if (igPosts.length > 0) {
                const avgLikes = Math.round(igPosts.reduce((sum: number, p: any) => sum + (p.likesCount || 0), 0) / igPosts.length);
                const avgComments = Math.round(igPosts.reduce((sum: number, p: any) => sum + (p.commentsCount || 0), 0) / igPosts.length);
                block += `\n    IG Engagement promedio: ${avgLikes} likes, ${avgComments} comentarios por post`;
            }
        } else {
            block += `\n    Instagram: No encontrado`;
        }
        return block;
    }).join('\n\n    ')}

    ⚠️ REGLA: Usá ÚNICAMENTE estos competidores en 'competitorBenchmark'.
    Compará sus datos reales (seguidores, herramientas, SEO) con los del cliente.
    ═══════════════════════════════════════════
        `;
    }

    const prompt = `
    ===================================================================
    ROL: Sos un auditor de presencia digital de élite y estratega de negocios.
    Cobrás $10,000 USD por auditoría. Tus informes son LEGENDARIOS porque:
    - Encuentran problemas REALES (no consejos genéricos que cualquiera puede googlear)
    - Le muestran al dueño EXACTAMENTE cuánta plata está perdiendo
    - Dan soluciones paso a paso ordenadas por urgencia
    - Usan lenguaje simple — sin jerga sin explicación
    ===================================================================

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    REGLA ABSOLUTA DE IDIOMA: TODO el informe DEBE estar en español.
    PROHIBIDO usar palabras en inglés EXCEPTO términos técnicos universales
    (SEO, CRM, engagement, email, blog, e-commerce, etc.).
    Cada término técnico DEBE ir seguido de explicación entre paréntesis.
    Ejemplo: "SEO (cómo te encuentra la gente en Google)"
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    CLIENTE: ${businessName}
    RUBRO: ${industry}
    SITIO WEB: ${input.websiteUrl}
    ${socialUrlsContext ? `REDES SOCIALES:\n    ${socialUrlsContext}` : ''}
    ${preScanContext}
    ${igContext}
    ${fbContext}
    ${tiktokContext}
    ${xContext}
    ${linkedinContext}
    ${youtubeContext}
    ${pinterestContext}
    ${metaAdsContext}
    ${googleAdsContext}
    ${tiktokAdsContext}
    ${linkedinAdsContext}
    ${mercadolibreContext}
    ${googleMapsContext}
    ${scraperContext}
    ${competitorDataContext}
    ${deepResearchContext}
    ${businessContext}
    ${userMarketingContext}
    ${input.businessType ? `TIPO DE NEGOCIO: ${input.businessType === 'B2B' ? 'Vende a empresas (B2B)' : input.businessType === 'B2C' ? 'Vende a consumidor final (B2C)' : 'Vende a ambos (B2B + B2C)'}` : ''}

    ===================================================================
    INSTRUCCIONES — LEER CON ATENCIÓN
    ===================================================================
    
    Basá tu análisis en la INVESTIGACIÓN REAL proporcionada arriba. Esos datos fueron obtenidos buscando en Google.
    Para CADA número que reportes (seguidores, reseñas, rating), usá los datos de la investigación.

    ⚠️ REGLA ANTI-ALUCINACIÓN:
    - Si la investigación previa dice que publican reels diarios con la dueña hablando, NO digas que "falta humanidad" o que "no publican reels".
    - Si la web tiene mínimos de compra, NO digas que "confunde si es mayorista o minorista".
    - Si las fotos son de modelos vistiendo las prendas, NO digas que "las fotos son de fondo blanco".
    - LEÉLA INVESTIGACIÓN PREVIA con atención y basá tu análisis en esos datos reales.
    - Si contradecís la investigación previa sin evidencia, tu reporte pierde toda credibilidad.

    ⚠️ REGLA DE PLATAFORMA:
    - Si la plataforma es Tienda Nube, tené en cuenta qué se puede y qué no se puede controlar en esa plataforma.
    - No recomiendes cambios de SEO técnico que Tienda Nube no permita (ej: schema markup custom, server config).
    - SÍ recomendá lo que se puede hacer: títulos, descripciones, blog, Google Business, etc.
    Si no encontrás un dato en la investigación, poné "No verificado".

    ⚠️ REGLA ANTI-AFIRMACIONES CATEGÓRICAS (MUY IMPORTANTE):
    - NUNCA digas "no hace X" de forma categórica si NO tenés evidencia directa.
    - En vez de "No hace email marketing" → "No encontramos evidencia de email marketing activo. Si usás alguna plataforma, mencionalo."
    - En vez de "No tiene presencia humana" → "Basándonos en los datos disponibles, no pudimos confirmar contenido con presencia de personas."
    - En vez de "No invierte en publicidad" → "No encontramos anuncios activos en Meta/Google Ads Library."
    - Si el usuario DECLARÓ que hace algo (ver sección DATOS DECLARADOS), USALO como verdad.
    - Si tenés datos SCRAPEADOS que confirman algo, USALOS como verdad.
    - Si NO tenés datos, sé CAUTELOSO y usá lenguaje como "no pudimos verificar" o "no encontramos evidencia".
    - EXCEPCIÓN: Si la investigación previa o el scraping CONFIRMAN explícitamente algo, podés ser categórico.

    ⚠️ REGLA DE EQUIPO Y PRESUPUESTO:
    - Si el usuario declaró que maneja el marketing solo, NO recomiendes contratar un equipo de 5 personas.
    - Ajustá las recomendaciones al presupuesto y capacidad del usuario.
    - Las recomendaciones deben ser REALIZABLES con los recursos declarados.

    TU AUDITORÍA DEBE INCLUIR TODAS ESTAS SECCIONES:

    ═══════════════════════════════════════════
    1. RADIOGRAFÍA RÁPIDA (snapshot)
    ═══════════════════════════════════════════
    - digitalMaturityScore: Puntaje de madurez digital (0-100)
    - scoreBreakdown: Objeto con puntaje por área: { web: number, seo: number, redesSociales: number, reputacion: number, emailCrm: number, iaReadiness: number }
      Cada uno de 0 a 100.
    - scoreExplanation: STRING de 3-4 oraciones explicando POR QUÉ el puntaje es ese número.
      DEBE decir exactamente qué le falta al negocio para llegar a 100. Ejemplo:
      "Tu puntaje es 32/100. Perdés puntos principalmente por: no tener blog activo (-15 pts), 
      TikTok sin actividad (-12 pts), no responder reseñas de Google (-10 pts), 
      no tener email marketing (-8 pts). Para subir a 70+, priorizá activar el blog y TikTok."
    - plataformaDetectada: string (ej: "Tiendanube", "Shopify", "WordPress")
    - canalesActivos: string[] — lista de canales donde tiene presencia

    ═══════════════════════════════════════════
    2. HALLAZGOS CRÍTICOS (findings array — EL CORAZÓN DEL INFORME)
    ═══════════════════════════════════════════
    Encontrá 8-15 problemas específicos. Para CADA hallazgo:
    - title: Título corto y claro (ej: "Tu header ocupa la mitad de la pantalla")
    - area: Área (web_ux, seo, redes_sociales, reputacion, conversion, naming, contenido, tecnico)
    - severity: critical / warning / opportunity
    - diagnosis: Qué EXACTAMENTE está mal, con detalles específicos (URLs, elementos exactos)
    - whyItMatters: Por qué esto cuesta plata, en lenguaje simple
    - moneyImpact: Impacto estimado en $ o % (ej: "~30% de visitantes se van antes de ver tus productos")
    - fix: Paso a paso qué hacer para solucionarlo, en lenguaje simple
    - effort: quick_fix (< 1 hora) / medium (1-7 días) / major (necesita especialista)
    
    EJEMPLOS DE HALLAZGOS REALES (esta es la calidad que espero):
    - "Tenés 3 URLs rotas en tu catálogo → cada click ahí es una venta perdida + Google te penaliza"
    - "Tus productos se llaman 'Loop 100 cm PET mate piom' → nadie busca así. Renombrar a 'Cinta decorativa...' te daría +40% de tráfico"
    - "Tu header ocupa el 50% de la pantalla → el usuario no ve productos, se va"
    - "Mostrás productos sin stock en la home → genera frustración"
    - "Tenés blog creado pero 0 artículos → regalando tráfico orgánico a la competencia"
    
    ORDENAR por severidad: critical primero, luego warning, luego opportunity.

    ═══════════════════════════════════════════
    3. AUDITORÍA WEB TÉCNICA (webTechnical)
    ═══════════════════════════════════════════
    overallScore: good/needs_work/critical
    ssl, sitemap, robotsTxt: boolean
    pageSpeedScore, mobileReadiness: string descriptivo
    detectedTools: array de {name, status}
    conversionReadyAudit: { details: string }
    schemaMarkup: { recommendation: string }
    EXPLICAR cada término técnico: "SSL (el candado de seguridad en la barra del navegador)".

    ═══════════════════════════════════════════
    4. ANÁLISIS SEO (seoAnalysis)
    ═══════════════════════════════════════════
    overallScore: good/needs_work/critical
    blogStatus, metaTagsStatus, keywordGapAnalysis, contentAuthorityScore: strings descriptivos
    productNamingIssues: array de { currentName, problem, suggestedName }
    localSeoCheck: { localReviewSummary: string }

    ═══════════════════════════════════════════
    5. PREPARACIÓN PARA IAs — AEO (aiReadiness)
    ═══════════════════════════════════════════
    overallScore: ready/partial/invisible
    summary: string explicando en lenguaje simple si las IAs recomiendan este negocio
    structuredData: { detected: boolean, recommendation: string }
    qaContent: { hasQaFormat: boolean, recommendation: string }
    llmsTxt: { exists: boolean, recommendation: string }
    eeatScore: string
    aiCrawlerAccess: { blocked: string[], recommendation: string }
    ⚠️ PARA CADA SUB-SECCIÓN, incluí PASOS CONCRETOS que el usuario pueda seguir:
    - structuredData.recommendation → "Paso 1: Ir a tu panel de Tienda Nube > SEO. Paso 2: ..."
    - qaContent.recommendation → "Creá una página de Preguntas Frecuentes con al menos 10 preguntas reales de tus clientes."
    - llmsTxt.recommendation → "Creá un archivo llamado llms.txt en la raíz de tu sitio con: [template]"
    - eeatScore → "Para mejorar tu E-E-A-T: 1. Agregá una página 'Sobre Nosotros' con fotos del equipo. 2. ..."
    Las recomendaciones DEBEN ser ejecutables por una persona no técnica.

    ═══════════════════════════════════════════
    6. AUDITORÍA DE REDES SOCIALES (socialMediaAudit array)
    ═══════════════════════════════════════════
    Para CADA plataforma (incluí las que FALTAN y deberían tener).
    ⚠️ OBLIGATORIO: si recibiste datos reales de una plataforma arriba, DEBÉS incluirla con sus números exactos.
    NO OMITAS NINGUNA PLATAFORMA QUE TENGA DATOS REALES.
    - platform: nombre
    - status: strong/moderate/weak/absent
    - followers: string con número real
    - engagementRate: string
    - postingFrequency: string (ej: "3 posts por semana" o "Inactivo hace 2 meses")
    - recommendation: string con recomendación general
    - personaCrossRef: string conectando con buyer personas
    - topPosts: array de objetos con los posts más exitosos de la cuenta (url, caption, likes, comments). OBLIGATORIO si hay datos reales provistos.
    
    🔥 NUEVO — ESTRATEGIA DE CONTENIDO (esto es lo que más valor agrega):
    - contentTypesRecommended: array de 3-5 strings con tipos de contenido ESPECÍFICOS al rubro.
      NO genéricos. Ejemplos para una tienda de insumos de repostería:
      ["Reels mostrando técnicas de decoración con tus productos", 
       "Carruseles paso a paso de recetas usando tus insumos",
       "Stories con encuestas: ¿Qué topping preferís?",
       "Videos comparando calidad de ingredientes premium vs económicos",
       "Testimonios de clientes mostrando sus tortas terminadas"]
    - aestheticRecommendation: string describiendo cómo debería verse el feed visualmente.
      Incluir: paleta de colores sugerida, estilo de fotos, consistencia visual.
      Ejemplo: "Tu feed debería tener una paleta cálida (tonos crema, rosa pastel, dorado) 
      con fotos de productos en luz natural sobre fondos claros. Usá siempre la misma tipografía 
      en tus diseños. Evitá fotos oscuras o con flash directo."
    - postingSchedule: string con frecuencia ideal y mejores horarios.
      Ejemplo: "Publicar mínimo 4 veces por semana. Mejores horarios: Lu-Vi 12-14hs y 19-21hs. 
      Sábado 10-12hs. Usar Stories diariamente."
    - contentPillars: array de 3-4 strings con pilares de contenido.
      Ejemplo: ["Educativo (tutoriales y tips)", "Behind the scenes (tu proceso)", 
      "Social proof (clientes y testimonios)", "Producto (catálogo con contexto)"]
    
    ⚠️ OBLIGATORIO: incluí una entry para CADA plataforma donde el usuario tiene presencia.
    Si tiene Facebook, TikTok, LinkedIn, YouTube → incluí CADA UNA con estrategia específica.
    NO omitas ninguna red que tenga datos reales.

    ═══════════════════════════════════════════
    7. IDENTIDAD VISUAL DIGITAL (visualIdentityAudit) — NUEVO
    ═══════════════════════════════════════════
    Analizá la coherencia visual del negocio entre web y redes sociales:
    - overallScore: string (ej: "Inconsistente", "Básica", "Profesional", "Premium")
    - brandConsistency: string — ¿Usa los mismos colores/logo en web y redes?
    - photoQuality: string — Calidad de fotos de productos/servicios
    - feedAesthetic: string — ¿El feed de redes tiene un estilo visual coherente?
    - recommendations: array de 3-5 strings con recomendaciones CONCRETAS y ACCIONABLES.
      Ejemplo: ["Definir una paleta de 3-4 colores y usarla en TODOS los posts",
      "Invertir en sesión de fotos profesional de productos (presupuesto estimado: $50-200 USD)",
      "Crear 3 templates en Canva para mantener consistencia visual"]

    ═══════════════════════════════════════════
    8. PERCEPCIÓN DEL CLIENTE (customerPerception) — NUEVO
    ═══════════════════════════════════════════
    Basándote en reviews de Google, comentarios en redes, y tono de comunicación del negocio:
    - currentImage: string — ¿Qué imagen proyecta HOY el negocio? (2-3 oraciones)
    - idealImage: string — ¿Qué imagen DEBERÍA proyectar? (2-3 oraciones)  
    - gaps: array de 2-3 strings — Diferencias entre imagen actual e ideal
    - quickWins: array de 2-3 strings — Acciones rápidas para mejorar la percepción

    ═══════════════════════════════════════════
    9. REPUTACIÓN ONLINE (reputationAnalysis)
    ═══════════════════════════════════════════
    overallSentiment: string (positive/mixed/negative)
    googleReviews: { rating: number o string, count: number o string, trend: string }
    responseRate: string
    Sé específico con ejemplos de reviews y cómo responderlas.

    ═══════════════════════════════════════════
    10. BENCHMARK vs COMPETIDORES (competitorBenchmark array)
    ═══════════════════════════════════════════
    ⚠️ CRÍTICO: Usá ÚNICAMENTE los competidores que aparecen en la sección 
    "DATOS REALES DE COMPETIDORES" de arriba. El usuario los proporcionó personalmente.
    NO inventes otros competidores. NO busques con Google Search.
    Compará los datos REALES scrapeados (seguidores de IG, herramientas, SSL, meta tags) 
    con los del cliente y sacá conclusiones.
    
    Para CADA competidor, TODOS estos campos son OBLIGATORIOS (no dejar ninguno vacío):
    - competitorName: string (el nombre que el usuario proporcionó)
    - website: string (la URL que el usuario proporcionó)
    - whatTheyDoBetter: string — basándote en datos REALES, qué hacen mejor que el cliente
    - whatClientDoesBetter: string — basándote en datos REALES, qué hace mejor el cliente
    - followers: string — número de seguidores (dato real scrapeado)
    - engagementRate: string — tasa de interacción (dato real scrapeado)
    - topPosts: array de objetos con sus posts más exitosos (url, caption, likes, comments). OBLIGATORIO si hay datos reales provistos.
    - contentStrategyGap: string — diferencia en estrategia de contenido basada en datos reales
    - keyTakeaway: string — qué puede aprender/copiar el cliente de este competidor
    PROHIBIDO dejar campos vacíos. Si no pudimos scrappear un dato, poné "No se pudo verificar".
    
    ⚠️ INTERPRETACIÓN PROFESIONAL OBLIGATORIA:
    Para CADA competidor, incluí un campo 'professionalInterpretation' (string, 2-3 párrafos) con:
    - Qué podés aprender de este competidor
    - Qué errores están cometiendo que VOS podrías explotar
    - Recomendación concreta de acción basada en la comparación
    Escribí como un consultor de marketing que le habla a su cliente.

    ═══════════════════════════════════════════
    11. EMAIL & CRM (emailCrmAssessment)
    ═══════════════════════════════════════════
    hasEmailCapture: boolean
    emailPlatformDetected: string
    leadNurturingScore: string (good/needs_work/critical)
    crmMaturity: string
    recommendations: array de strings (NO objetos, solo strings simples)

    ═══════════════════════════════════════════
    12. REFERENTES DEL RUBRO (industryLeaders array, 3-5)
    ═══════════════════════════════════════════
    Encontrá 3-5 líderes/influencers en ESTE EXACTO rubro.
    Para cada uno:
    - name, platform, profileUrl (URL real), followers, engagementRate: strings
    - strategy: string describiendo su estrategia
    - topPosts: array de { description: string, engagement: string, url: string }
    - lessonsForUser: string con lecciones ESPECÍFICAS que el cliente puede replicar

    ═══════════════════════════════════════════
    13. PLAN DE ACCIÓN (opportunities array, 8-12 items)
    ═══════════════════════════════════════════
    Categoría: "Corrección Urgente" / "Victoria Rápida" / "Inversión Estratégica"
    Para cada una: 
    - title: string
    - category: string (una de las 3 categorías de arriba)
    - impact: high/medium/low
    - effort: string
    - estimatedRoi: string
    - description: string con explicación en lenguaje simple

    ═══════════════════════════════════════════
    14. RIESGOS (risks array, 4-6)
    ═══════════════════════════════════════════
    - risk: string (título del riesgo)
    - severity: high/medium/low
    - detail: string (explicación)
    - mitigation: string (cómo mitigarlo)

    ═══════════════════════════════════════════
    15. VEREDICTO FINAL
    ═══════════════════════════════════════════
    - digitalHealthGrade: string — A/B/C/D/F
    - executiveSummary: STRING (no objeto). 3 párrafos separados por \\n\\n:
      P1: Dónde está parado el negocio hoy. P2: Qué funciona bien. P3: Qué necesita atención urgente.
      Escribí cálidamente, como hablándole a un amigo. Usá "tu negocio", "vos".
    - moneyOnTheTable: array de { area: string, description: string, estimatedLoss: string }
      Cuantificá 3-5 oportunidades perdidas específicas.
    - roadmap: DEBE ser un ARRAY de exactamente 3 objetos con esta estructura:
      [
        { "phase": "30 días", "focus": "string con foco principal", "actions": ["acción 1", "acción 2", "acción 3"], "kpis": ["métrica 1", "métrica 2"] },
        { "phase": "60 días", "focus": "string con foco principal", "actions": ["acción 1", "acción 2", "acción 3"], "kpis": ["métrica 1", "métrica 2"] },
        { "phase": "90 días", "focus": "string con foco principal", "actions": ["acción 1", "acción 2", "acción 3"], "kpis": ["métrica 1", "métrica 2"] }
      ]
      Cada acción DEBE ser un string simple, NO un objeto. Cada KPI DEBE ser un string simple.

    ═══════════════════════════════════════════
    16. PLAN DE CRECIMIENTO DIGITAL (MUY IMPORTANTE)
    ═══════════════════════════════════════════
    Esta es la sección MÁS VALIOSA. El usuario necesita un PLAN ACCIONABLE para escalar ventas.

    16a. competitorComparison — Comparación numérica REAL con competidores:
    { platforms: [{ platform: "Instagram", userMetrics: { followers: 3200, engagement: "1.2%", postFreq: "2/sem" }, competitors: [{ name: "CompX", followers: 15000, engagement: "3.5%", postFreq: "5/sem" }] }] }
    USÁLOS DATOS REALES de los scrapers. No inventar.

    16b. channelStrategies — Estrategia ESPECÍFICA por cada red social:
    Array con: platform, currentState (estado actual con números), strategy (qué hacer), 
    contentTypes (["Reels educativos", "Carruseles"]), postingSchedule ("Lun/Mié/Vie 18hs"),
    budgetSuggestion ("$50-100 USD/mes"), expectedResults ("En 90d: +2000 seg"),
    kpis: [{ metric: "Seguidores", current: "3,200", target30d: "4,000", target90d: "6,500" }]

    16c. adStrategy — Estrategia publicitaria:
    currentAdSpend, competitorAdActivity (qué pautan los competidores, usá datos de Meta Ads),
    recommendedBudget, recommendedPlatforms, adTypes: [{ type, why, budget }]

    16d. influencerStrategy — Influencers del nicho:
    recommendedTier ("micro-influencers 5K-50K"), suggestedProfiles: [{ name, platform, followers, niche, whyRelevant }],
    collaborationIdeas, estimatedCost

    16e. marketplaceAnalysis — Solo si hay datos de MercadoLibre:
    platform, currentPresence, topProducts: [{ title, price, soldQty }], competitorPricing, recommendations

    ═══════════════════════════════════════════
    17. SOCIAL PROOF — PRUEBA SOCIAL (socialProof)
    ═══════════════════════════════════════════
    La confianza es la moneda de cambio en digital. Analizá:
    - overallSentiment: 'very_positive' | 'positive' | 'mixed' | 'negative' | 'critical'
    - trustScore: número 1-100 basado en reseñas, comentarios, engagement
    - googleReviewsAnalysis: { averageRating, totalReviews, positiveThemes: ["servicio rápido", "buena calidad"], negativeThemes: ["demoras"], samplePositive: "CITA LITERAL de reseña positiva", sampleNegative: "CITA LITERAL de reseña negativa" }
    - socialMentions: para cada red con datos, { platform, sentiment, topComment: "cita literal del comentario más relevante", context: "en un post sobre X" }
    - recommendations: acciones concretas para mejorar la prueba social
    IMPORTANTE: CITÁ TEXTUALMENTE reseñas y comentarios reales de los datos scrapeados.

    ═══════════════════════════════════════════
    18. ANÁLISIS DEL FUNNEL / EMBUDO (funnelAnalysis)
    ═══════════════════════════════════════════
    ¿Cómo llega hoy un cliente y dónde se pierde?
    - stages: array con 3-4 etapas del embudo:
      { stage: "Descubrimiento", channels: ["Instagram", "Google"], currentState: "Genera alcance con Reels", bottleneck: "No tiene CTA en bio", fix: "Agregar link de WhatsApp Business en bio" }
      { stage: "Consideración", channels: ["Web", "WhatsApp"], ... }
      { stage: "Conversión", channels: ["WhatsApp", "Local"], ... }
    - conversionPaths: ["Instagram → WhatsApp → Compra", "Google Maps → Llamada"] — las rutas reales
    - biggestLeak: "El 70% de los visitantes abandona porque no hay catálogo online" — la fuga más grande

    ═══════════════════════════════════════════
    19. IDENTIDAD DE CONTENIDO (contentIdentityAudit)
    ═══════════════════════════════════════════
    ¿El feed comunica profesionalismo o es solo un catálogo de ofertas?
    - visualScore: 1-10 (calidad visual del contenido publicado)
    - toneOfVoice: "informal y cercano" / "corporativo" / "puramente transaccional"
    - contentMix: [{ type: "Educativo", percentage: "10%" }, { type: "Venta directa", percentage: "70%" }, { type: "Detrás de escena", percentage: "5%" }, { type: "Entretenimiento", percentage: "15%" }]
    - isTransactionalOnly: true/false — ¿Solo publican ofertas?
    - valueContentRatio: "20% valor / 80% venta" — proporción de contenido que aporta vs que vende
    - brandConsistency: "Los colores y tipografía son consistentes" o "Cada post tiene un estilo diferente"
    - recommendations: qué cambiar para mejorar la identidad visual y de contenido

    ═══════════════════════════════════════════
    REGLAS DE CALIDAD — LEER ESTO
    ═══════════════════════════════════════════
    ❌ PROHIBIDO dar consejos genéricos ("mejorá tu SEO") — dar pasos EXACTOS
    ❌ PROHIBIDO inventar números — VERIFICAR con Google Search o decir "no verificado"
    ❌ PROHIBIDO jerga sin explicar — siempre agregar "(es decir, ...)" después de términos técnicos
    ❌ PROHIBIDO repetir el mismo hallazgo en distintas secciones
    ❌ PROHIBIDO dejar campos vacíos — si no hay data, poner "No disponible" o "No verificado"
    ❌ PROHIBIDO usar inglés excepto términos técnicos universales
    ✅ SER ESPECÍFICO a ESTE negocio, ESTE rubro, ESTOS productos
    ✅ CUANTIFICAR todo — horas, %, $, seguidores
    ✅ CRUZAR personas del análisis estratégico con hallazgos de redes sociales
    ✅ Que el usuario sienta que REALMENTE investigaste su negocio en profundidad
    ✅ executiveSummary y moneyOnTheTable deben ser los más impactantes del informe
    ✅ channelStrategies DEBEN ser ultra-específicas: qué contenido, cuándo, cuánto invertir, qué esperar
    ✅ CITAR posts reales del usuario y competidores cuando analices contenido

    FORMATO DE RESPUESTA: Devolver SOLO JSON válido (sin code fences de markdown, sin texto extra antes/después).
    El JSON DEBE tener estas claves de primer nivel:
    snapshot, findings, webTechnical, seoAnalysis, aiReadiness, socialMediaAudit, 
    reputationAnalysis, competitorBenchmark, emailCrmAssessment, industryLeaders, 
    opportunities, risks, digitalHealthGrade, executiveSummary, moneyOnTheTable, roadmap,
    visualIdentityAudit, customerPerception,
    competitorComparison, channelStrategies, adStrategy, influencerStrategy, marketplaceAnalysis,
    socialProof, funnelAnalysis, contentIdentityAudit
    
    IMPORTANTE: executiveSummary DEBE ser un STRING (no un objeto).
    recommendations dentro de emailCrmAssessment DEBE ser un array de STRINGS (no objetos).
    roadmap DEBE ser un ARRAY de 3 objetos (no un objeto con days30/days60/days90).
    moneyOnTheTable DEBE ser un ARRAY de objetos con {area, description, estimatedLoss}.

    SECCIONES EXTENDIDAS (socialProof, funnelAnalysis, contentIdentityAudit, competitorComparison,
    channelStrategies, adStrategy, influencerStrategy, marketplaceAnalysis):
    Cada una DEBE ser un STRING que contenga JSON válido. Por ejemplo:
    socialProof: "{\"trustScore\":75,\"overallSentiment\":\"Positivo\",\"googleReviewsAnalysis\":{\"averageRating\":4.2,\"totalReviews\":50,\"positiveThemes\":[\"buen servicio\"],\"negativeThemes\":[\"demoras\"],\"samplePositive\":\"...\",\"sampleNegative\":\"...\"},\"socialMentions\":[],\"recommendations\":[\"...\"]}"
    channelStrategies: "[{\"channel\":\"Instagram\",\"currentStatus\":\"Activo\",\"priority\":\"Alta\",\"quickWins\":[\"...\"],\"contentIdeas\":[\"...\"],\"postingFrequency\":\"3x/semana\",\"kpis\":[\"...\"]}]"
    `;


    // WARNING: We must call Gemini directly here because the proxy edge function has a 10s timeout
    // which this massive payload easily exceeds during the 'thinking' phase.
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("VITE_GEMINI_API_KEY is not defined.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // We must use gemini-3.1-pro-preview for advanced reasoning (defaulting to it if modelName isn't set properly)
    // Though modelName is passed in from the component
    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 16000 },
            responseMimeType: "application/json",
            responseSchema: buildAuditResponseSchema()
        }
    });

    if (!response.text) {
        throw new Error("Failed to generate Digital Audit.");
    }

    try {
        const parsedResult = JSON.parse(response.text) as DigitalAuditResult;

        let costUsd = researchCostUsd;
        if (response.usageMetadata) {
            costUsd += ((response.usageMetadata.promptTokenCount || 0) * inputTokenPriceUsd) +
                ((response.usageMetadata.candidatesTokenCount || 0) * outputTokenPriceUsd);
        } else {
            const estimatedPromptTokens = prompt.length / 4;
            const estimatedResponseTokens = response.text ? response.text.length / 4 : 8000;
            costUsd = (estimatedPromptTokens * inputTokenPriceUsd) + (estimatedResponseTokens * outputTokenPriceUsd);
        }

        return { result: parsedResult, costUsd };
    } catch (e) {
        console.error("JSON Parse Error", response.text?.substring(0, 500));
        throw new Error("Invalid response format from AI for Digital Audit.");
    }
};

// ── Response Schema (same approach as strategic analysis) ────────────
function buildAuditResponseSchema() {
    return {
        type: Type.OBJECT,
        properties: {
            snapshot: {
                type: Type.OBJECT,
                properties: {
                    digitalMaturityScore: { type: Type.NUMBER },
                    scoreBreakdown: { type: Type.OBJECT, properties: { web: { type: Type.NUMBER }, seo: { type: Type.NUMBER }, redesSociales: { type: Type.NUMBER }, reputacion: { type: Type.NUMBER }, emailCrm: { type: Type.NUMBER }, iaReadiness: { type: Type.NUMBER } } },
                    scoreExplanation: { type: Type.STRING },
                    plataformaDetectada: { type: Type.STRING },
                    canalesActivos: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            },
            findings: {
                type: Type.ARRAY,
                items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, area: { type: Type.STRING }, severity: { type: Type.STRING }, diagnosis: { type: Type.STRING }, whyItMatters: { type: Type.STRING }, moneyImpact: { type: Type.STRING }, fix: { type: Type.STRING }, effort: { type: Type.STRING } } }
            },
            webTechnical: {
                type: Type.OBJECT,
                properties: {
                    overallScore: { type: Type.STRING }, ssl: { type: Type.BOOLEAN }, sitemap: { type: Type.BOOLEAN }, robotsTxt: { type: Type.BOOLEAN },
                    pageSpeedScore: { type: Type.STRING }, mobileReadiness: { type: Type.STRING },
                    detectedTools: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, status: { type: Type.STRING } } } },
                    conversionReadyAudit: { type: Type.OBJECT, properties: { details: { type: Type.STRING } } },
                    schemaMarkup: { type: Type.OBJECT, properties: { recommendation: { type: Type.STRING } } }
                }
            },
            seoAnalysis: {
                type: Type.OBJECT,
                properties: {
                    overallScore: { type: Type.STRING }, blogStatus: { type: Type.STRING }, metaTagsStatus: { type: Type.STRING },
                    keywordGapAnalysis: { type: Type.STRING }, contentAuthorityScore: { type: Type.STRING },
                    productNamingIssues: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { currentName: { type: Type.STRING }, problem: { type: Type.STRING }, suggestedName: { type: Type.STRING } } } },
                    localSeoCheck: { type: Type.OBJECT, properties: { localReviewSummary: { type: Type.STRING } } }
                }
            },
            aiReadiness: {
                type: Type.OBJECT,
                properties: {
                    overallScore: { type: Type.STRING }, summary: { type: Type.STRING },
                    structuredData: { type: Type.OBJECT, properties: { detected: { type: Type.BOOLEAN }, recommendation: { type: Type.STRING } } },
                    qaContent: { type: Type.OBJECT, properties: { hasQaFormat: { type: Type.BOOLEAN }, recommendation: { type: Type.STRING } } },
                    llmsTxt: { type: Type.OBJECT, properties: { exists: { type: Type.BOOLEAN }, recommendation: { type: Type.STRING } } },
                    eeatScore: { type: Type.STRING },
                    aiCrawlerAccess: { type: Type.OBJECT, properties: { blocked: { type: Type.ARRAY, items: { type: Type.STRING } }, recommendation: { type: Type.STRING } } }
                }
            },
            socialMediaAudit: {
                type: Type.ARRAY,
                items: { type: Type.OBJECT, properties: { platform: { type: Type.STRING }, status: { type: Type.STRING }, followers: { type: Type.STRING }, engagementRate: { type: Type.STRING }, postingFrequency: { type: Type.STRING }, recommendation: { type: Type.STRING }, personaCrossRef: { type: Type.STRING }, topPosts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { url: { type: Type.STRING }, caption: { type: Type.STRING }, likes: { type: Type.STRING }, comments: { type: Type.STRING } } } }, contentTypesRecommended: { type: Type.ARRAY, items: { type: Type.STRING } }, aestheticRecommendation: { type: Type.STRING }, postingSchedule: { type: Type.STRING }, contentPillars: { type: Type.ARRAY, items: { type: Type.STRING } } } }
            },
            visualIdentityAudit: {
                type: Type.OBJECT,
                properties: { overallScore: { type: Type.STRING }, brandConsistency: { type: Type.STRING }, photoQuality: { type: Type.STRING }, feedAesthetic: { type: Type.STRING }, recommendations: { type: Type.ARRAY, items: { type: Type.STRING } } }
            },
            customerPerception: {
                type: Type.OBJECT,
                properties: { currentImage: { type: Type.STRING }, idealImage: { type: Type.STRING }, gaps: { type: Type.ARRAY, items: { type: Type.STRING } }, quickWins: { type: Type.ARRAY, items: { type: Type.STRING } } }
            },
            reputationAnalysis: {
                type: Type.OBJECT,
                properties: { overallSentiment: { type: Type.STRING }, googleReviews: { type: Type.OBJECT, properties: { rating: { type: Type.STRING }, count: { type: Type.STRING }, trend: { type: Type.STRING } } }, responseRate: { type: Type.STRING } }
            },
            competitorBenchmark: {
                type: Type.ARRAY,
                items: { type: Type.OBJECT, properties: { competitorName: { type: Type.STRING }, website: { type: Type.STRING }, followers: { type: Type.STRING }, engagementRate: { type: Type.STRING }, whatTheyDoBetter: { type: Type.STRING }, whatClientDoesBetter: { type: Type.STRING }, contentStrategyGap: { type: Type.STRING }, keyTakeaway: { type: Type.STRING }, professionalInterpretation: { type: Type.STRING }, topPosts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { url: { type: Type.STRING }, caption: { type: Type.STRING }, likes: { type: Type.STRING }, comments: { type: Type.STRING } } } } } }
            },
            emailCrmAssessment: {
                type: Type.OBJECT,
                properties: { hasEmailCapture: { type: Type.BOOLEAN }, emailPlatformDetected: { type: Type.STRING }, leadNurturingScore: { type: Type.STRING }, crmMaturity: { type: Type.STRING }, recommendations: { type: Type.ARRAY, items: { type: Type.STRING } } }
            },
            industryLeaders: {
                type: Type.ARRAY,
                items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, platform: { type: Type.STRING }, profileUrl: { type: Type.STRING }, followers: { type: Type.STRING }, engagementRate: { type: Type.STRING }, strategy: { type: Type.STRING }, lessonsForUser: { type: Type.STRING } } }
            },
            opportunities: {
                type: Type.ARRAY,
                items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, category: { type: Type.STRING }, impact: { type: Type.STRING }, effort: { type: Type.STRING }, estimatedRoi: { type: Type.STRING }, description: { type: Type.STRING } } }
            },
            risks: {
                type: Type.ARRAY,
                items: { type: Type.OBJECT, properties: { risk: { type: Type.STRING }, severity: { type: Type.STRING }, detail: { type: Type.STRING }, mitigation: { type: Type.STRING } } }
            },
            digitalHealthGrade: { type: Type.STRING },
            executiveSummary: { type: Type.STRING },
            moneyOnTheTable: {
                type: Type.ARRAY,
                items: { type: Type.OBJECT, properties: { area: { type: Type.STRING }, description: { type: Type.STRING }, estimatedLoss: { type: Type.STRING } } }
            },
            roadmap: {
                type: Type.ARRAY,
                items: { type: Type.OBJECT, properties: { phase: { type: Type.STRING }, focus: { type: Type.STRING }, actions: { type: Type.ARRAY, items: { type: Type.STRING } }, kpis: { type: Type.ARRAY, items: { type: Type.STRING } } } }
            },
            // Extended sections — STRING type to avoid exceeding Gemini's schema complexity limit
            // Gemini will return JSON as a string, UI parses it with JSON.parse()
            socialProof: { type: Type.STRING },
            funnelAnalysis: { type: Type.STRING },
            contentIdentityAudit: { type: Type.STRING },
            competitorComparison: { type: Type.STRING },
            channelStrategies: { type: Type.STRING },
            adStrategy: { type: Type.STRING },
            influencerStrategy: { type: Type.STRING },
            marketplaceAnalysis: { type: Type.STRING }
        },
        required: [
            'snapshot', 'findings', 'webTechnical', 'seoAnalysis', 'aiReadiness', 'socialMediaAudit', 
            'reputationAnalysis', 'competitorBenchmark', 'emailCrmAssessment', 'industryLeaders', 
            'opportunities', 'risks', 'digitalHealthGrade', 'executiveSummary', 'moneyOnTheTable', 
            'roadmap', 'visualIdentityAudit', 'customerPerception',
            'socialProof', 'funnelAnalysis', 'contentIdentityAudit', 'competitorComparison',
            'channelStrategies', 'adStrategy', 'influencerStrategy', 'marketplaceAnalysis'
        ]
    };
}

