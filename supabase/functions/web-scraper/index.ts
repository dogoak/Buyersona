import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Social media URL patterns
const SOCIAL_PATTERNS: { platform: string; patterns: RegExp[] }[] = [
    { platform: 'Instagram', patterns: [/https?:\/\/(www\.)?instagram\.com\/[\w.-]+/gi] },
    { platform: 'Facebook', patterns: [/https?:\/\/(www\.)?(facebook|fb)\.com\/[\w.-]+/gi, /https?:\/\/(www\.)?fb\.me\/[\w.-]+/gi] },
    { platform: 'TikTok', patterns: [/https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+/gi] },
    { platform: 'LinkedIn', patterns: [/https?:\/\/(www\.)?linkedin\.com\/(company|in)\/[\w.-]+/gi] },
    { platform: 'YouTube', patterns: [/https?:\/\/(www\.)?youtube\.com\/(c\/|channel\/|@)[\w.-]+/gi, /https?:\/\/(www\.)?youtube\.com\/[\w.-]+/gi] },
    { platform: 'Twitter/X', patterns: [/https?:\/\/(www\.)?(twitter|x)\.com\/[\w]+/gi] },
    { platform: 'Pinterest', patterns: [/https?:\/\/(www\.|ar\.)?pinterest\.com\/[\w.-]+/gi] },
    { platform: 'WhatsApp', patterns: [/https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\/[\w?=+.-]+/gi] },
    { platform: 'Mercado Libre', patterns: [/https?:\/\/(www\.)?mercadolibre\.com\.ar\/[\w.-]+/gi, /https?:\/\/tienda\.mercadolibre\.com\.ar\/[\w.-]+/gi] },
    { platform: 'Google Maps', patterns: [/https?:\/\/(www\.)?(google\.com\.ar|google\.com|goo\.gl)\/maps\/[\w?=&.\/-]+/gi, /https?:\/\/maps\.app\.goo\.gl\/[\w]+/gi] },
];

// Platform detection patterns
const PLATFORM_PATTERNS: { name: string; patterns: (string | RegExp)[] }[] = [
    { name: 'Tienda Nube', patterns: [/tiendanube/i, /nuvemshop/i, /d26lpennugtm8s\.cloudfront\.net/i, /TiendaNube/i] },
    { name: 'Shopify', patterns: [/shopify/i, /cdn\.shopify\.com/i, /myshopify\.com/i] },
    { name: 'WordPress', patterns: [/wp-content/i, /wp-includes/i, /wordpress/i] },
    { name: 'WooCommerce', patterns: [/woocommerce/i, /wc-api/i] },
    { name: 'Mercado Shops', patterns: [/mercadoshops/i] },
    { name: 'Wix', patterns: [/wixsite\.com/i, /wix\.com/i, /parastorage\.com/i] },
    { name: 'Squarespace', patterns: [/squarespace/i, /sqsp\.com/i] },
    { name: 'PrestaShop', patterns: [/prestashop/i] },
    { name: 'Magento', patterns: [/magento/i, /mage\/cookies/i] },
    { name: 'Empretienda', patterns: [/empretienda/i] },
    { name: 'Webflow', patterns: [/webflow/i] },
    { name: 'Vtex', patterns: [/vtex/i, /vteximg/i] },
];

