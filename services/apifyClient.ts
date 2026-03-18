/**
 * Shared Apify Proxy client for all services.
 * Calls the apify-proxy Edge Function with the given action + payload.
 */
import { supabase } from './supabaseClient';

export const callApifyProxy = async (action: string, payload: Record<string, any>): Promise<any> => {
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const response = await fetch(`${supabaseUrl}/functions/v1/apify-proxy`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ action, payload }),
    });

    if (!response.ok) {
        console.error(`Apify Proxy [${action}] HTTP ${response.status}`);
        return null;
    }

    const data = await response.json();
    if (!data.success) {
        console.error(`Apify Proxy [${action}] error:`, data.error);
        return null;
    }

    return data.result;
};

// ── Google Trends ────────────────────────────────────────────────────
export interface GoogleTrendsResult {
    term: string;
    interestOverTime: { date: string; value: number }[];
    trendSummary: 'rising' | 'stable' | 'declining';
    relatedQueries: string[];
    peakValue: number;
    currentValue: number;
}

export const scrapeGoogleTrendsApify = async (searchTerms: string[]): Promise<GoogleTrendsResult[]> => {
    try {
        if (!searchTerms || searchTerms.length === 0) return [];
        const result = await callApifyProxy('scrape_google_trends', {
            searchTerms: searchTerms.slice(0, 3),
            geo: 'AR',
            timeRange: 'today 12-m',
        });
        return Array.isArray(result) ? result : [];
    } catch (e) {
        console.error('Google Trends scrape failed:', e);
        return [];
    }
};

// ── Google Shopping ──────────────────────────────────────────────────
export interface GoogleShoppingResult {
    query: string;
    totalProducts: number;
    averagePrice: number;
    lowestPrice: number;
    highestPrice: number;
    topProducts: { title: string; price: number; priceFormatted: string; seller: string; rating: number | null }[];
}

export const scrapeGoogleShoppingApify = async (queries: string[]): Promise<GoogleShoppingResult | null> => {
    try {
        if (!queries || queries.length === 0) return null;
        const result = await callApifyProxy('scrape_google_shopping', {
            queries: queries.slice(0, 3),
            countryCode: 'ar',
        });
        return result || null;
    } catch (e) {
        console.error('Google Shopping scrape failed:', e);
        return null;
    }
};

// ── MercadoLibre (for Deep Dive pricing) ─────────────────────────────
export interface MercadoLibrePricingResult {
    found: boolean;
    totalProducts: number;
    products: { title: string; price: number; soldQuantity: number; seller: string; permalink: string }[];
    averagePrice: number;
    lowestPrice: number;
    highestPrice: number;
}

export const scrapeMercadoLibreForPricing = async (searchQuery: string): Promise<MercadoLibrePricingResult | null> => {
    try {
        if (!searchQuery) return null;
        const result = await callApifyProxy('scrape_mercadolibre', {
            searchQuery,
        });
        if (!result || !result.found) return null;
        
        // Calculate pricing stats from products
        const products = result.products || [];
        const prices = products.map((p: any) => p.price).filter((p: number) => p > 0);
        return {
            found: true,
            totalProducts: result.totalProducts || products.length,
            products: products.slice(0, 8).map((p: any) => ({
                title: p.title || '',
                price: p.price || 0,
                soldQuantity: p.soldQuantity || p.sold || 0,
                seller: p.seller || p.sellerName || 'N/A',
                permalink: p.url || p.permalink || '',
            })),
            averagePrice: prices.length > 0 ? Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length) : 0,
            lowestPrice: prices.length > 0 ? Math.min(...prices) : 0,
            highestPrice: prices.length > 0 ? Math.max(...prices) : 0,
        };
    } catch (e) {
        console.error('MercadoLibre pricing scrape failed:', e);
        return null;
    }
};

// ── Google Maps Competitors (for Strategic Analysis) ──────────────────
export interface MapsCompetitorResult {
    name: string;
    rating: number;
    totalReviews: number;
    address: string;
    category: string;
    website: string;
}

export const scrapeGoogleMapsCompetitors = async (query: string): Promise<MapsCompetitorResult[]> => {
    try {
        if (!query) return [];
        const result = await callApifyProxy('scrape_google_maps', { query });
        if (!result) return [];
        
        // The Maps scraper returns business data — extract top competitors
        const businesses = Array.isArray(result) ? result : (result.businesses || result.results || [result]);
        return businesses.slice(0, 5).map((b: any) => ({
            name: b.title || b.name || b.businessName || 'N/A',
            rating: b.totalScore || b.rating || 0,
            totalReviews: b.reviewsCount || b.totalReviews || 0,
            address: b.address || b.street || 'N/A',
            category: b.categoryName || b.category || 'N/A',
            website: b.website || b.url || '',
        }));
    } catch (e) {
        console.error('Google Maps competitor scrape failed:', e);
        return [];
    }
};

// ── Google SERP (for Strategic Analysis / Deep Dive) ──────────────────
export interface SerpCompetitorResult {
    query: string;
    topResults: { position: number; title: string; url: string; description: string }[];
}

export const scrapeGoogleSerpForAnalysis = async (queries: string[]): Promise<SerpCompetitorResult[]> => {
    try {
        if (!queries || queries.length === 0) return [];
        const result = await callApifyProxy('scrape_google_serp', {
            queries: queries.slice(0, 3),
        });
        if (!result || !result.queries) return [];
        return result.queries.map((q: any) => ({
            query: q.query || '',
            topResults: (q.organicResults || []).slice(0, 5).map((r: any) => ({
                position: r.position || 0,
                title: r.title || '',
                url: r.url || '',
                description: (r.description || '').slice(0, 150),
            })),
        }));
    } catch (e) {
        console.error('Google SERP for analysis failed:', e);
        return [];
    }
};

// ── Instagram Competitor Scraper ─────────────────────────────────────
export interface InstagramCompetitorBrief {
    username: string;
    fullName: string;
    followers: number;
    following: number;
    postsCount: number;
    biography: string;
    isVerified: boolean;
}

export const scrapeInstagramCompetitor = async (username: string): Promise<InstagramCompetitorBrief | null> => {
    try {
        if (!username) return null;
        const clean = username.replace(/[@\/\s]/g, '');
        const result = await callApifyProxy('scrape_instagram_profile', { username: clean });
        if (!result) return null;
        return {
            username: result.username || clean,
            fullName: result.fullName || result.name || '',
            followers: result.followers || 0,
            following: result.following || 0,
            postsCount: result.postsCount || result.posts || 0,
            biography: (result.biography || result.bio || '').slice(0, 200),
            isVerified: result.isVerified || false,
        };
    } catch (e) {
        console.error(`Instagram competitor scrape failed for ${username}:`, e);
        return null;
    }
};
