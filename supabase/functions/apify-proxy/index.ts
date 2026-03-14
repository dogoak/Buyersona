import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) throw new Error('Unauthorized');

        const body = await req.json();
        const { action, payload } = body;
        
        const apifyToken = Deno.env.get('APIFY_API_TOKEN');
        if (!apifyToken) throw new Error('APIFY_API_TOKEN is not configured');

        // Helper: call Apify actor sync and return dataset items
        const callApify = async (actorId: string, input: any, timeoutSecs = 120) => {
            const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${apifyToken}&timeout=${timeoutSecs}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input)
            });
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Apify ${actorId} error: ${res.status} ${errText.slice(0, 300)}`);
            }
            return await res.json();
        };

        // ── Instagram ──
        if (action === 'scrape_instagram_profile') {
            const { username } = payload;
            if (!username) throw new Error('username required');
            const data = await callApify('apify~instagram-profile-scraper', { usernames: [username] });
            if (!data || data.length === 0) return new Response(JSON.stringify({ success: false, error: 'No profile found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
            const p = data[0];
            const profile = {
                username: p.username || '', fullName: p.fullName || '', followersCount: p.followersCount || 0, followsCount: p.followsCount || 0,
                postsCount: p.postsCount || 0, isVerified: p.isVerified || false, isBusinessAccount: p.isBusinessAccount || false,
                businessCategoryName: p.businessCategoryName || '', externalUrl: p.externalUrl || '', biography: p.biography || '',
                profilePicUrl: p.profilePicUrlHD || p.profilePicUrl || '',
                latestPosts: (p.latestPosts || []).slice(0, 5).map((post: any) => ({
                    type: post.type || 'Post', caption: post.caption || '', likesCount: post.likesCount || 0,
                    commentsCount: post.commentsCount || 0, url: post.url || '',
                    imageUrl: post.displayUrl || post.thumbnailUrl || '', videoUrl: post.videoUrl || '',
                    timestamp: post.timestamp || ''
                }))
            };
            return new Response(JSON.stringify({ success: true, profile }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        
        // ── Google Maps ── (using main scraper actor)
        if (action === 'scrape_google_maps') {
            const { searchUrl, searchQuery } = payload;
            if (!searchUrl && !searchQuery) throw new Error('searchUrl or searchQuery required');
            
            const query = searchQuery || searchUrl;
            const isUrl = query.startsWith('http');
            
            // Use the main Google Maps scraper (compass~crawler-google-places)
            const apifyInput = isUrl 
                ? { startUrls: [{ url: query }], maxCrawledPlacesPerSearch: 1, includeReviews: true, maxReviews: 10, language: 'es' }
                : { searchStringsArray: [query.replace('place_id:', '')], maxCrawledPlacesPerSearch: 1, includeReviews: true, maxReviews: 10, language: 'es' };
            
            try {
                const data = await callApify('compass~crawler-google-places', apifyInput, 90);
                if (!data || data.length === 0) return new Response(JSON.stringify({ success: false, error: 'No places found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
                const place = data[0];
                const reviews = (place.reviews || []).slice(0, 10).map((r: any) => ({ text: r.text || r.textTranslated || '', rating: r.stars, time: r.publishedAtDate, reviewerName: r.name, isLocalGuide: r.isLocalGuide })).filter((r: any) => r.text);
                const result = { title: place.title || place.searchString, rating: place.totalScore, reviewsCount: place.reviewsCount, address: place.address || place.street, website: place.website, phone: place.phone, category: place.categoryName || place.categories?.[0] || '', reviews, imageUrl: place.imageUrl || '', description: place.description || '', openingHours: place.openingHours || [] };
                return new Response(JSON.stringify({ success: true, result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            } catch (e: any) {
                console.error('Google Maps scraper error:', e.message);
                return new Response(JSON.stringify({ success: false, error: e.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
            }
        }

        // ── Facebook ──
        if (action === 'scrape_facebook_page') {
            const { pageUrl } = payload;
            if (!pageUrl) throw new Error('pageUrl required');
            const data = await callApify('apify~facebook-pages-scraper', { startUrls: [{ url: pageUrl }], maxPosts: 5 });
            if (!data || data.length === 0) return new Response(JSON.stringify({ success: false, error: 'No FB page found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
            const page = data[0];
            const result = {
                pageName: page.title || page.name || '', likes: page.likes || page.likesCount || 0, followers: page.followers || page.followersCount || 0,
                category: page.categories?.join(', ') || page.category || '', about: page.about || page.description || '',
                website: page.website || '', phone: page.phone || '', address: page.address || '',
                latestPosts: (data.filter((d: any) => d.text || d.message) || []).slice(0, 5).map((post: any) => ({
                    text: post.text || post.message || '', likes: post.likes || post.likesCount || 0,
                    comments: post.comments || post.commentsCount || 0, shares: post.shares || post.sharesCount || 0,
                    date: post.time || post.date || '', url: post.url || post.postUrl || '',
                    imageUrl: post.imageUrl || post.media?.[0]?.photo || ''
                }))
            };
            return new Response(JSON.stringify({ success: true, result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // ── TikTok ──
        if (action === 'scrape_tiktok_profile') {
            const { profileUrl } = payload;
            if (!profileUrl) throw new Error('profileUrl required');
            const data = await callApify('clockworks~tiktok-profile-scraper', { profiles: [profileUrl], resultsPerPage: 5 });
            if (!data || data.length === 0) return new Response(JSON.stringify({ success: false, error: 'No TikTok profile found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
            const profile = data[0];
            const result = {
                username: profile.uniqueId || profile.username || '', nickname: profile.nickname || '',
                followers: profile.fans || profile.followersCount || profile.followers || 0, following: profile.following || profile.followingCount || 0,
                likes: profile.heart || profile.likes || profile.totalLikes || 0, videos: profile.videoCount || profile.video || 0,
                bio: profile.signature || profile.bio || '', verified: profile.verified || false,
                latestVideos: (data.filter((d: any) => d.text || d.desc) || []).slice(0, 5).map((v: any) => ({
                    description: v.text || v.desc || '', views: v.playCount || v.plays || 0, likes: v.diggCount || v.likes || 0,
                    comments: v.commentCount || v.comments || 0, shares: v.shareCount || v.shares || 0,
                    url: v.webVideoUrl || v.url || '', coverUrl: v.cover || v.dynamicCover || ''
                }))
            };
            return new Response(JSON.stringify({ success: true, result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // ── X (Twitter) ──
        if (action === 'scrape_x_profile') {
            const { profileUrl } = payload;
            if (!profileUrl) throw new Error('profileUrl required');
            const match = profileUrl.match(/(?:twitter\.com|x\.com)\/([^/?\s]+)/);
            const username = match ? match[1] : profileUrl;
            const data = await callApify('apidojo~tweet-scraper', { startUrls: [`https://x.com/${username}`], maxItems: 5 });
            if (!data || data.length === 0) return new Response(JSON.stringify({ success: false, error: 'No X profile found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
            const author = data[0]?.author || {};
            const result = {
                username: author.userName || username, name: author.name || '', followers: author.followers || 0, following: author.following || 0,
                isVerified: author.isBlueVerified || author.isVerified || false, profilePicture: author.profilePicture || '',
                description: author.description || '',
                latestTweets: data.slice(0, 5).map((t: any) => ({
                    text: t.text || '', likes: t.likeCount || 0, retweets: t.retweetCount || 0, replies: t.replyCount || 0,
                    date: t.createdAt || '', url: t.url || '', views: t.viewCount || 0,
                    imageUrls: t.media?.photos?.map((p: any) => p.url) || []
                }))
            };
            return new Response(JSON.stringify({ success: true, result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // ── LinkedIn ── (using harvestapi actor, no cookies)
        if (action === 'scrape_linkedin_profile') {
            const { profileUrl } = payload;
            if (!profileUrl) throw new Error('profileUrl required');
            
            try {
                // Use harvestapi actor for both company and personal profiles
                const data = await callApify('harvestapi~linkedin-company-details-scraper', { urls: [profileUrl] });
                if (!data || data.length === 0) return new Response(JSON.stringify({ success: false, error: 'No LinkedIn data found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
                const c = data[0];
                const isCompany = profileUrl.includes('/company/');
                const result = {
                    name: c.name || c.companyName || c.fullName || '', 
                    headline: c.tagline || c.headline || c.slogan || '',
                    followers: c.followerCount || c.followersCount || c.followers || 0,
                    connections: c.connectionsCount || c.connections || 0, 
                    about: c.description || c.about || c.summary || '',
                    industry: c.industry || c.industries?.[0] || '', 
                    location: c.headquarter?.city || c.hqCity || c.location || '',
                    website: c.website || c.websiteUrl || c.companyUrl || '', 
                    isCompany,
                    employeeCount: c.employeeCount || c.staffCount || c.employeeCountRange || c.companySize || null,
                    specialties: c.specialities || c.specialties || [],
                    logoUrl: c.logo || c.logoUrl || c.profilePicture || '',
                    founded: c.foundedYear || c.founded || c.foundedOn || ''
                };
                return new Response(JSON.stringify({ success: true, result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            } catch (e: any) {
                console.error('LinkedIn scraper error:', e.message);
                return new Response(JSON.stringify({ success: false, error: e.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
            }
        }

        // ── YouTube ──
        if (action === 'scrape_youtube_channel') {
            const { channelUrl } = payload;
            if (!channelUrl) throw new Error('channelUrl required');
            const data = await callApify('bernardo~youtube-scraper', { startUrls: [{ url: channelUrl }], maxResults: 5, maxResultsShorts: 0, maxResultStreams: 0 });
            if (!data || data.length === 0) return new Response(JSON.stringify({ success: false, error: 'No YouTube channel found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
            const first = data[0];
            const result = {
                channelName: first.channelName || '', subscribers: first.numberOfSubscribers || 0, totalViews: first.channelTotalViews || '',
                totalVideos: first.channelTotalVideos || 0, description: first.channelDescription || '', joinedDate: first.channelJoinedDate || '',
                location: first.channelLocation || '', isMonetized: first.isMonetized || false,
                latestVideos: data.slice(0, 5).map((v: any) => ({ title: v.title || '', views: v.viewCount || 0, duration: v.duration || '', date: v.date || '', url: v.url || '', thumbnailUrl: v.thumbnailUrl || '' }))
            };
            return new Response(JSON.stringify({ success: true, result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // ── Pinterest ──
        if (action === 'scrape_pinterest_profile') {
            const { profileUrl } = payload;
            if (!profileUrl) throw new Error('profileUrl required');
            const data = await callApify('maxcopell~pinterest-crawler', { startUrls: [{ url: profileUrl }], maxPinsCnt: 5 });
            if (!data || data.length === 0) return new Response(JSON.stringify({ success: false, error: 'No Pinterest profile found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
            const first = data[0];
            const result = {
                username: first.pinner?.username || first.username || '', fullName: first.pinner?.fullName || first.fullName || '',
                followers: first.pinner?.followerCount || first.followerCount || 0, following: first.pinner?.followingCount || first.followingCount || 0,
                pins: first.pinner?.pinCount || first.pinCount || 0, boards: first.pinner?.boardCount || first.boardCount || 0,
                latestPins: data.slice(0, 5).map((p: any) => ({ title: p.title || p.gridTitle || '', description: p.description || '', saves: p.aggregatedPinData?.saves || p.repin_count || 0, comments: p.commentCount || p.comment_count || 0, url: p.link || p.url || '', imageUrl: p.images?.orig?.url || p.imageUrl || '' }))
            };
            return new Response(JSON.stringify({ success: true, result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // ── Meta Ads Library ── (NEW)
        if (action === 'scrape_meta_ads') {
            const { pageUrl, searchQuery } = payload;
            if (!pageUrl && !searchQuery) throw new Error('pageUrl or searchQuery required');
            
            // PRECISION FIX: If we have a Facebook page URL, use it directly as startUrl
            // This ensures we only get ads from THIS specific page, not random keyword matches
            let startUrl: string;
            if (pageUrl && (pageUrl.includes('facebook.com/') || pageUrl.includes('fb.com/'))) {
                // Direct Facebook page URL → most precise
                startUrl = pageUrl;
            } else {
                // Fallback: keyword search in Ad Library (less precise)
                const query = searchQuery || pageUrl;
                startUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=${encodeURIComponent(query)}&search_type=keyword_unordered`;
            }
            
            try {
                const data = await callApify('apify~facebook-ads-scraper', { startUrls: [{ url: startUrl }], maxItems: 10 }, 90);
                if (!data || data.length === 0) {
                    return new Response(JSON.stringify({ success: true, result: { isRunningAds: false, totalAds: 0, ads: [], searchedUrl: startUrl } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                }
                const result = {
                    isRunningAds: true, totalAds: data.length,
                    searchedUrl: startUrl,
                    ads: data.slice(0, 10).map((ad: any) => ({
                        adId: ad.adArchiveID || ad.ad_archive_id || ad.id || '',
                        pageName: ad.pageName || ad.page_name || '',
                        body: ad.body || ad.ad_creative_bodies?.[0] || '',
                        title: ad.title || ad.ad_creative_link_titles?.[0] || '',
                        ctaText: ad.ctaText || ad.ad_creative_link_captions?.[0] || '',
                        ctaLink: ad.linkUrl || ad.ad_creative_link_descriptions?.[0] || '',
                        status: ad.isActive ? 'active' : (ad.adStatus || 'unknown'),
                        startedRunning: ad.startDate || ad.ad_delivery_start_time || '',
                        platforms: ad.publisherPlatforms || ad.publisher_platforms || [],
                    }))
                };
                return new Response(JSON.stringify({ success: true, result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            } catch (e: any) {
                console.error('Meta Ads scraper error:', e.message);
                return new Response(JSON.stringify({ success: true, result: { isRunningAds: false, totalAds: 0, ads: [], error: e.message } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
        }

        // ── Google Ads Transparency Center ──
        if (action === 'scrape_google_ads') {
            const { advertiserName, domain } = payload;
            if (!advertiserName && !domain) throw new Error('advertiserName or domain required');
            try {
                // PRECISION FIX: Actor requires `domains` array (per official docs)
                // Extract clean domain from whatever we receive
                let cleanDomain = domain || '';
                if (!cleanDomain && advertiserName) {
                    // If no domain, we can't use this actor precisely
                    // Return empty rather than incorrect results
                    return new Response(JSON.stringify({ success: true, result: { isRunningAds: false, totalAds: 0, ads: [], note: 'No domain provided for precise lookup' } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                }
                // Clean the domain (remove protocol, trailing slash, www)
                cleanDomain = cleanDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
                
                const data = await callApify('alkausari_mujahid~google-ads-transparency-scraper', {
                    domains: [cleanDomain]
                }, 90);
                if (!data || data.length === 0) {
                    return new Response(JSON.stringify({ success: true, result: { isRunningAds: false, totalAds: 0, ads: [], searchedDomain: cleanDomain } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                }
                const first = data[0];
                const result = {
                    isRunningAds: first?.hasAds === true || first?.adsFound === true || data.length > 0,
                    totalAds: first?.totalAds || first?.adsCount || data.length,
                    searchedDomain: cleanDomain,
                    advertiserName: first?.advertiserName || first?.domain || advertiserName || '',
                    verificationStatus: first?.verificationStatus || '',
                    ads: (first?.ads || data).slice(0, 10).map((ad: any) => ({
                        format: ad.format || ad.adFormat || ad.type || 'unknown',
                        content: ad.content || ad.text || ad.body || ad.headline || '',
                        firstShown: ad.firstShown || ad.firstSeenDate || ad.startDate || '',
                        lastShown: ad.lastShown || ad.lastSeenDate || ad.endDate || '',
                        platforms: ad.platforms || ad.surfaces || [],
                        regions: ad.regions || ad.countries || [],
                        previewUrl: ad.previewImageUrl || ad.imageUrl || ad.screenshotUrl || ''
                    }))
                };
                return new Response(JSON.stringify({ success: true, result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            } catch (e: any) {
                console.error('Google Ads scraper error:', e.message);
                return new Response(JSON.stringify({ success: true, result: { isRunningAds: false, totalAds: 0, ads: [], error: e.message } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
        }

        // ── TikTok Creative Center Ads ──
        if (action === 'scrape_tiktok_ads') {
            const { keyword, countryCode } = payload;
            if (!keyword) throw new Error('keyword required');
            try {
                const data = await callApify('doliz~tiktok-creative-center-scraper', {
                    countryCode: countryCode || 'AR',
                    keyword: keyword,
                    limit: 10,
                    orderBy: 'likes'
                }, 90);
                if (!data || data.length === 0) {
                    return new Response(JSON.stringify({ success: true, result: { found: false, totalAds: 0, ads: [] } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                }
                const result = {
                    found: true, totalAds: data.length,
                    ads: data.slice(0, 10).map((ad: any) => ({
                        brandName: ad.brandName || ad.brand || '',
                        caption: ad.caption || ad.text || ad.adText || '',
                        likes: ad.likes || ad.likeCount || 0,
                        ctrRank: ad.ctrRanking || ad.ctr || '',
                        industry: ad.industry || '',
                        objective: ad.objective || '',
                        videoUrl: ad.videoUrl || ad.video || '',
                        coverUrl: ad.coverUrl || ad.thumbnail || ''
                    }))
                };
                return new Response(JSON.stringify({ success: true, result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            } catch (e: any) {
                console.error('TikTok Ads scraper error:', e.message);
                return new Response(JSON.stringify({ success: true, result: { found: false, totalAds: 0, ads: [], error: e.message } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
        }

        // ── LinkedIn Ads Library ──
        if (action === 'scrape_linkedin_ads') {
            const { advertiserName } = payload;
            if (!advertiserName) throw new Error('advertiserName required');
            try {
                const data = await callApify('silva95gustavo~linkedin-ad-library-scraper', {
                    advertiserName: advertiserName,
                    maxItems: 10
                }, 90);
                if (!data || data.length === 0) {
                    return new Response(JSON.stringify({ success: true, result: { isRunningAds: false, totalAds: 0, ads: [] } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                }
                const result = {
                    isRunningAds: true, totalAds: data.length,
                    ads: data.slice(0, 10).map((ad: any) => ({
                        advertiserName: ad.advertiserName || ad.advertiser || '',
                        body: ad.body || ad.adBody || ad.content || '',
                        ctaText: ad.ctaText || ad.callToAction || '',
                        format: ad.format || ad.adFormat || '',
                        mediaUrl: ad.mediaUrl || ad.imageUrl || ad.videoUrl || '',
                        startDate: ad.startDate || ad.firstSeen || '',
                        impressions: ad.impressions || null
                    }))
                };
                return new Response(JSON.stringify({ success: true, result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            } catch (e: any) {
                console.error('LinkedIn Ads scraper error:', e.message);
                return new Response(JSON.stringify({ success: true, result: { isRunningAds: false, totalAds: 0, ads: [], error: e.message } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
        }

        // ── MercadoLibre ── (NEW)
        if (action === 'scrape_mercadolibre') {
            const { storeName, searchQuery } = payload;
            if (!storeName && !searchQuery) throw new Error('storeName or searchQuery required');
            
            // Search for the seller/store on MercadoLibre
            const query = storeName || searchQuery;
            const mlUrl = `https://listado.mercadolibre.com.ar/${encodeURIComponent(query).replace(/%20/g, '-')}`;
            
            try {
                const data = await callApify('saswave~mercadolibre-product-scraper', {
                    url: mlUrl,
                    maxItems: 10
                }, 90);
                
                if (!data || data.length === 0) {
                    return new Response(JSON.stringify({ success: true, result: { found: false, totalProducts: 0, products: [], seller: null } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                }
                
                // Extract seller info from first product
                const firstProduct = data[0];
                const seller = firstProduct.seller || firstProduct.sellerInfo || null;
                
                const result = {
                    found: true,
                    totalProducts: data.length,
                    seller: seller ? {
                        name: seller.nickname || seller.name || seller.official_store_name || '',
                        reputation: seller.seller_reputation?.level_id || seller.reputation || '',
                        transactions: seller.seller_reputation?.transactions?.completed || seller.totalTransactions || 0,
                        positiveRatings: seller.seller_reputation?.transactions?.ratings?.positive || 0,
                        location: seller.address?.city || seller.city || ''
                    } : null,
                    products: data.slice(0, 10).map((p: any) => ({
                        title: p.title || p.name || '',
                        price: p.price || p.currentPrice || 0,
                        currency: p.currency_id || p.currency || 'ARS',
                        condition: p.condition || '',
                        soldQuantity: p.sold_quantity || p.soldQuantity || 0,
                        availableQuantity: p.available_quantity || 0,
                        freeShipping: p.shipping?.free_shipping || p.freeShipping || false,
                        rating: p.reviews?.rating_average || p.rating || null,
                        url: p.permalink || p.url || p.link || '',
                        imageUrl: p.thumbnail || p.pictures?.[0]?.url || p.imageUrl || ''
                    }))
                };
                
                return new Response(JSON.stringify({ success: true, result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            } catch (e: any) {
                console.error('MercadoLibre scraper error:', e.message);
                return new Response(JSON.stringify({ success: true, result: { found: false, totalProducts: 0, products: [], seller: null, error: e.message } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
        }

        throw new Error(`Unknown action: ${action}`);

    } catch (error: any) {
        console.error('Apify Proxy Error:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }
});