// Tool/integration patterns
const TOOL_PATTERNS: { name: string; patterns: (string | RegExp)[] }[] = [
    { name: 'Google Analytics (GA4)', patterns: [/gtag/i, /googletagmanager\.com\/gtag/i, /G-[A-Z0-9]+/] },
    { name: 'Google Analytics (Universal)', patterns: [/UA-\d+-\d+/, /analytics\.js/i] },
    { name: 'Google Tag Manager', patterns: [/googletagmanager\.com\/gtm/i, /GTM-[A-Z0-9]+/] },
    { name: 'Meta Pixel (Facebook)', patterns: [/connect\.facebook\.net/i, /fbq\(/i, /fbevents\.js/i] },
    { name: 'Google Ads', patterns: [/googleads/i, /AW-[0-9]+/i, /conversion_async/i] },
    { name: 'Hotjar', patterns: [/hotjar/i, /hj\(/i] },
    { name: 'Clarity (Microsoft)', patterns: [/clarity\.ms/i] },
    { name: 'Mailchimp', patterns: [/mailchimp/i, /list-manage\.com/i, /chimpstatic\.com/i] },
    { name: 'reCAPTCHA', patterns: [/recaptcha/i, /google\.com\/recaptcha/i] },
    { name: 'jQuery', patterns: [/jquery/i] },
    { name: 'Bootstrap', patterns: [/bootstrap/i] },
    { name: 'Zendesk', patterns: [/zendesk/i, /zdassets\.com/i] },
    { name: 'Tawk.to', patterns: [/tawk\.to/i] },
    { name: 'Drift', patterns: [/drift\.com/i] },
    { name: 'Intercom', patterns: [/intercom/i, /intercomcdn/i] },
    { name: 'HubSpot', patterns: [/hubspot/i, /hs-scripts/i, /hsforms/i] },
    { name: 'Crisp Chat', patterns: [/crisp\.chat/i] },
    { name: 'MercadoPago', patterns: [/mercadopago/i, /mlstatic\.com/i] },
    { name: 'PayPal', patterns: [/paypal/i] },
    { name: 'Stripe', patterns: [/stripe\.com/i, /js\.stripe/i] },
    { name: 'Cloudflare', patterns: [/cloudflare/i, /cdnjs\.cloudflare/i] },
    { name: 'Google Fonts', patterns: [/fonts\.googleapis\.com/i, /fonts\.gstatic\.com/i] },
    { name: 'Font Awesome', patterns: [/fontawesome/i, /font-awesome/i] },
    { name: 'Lazy Loading', patterns: [/loading="lazy"/i, /lazysizes/i, /lazyload/i] },
    { name: 'Schema.org (JSON-LD)', patterns: [/application\/ld\+json/i] },
    { name: 'Open Graph Tags', patterns: [/og:title/i, /og:description/i, /og:image/i] },
];

function extractSocialLinks(html: string, baseUrl: string): { platform: string; url: string }[] {
    const found: Map<string, string> = new Map();
    
    for (const { platform, patterns } of SOCIAL_PATTERNS) {
        for (const pattern of patterns) {
            const matches = html.match(pattern);
            if (matches) {
                for (const match of matches) {
                    const cleanUrl = match.replace(/["'<>\s;,)]+$/, '');
                    // Skip generic/share URLs
                    if (cleanUrl.includes('/sharer') || cleanUrl.includes('/share?') || cleanUrl.includes('/intent/')) continue;
                    if (cleanUrl.includes('facebook.com/tr?') || cleanUrl.includes('facebook.com/plugins')) continue;
                    // Deduplicate by platform
                    const key = platform;
                    if (!found.has(key) || cleanUrl.length > (found.get(key)?.length || 0)) {
                        found.set(key, cleanUrl);
                    }
                }
            }
        }
    }
    
    return Array.from(found.entries()).map(([platform, url]) => ({ platform, url }));
}

function detectPlatform(html: string): string {
    for (const { name, patterns } of PLATFORM_PATTERNS) {
        for (const pattern of patterns) {
            if (pattern instanceof RegExp ? pattern.test(html) : html.includes(pattern)) {
                return name;
            }
        }
    }
    return 'Custom / No detectada';
}

function detectTools(html: string): string[] {
    const tools: string[] = [];
    for (const { name, patterns } of TOOL_PATTERNS) {
        for (const pattern of patterns) {
            if (pattern instanceof RegExp ? pattern.test(html) : html.includes(pattern)) {
                tools.push(name);
                break; // Only add each tool once
            }
        }
    }
    return tools;
}

function extractMetaTags(html: string): Record<string, string> {
    const meta: Record<string, string> = {};
    // Title
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (titleMatch) meta.title = titleMatch[1].trim();
    
    // Meta tags
    const metaPattern = /<meta\s+[^>]*(?:name|property|http-equiv)\s*=\s*["']([^"']+)["'][^>]*content\s*=\s*["']([^"']*)["']/gi;
    const metaPattern2 = /<meta\s+[^>]*content\s*=\s*["']([^"']*)["'][^>]*(?:name|property)\s*=\s*["']([^"']+)["']/gi;
    
    let match;
    while ((match = metaPattern.exec(html)) !== null) {
        meta[match[1].toLowerCase()] = match[2];
    }
    while ((match = metaPattern2.exec(html)) !== null) {
        meta[match[2].toLowerCase()] = match[1];
    }
    return meta;
}

function extractEmails(html: string): string[] {
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = html.match(emailPattern) || [];
    // Deduplicate and filter out common false positives
    const filtered = [...new Set(matches)].filter(e => 
        !e.includes('example.com') && 
        !e.includes('sentry') && 
        !e.includes('wixpress') &&
        !e.includes('.png') &&
        !e.includes('.jpg') &&
        !e.endsWith('.js')
    );
    return filtered.slice(0, 5);
}

function extractPhones(html: string): string[] {
    // Look for tel: links and common phone patterns
    const telPattern = /href\s*=\s*["']tel:([^"']+)["']/gi;
    const phones: string[] = [];
    let match;
    while ((match = telPattern.exec(html)) !== null) {
        phones.push(match[1].trim());
    }
    return [...new Set(phones)].slice(0, 5);
}

function extractSchemaOrg(html: string): any[] {
    const schemas: any[] = [];
    const scriptPattern = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = scriptPattern.exec(html)) !== null) {
        try {
            const parsed = JSON.parse(match[1]);
            // Only keep type and basic info
            if (Array.isArray(parsed)) {
                for (const item of parsed) {
                    schemas.push({ type: item['@type'], name: item.name, description: item.description?.substring(0, 200) });
                }
            } else {
                schemas.push({ type: parsed['@type'], name: parsed.name, description: parsed.description?.substring(0, 200) });
            }
        } catch (_) {}
    }
    return schemas.slice(0, 10);
}

function countProducts(html: string): number | null {
    // Try to count product-like elements
    const productPatterns = [
        /<[^>]*class\s*=\s*["'][^"']*product[^"']*["']/gi,
        /<[^>]*itemtype\s*=\s*["'][^"']*Product["']/gi,
    ];
    let maxCount = 0;
    for (const pattern of productPatterns) {
        const matches = html.match(pattern);
        if (matches) maxCount = Math.max(maxCount, matches.length);
    }
    return maxCount > 0 ? maxCount : null;
}

function detectBlog(html: string): boolean {
    return /\/blog[\/"'?#>]/i.test(html) || /\/noticias[\/"'?#>]/i.test(html) || /\/novedades[\/"'?#>]/i.test(html) || /\/articulos[\/"'?#>]/i.test(html);
}

function checkConversionElements(html: string): Record<string, boolean> {
    return {
        hasWhatsAppButton: /wa\.me|whatsapp/i.test(html),
        hasEmailCapture: /newsletter|suscri|subscri|email.*form|form.*email/i.test(html),
        hasClearCTAs: /comprar|buy|agregar.*carrito|add.*cart|contactanos|contact.*us/i.test(html),
        hasSearchBar: /<input[^>]*type\s*=\s*["']search["']/i.test(html) || /search|buscar|buscador/i.test(html),
        hasCart: /carrito|cart|checkout/i.test(html),
        hasPopup: /popup|modal|overlay/i.test(html),
        hasLiveChat: /tawk|crisp|zendesk|intercom|drift|tidio|livechat/i.test(html),
    };
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { url } = await req.json();
        if (!url) {
            return new Response(JSON.stringify({ error: 'URL is required' }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Normalize URL
        let normalizedUrl = url.trim();
        if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
            normalizedUrl = 'https://' + normalizedUrl;
        }

        console.log('Scraping:', normalizedUrl);

        // Fetch the page HTML
        let html = '';
        let finalUrl = normalizedUrl;
        let hasSSL = normalizedUrl.startsWith('https://');
        let fetchError = null;

        try {
            const response = await fetch(normalizedUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
                },
                redirect: 'follow',
            });
            
            finalUrl = response.url;
            hasSSL = finalUrl.startsWith('https://');
            html = await response.text();
            
            console.log(`Fetched ${html.length} bytes from ${finalUrl}`);
        } catch (err: any) {
            console.error('Fetch error:', err.message);
            fetchError = err.message;
            
            // Try with http if https failed
            if (normalizedUrl.startsWith('https://')) {
                try {
                    const httpUrl = normalizedUrl.replace('https://', 'http://');
                    const response2 = await fetch(httpUrl, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                        redirect: 'follow',
                    });
                    finalUrl = response2.url;
                    hasSSL = false;
                    html = await response2.text();
                    fetchError = null;
                    console.log(`Fetched via HTTP: ${html.length} bytes`);
                } catch (err2: any) {
                    console.error('HTTP fallback failed:', err2.message);
                }
            }
        }

        if (!html || html.length === 0) {
            return new Response(JSON.stringify({
                error: 'Could not fetch page',
                details: fetchError,
                partial: { url: normalizedUrl, hasSSL }
            }), {
                status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Extract everything
        const socialLinks = extractSocialLinks(html, finalUrl);
        const platform = detectPlatform(html);
        const tools = detectTools(html);
        const metaTags = extractMetaTags(html);
        const emails = extractEmails(html);
        const phones = extractPhones(html);
        const schemas = extractSchemaOrg(html);
        const productCount = countProducts(html);
        const hasBlog = detectBlog(html);
        const conversionElements = checkConversionElements(html);

        // Language detection
        const langMatch = html.match(/<html[^>]*lang\s*=\s*["']([^"']+)["']/i);
        const detectedLanguage = langMatch ? langMatch[1] : null;

        // Canonical URL
        const canonicalMatch = html.match(/<link[^>]*rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["']([^"']+)["']/i);
        const canonicalUrl = canonicalMatch ? canonicalMatch[1] : null;

        // Favicon
        const faviconMatch = html.match(/<link[^>]*rel\s*=\s*["'](?:icon|shortcut icon)["'][^>]*href\s*=\s*["']([^"']+)["']/i);
        const favicon = faviconMatch ? faviconMatch[1] : null;

        // Page size
        const pageSizeKb = Math.round(html.length / 1024);

        // Images count
        const imageCount = (html.match(/<img\s/gi) || []).length;

        // External scripts count
        const scriptCount = (html.match(/<script[^>]*src\s*=/gi) || []).length;

        // CSS count
        const cssCount = (html.match(/<link[^>]*stylesheet/gi) || []).length;

        const result = {
            url: finalUrl,
            hasSSL,
            platform,
            socialLinks,
            detectedTools: tools,
            metaTags: {
                title: metaTags.title || null,
                description: metaTags.description || null,
                ogTitle: metaTags['og:title'] || null,
                ogDescription: metaTags['og:description'] || null,
                ogImage: metaTags['og:image'] || null,
                viewport: metaTags.viewport || null,
                robots: metaTags.robots || null,
            },
            contactInfo: {
                emails,
                phones,
            },
            schemaOrg: schemas,
            conversionElements,
            siteMetrics: {
                pageSizeKb,
                imageCount,
                scriptCount,
                cssCount,
                productCountOnPage: productCount,
                hasBlog,
                detectedLanguage,
                canonicalUrl,
                favicon,
            },
        };

        console.log('Scrape result:', JSON.stringify({
            url: result.url,
            platform: result.platform,
            socialLinksCount: result.socialLinks.length,
            toolsCount: result.detectedTools.length,
        }));

        return new Response(JSON.stringify(result), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Scraper error:', error);
        return new Response(JSON.stringify({ error: 'Scraper failed', details: String(error) }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
