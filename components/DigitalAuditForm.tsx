import React, { useState } from 'react';
import {
    ArrowRight, ArrowLeft, Loader2, Sparkles, Globe, Wand2,
    Briefcase, Search, CheckCircle, ExternalLink, AlertTriangle,
    PlusCircle, Edit3, Trash2, Users, ShoppingBag
} from 'lucide-react';
import { DigitalAuditInput, DigitalPreScanResult, StrategicAnalysis, Language } from '../types';
import { scrapeWebsite, WebScraperResult } from '../services/digitalAuditService';

// Icons for social platforms
const SocialIcon = ({ platform }: { platform: string }) => {
    const p = platform.toLowerCase();
    if (p.includes('instagram')) return <span className="text-pink-500 text-xl">📸</span>;
    if (p.includes('tiktok')) return <span className="text-xl">🎵</span>;
    if (p.includes('linkedin')) return <span className="text-blue-600 text-xl">💼</span>;
    if (p.includes('facebook')) return <span className="text-blue-500 text-xl">📘</span>;
    if (p.includes('youtube')) return <span className="text-red-500 text-xl">▶️</span>;
    if (p.includes('google') || p.includes('maps')) return <span className="text-xl">📍</span>;
    if (p.includes('mercado')) return <span className="text-yellow-500 text-xl">🛒</span>;
    return <Globe size={20} className="text-slate-400" />;
};

interface DigitalAuditFormProps {
    lang: Language;
    onComplete: (data: DigitalAuditInput) => void;
    onCancel: () => void;
    parentAnalysis?: StrategicAnalysis | null;
    parentOnboarding?: Record<string, any> | null;
    parentBusinessName?: string;
}

type FormStep = 'url' | 'scanning' | 'review' | 'competitors';

export default function DigitalAuditForm({ lang, onComplete, onCancel, parentAnalysis, parentOnboarding, parentBusinessName }: DigitalAuditFormProps) {
    const [step, setStep] = useState<FormStep>('url');
    const [scanError, setScanError] = useState<string | null>(null);

    // URL inputs
    const [mainUrl, setMainUrl] = useState('');
    const [instagramUrl, setInstagramUrl] = useState('');
    const [tiktokUrl, setTiktokUrl] = useState('');
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [facebookUrl, setFacebookUrl] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [xUrl, setXUrl] = useState('');
    const [pinterestUrl, setPinterestUrl] = useState('');
    const [googleMapsQuery, setGoogleMapsQuery] = useState('');
    const [googlePlaceId, setGooglePlaceId] = useState('');

    // Marketplaces
    const [marketplaces, setMarketplaces] = useState<{ platform: string; storeName: string }[]>([]);

    // Competitors
    const [competitors, setCompetitors] = useState<{ name: string; website: string }[]>([
        { name: '', website: '' }
    ]);

    // Scraper results
    const [scraperData, setScraperData] = useState<WebScraperResult | null>(null);
    const [preScanData, setPreScanData] = useState<DigitalPreScanResult | null>(null);

    // Derive business type from parent analysis (no need to ask again)
    const businessType: 'B2B' | 'B2C' | 'both' = React.useMemo(() => {
        const bt = parentOnboarding?.businessType;
        if (typeof bt === 'string') {
            if (bt.toLowerCase().includes('b2b') && bt.toLowerCase().includes('b2c')) return 'both';
            if (bt.toLowerCase().includes('b2b') || bt.toLowerCase().includes('empresa')) return 'B2B';
        }
        if (bt && typeof bt === 'object') {
            if (bt.b2b && bt.b2c) return 'both';
            if (bt.b2b) return 'B2B';
        }
        return 'B2C';
    }, [parentOnboarding]);

    // Pre-populate from parent onboarding if available
    React.useEffect(() => {
        if (parentOnboarding) {
            const social = parentOnboarding.socialMediaPresence;
            if (social) {
                if (social.instagram) setInstagramUrl(social.instagram);
                if (social.tiktok) setTiktokUrl(social.tiktok);
                if (social.linkedin) setLinkedinUrl(social.linkedin);
                if (social.facebook) setFacebookUrl(social.facebook);
                if (social.youtube) setYoutubeUrl(social.youtube);
            }
            if (parentOnboarding.websiteUrl) setMainUrl(parentOnboarding.websiteUrl);
        }
    }, [parentOnboarding]);

    const runPreScan = async () => {
        if (!mainUrl.trim()) {
            setScanError(lang === 'es' ? 'Ingresá la URL principal de tu negocio.' : 'Enter your main business URL.');
            return;
        }

        setStep('scanning');
        setScanError(null);

        try {
            const scrapeResult = await scrapeWebsite(mainUrl);
            setScraperData(scrapeResult);

            const preScan: DigitalPreScanResult = {
                platform: scrapeResult.platform,
                hasSSL: scrapeResult.hasSSL,
                detectedTools: scrapeResult.detectedTools,
                socialLinks: scrapeResult.socialLinks,
                estimatedFollowers: [],
                googleRating: '',
                googleReviewCount: '',
            };
            setPreScanData(preScan);

            // Auto-fill social URLs from scraped links
            if (scrapeResult.socialLinks) {
                scrapeResult.socialLinks.forEach(link => {
                    const p = link.platform.toLowerCase();
                    if (p.includes('instagram') && !instagramUrl) setInstagramUrl(link.url);
                    if (p.includes('tiktok') && !tiktokUrl) setTiktokUrl(link.url);
                    if (p.includes('linkedin') && !linkedinUrl) setLinkedinUrl(link.url);
                    if (p.includes('facebook') && !facebookUrl) setFacebookUrl(link.url);
                    if (p.includes('youtube') && !youtubeUrl) setYoutubeUrl(link.url);
                    if ((p.includes('twitter') || p.includes('x.com')) && !xUrl) setXUrl(link.url);
                    if (p.includes('pinterest') && !pinterestUrl) setPinterestUrl(link.url);
                    if (p.includes('mercado') && !marketplaces.some(m => m.platform.toLowerCase().includes('mercado'))) {
                        setMarketplaces(prev => [...prev, { platform: 'Mercado Libre', storeName: link.url }]);
                    }
                });
            }

            setStep('review');
        } catch (err: any) {
            console.error('Scrape error:', err);
            setScanError(lang === 'es'
                ? 'No pudimos escanear automáticamente. Completá manualmente las URLs que tengas.'
                : 'Could not auto-scan. Please fill in your URLs manually.');
            setStep('review');
        }
    };

    const addCompetitor = () => {
        if (competitors.length < 5) {
            setCompetitors([...competitors, { name: '', website: '' }]);
        }
    };

    const removeCompetitor = (index: number) => {
        if (competitors.length > 1) {
            setCompetitors(competitors.filter((_, i) => i !== index));
        }
    };

    const updateCompetitor = (index: number, field: 'name' | 'website', value: string) => {
        const updated = [...competitors];
        updated[index] = { ...updated[index], [field]: value };
        setCompetitors(updated);
    };

    const validCompetitors = competitors.filter(c => c.name.trim() && c.website.trim());

    const handleSubmit = () => {
        const auditInput: DigitalAuditInput = {
            websiteUrl: mainUrl,
            instagramUrl: instagramUrl || undefined,
            tiktokUrl: tiktokUrl || undefined,
            linkedinUrl: linkedinUrl || undefined,
            facebookUrl: facebookUrl || undefined,
            youtubeUrl: youtubeUrl || undefined,
            xUrl: xUrl || undefined,
            pinterestUrl: pinterestUrl || undefined,
            googleMapsUrl: googlePlaceId ? `place_id:${googlePlaceId}` : (googleMapsQuery || undefined),
            marketplaces: marketplaces.filter(m => m.platform.trim()).length > 0 ? marketplaces.filter(m => m.platform.trim()) : undefined,
            businessType,
            competitors: validCompetitors.length > 0 ? validCompetitors : undefined,
            preScanData: preScanData || undefined,
            scraperData: scraperData || undefined,
        };
        onComplete(auditInput);
    };

    // Scanning messages
    const [scanMsgIdx, setScanMsgIdx] = useState(0);
    const scanMsgs = lang === 'es' ? [
        '🔍 Leyendo el código fuente de tu web...',
        '📱 Buscando perfiles en redes sociales...',
        '🔧 Detectando plataforma y herramientas...',
    ] : [
        '🔍 Reading your website source code...',
        '📱 Finding social media profiles...',
        '🔧 Detecting platform and tools...',
    ];

    React.useEffect(() => {
        if (step !== 'scanning') return;
        const interval = setInterval(() => {
            setScanMsgIdx(prev => prev >= scanMsgs.length - 1 ? 0 : prev + 1);
        }, 3000);
        return () => clearInterval(interval);
    }, [step]);

    // Count filled socials for progress
    const socialFields = [
        { label: 'Instagram', value: instagramUrl, setter: setInstagramUrl, ph: 'https://instagram.com/tunegocio', emoji: '📸' },
        { label: 'Facebook', value: facebookUrl, setter: setFacebookUrl, ph: 'https://facebook.com/tunegocio', emoji: '📘' },
        { label: 'TikTok', value: tiktokUrl, setter: setTiktokUrl, ph: 'https://tiktok.com/@tunegocio', emoji: '🎵' },
        { label: 'LinkedIn', value: linkedinUrl, setter: setLinkedinUrl, ph: 'https://linkedin.com/in/tunegocio o /company/...', emoji: '💼' },
        { label: 'X (Twitter)', value: xUrl, setter: setXUrl, ph: 'https://x.com/tunegocio', emoji: '✒️' },
        { label: 'YouTube', value: youtubeUrl, setter: setYoutubeUrl, ph: 'https://youtube.com/@tunegocio', emoji: '▶️' },
        { label: 'Pinterest', value: pinterestUrl, setter: setPinterestUrl, ph: 'https://pinterest.com/tunegocio', emoji: '📌' },
    ];

    // Google Places Autocomplete
    const googleInputRef = React.useRef<HTMLInputElement>(null);
    const autocompleteRef = React.useRef<any>(null);

    React.useEffect(() => {
        if (step !== 'review') return;
        // Load Google Maps JS API if not already loaded
        const MAPS_KEY = 'AIzaSyBu8XGQKjHCvnb4qsjs_EaWVqv41vJuv_0';
        const scriptId = 'google-maps-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`;
            script.async = true;
            script.onload = () => initAutocomplete();
            document.head.appendChild(script);
        } else if ((window as any).google?.maps?.places) {
            initAutocomplete();
        }
    }, [step]);

    const initAutocomplete = () => {
        if (!googleInputRef.current || autocompleteRef.current) return;
        const google = (window as any).google;
        if (!google?.maps?.places) return;
        const ac = new google.maps.places.Autocomplete(googleInputRef.current, {
            types: ['establishment'],
        });
        ac.addListener('place_changed', () => {
            const place = ac.getPlace();
            if (place) {
                setGoogleMapsQuery(place.name + (place.formatted_address ? ` — ${place.formatted_address}` : ''));
                setGooglePlaceId(place.place_id || '');
            }
        });
        autocompleteRef.current = ac;
    };

    // ── STEP 1: Just the main URL ───────────────────────────────────
    const renderUrlStep = () => (
        <div className="animate-fade-in max-w-2xl mx-auto text-center">
            {parentBusinessName && (
                <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <Briefcase size={16} className="text-emerald-500" />
                    <span className="text-sm font-bold text-emerald-700">
                        {lang === 'es' ? 'Auditoría Digital para:' : 'Digital Audit for:'}{' '}
                        <span className="text-emerald-900">{parentBusinessName}</span>
                    </span>
                </div>
            )}

            <div className="mb-8">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3 leading-tight">
                    {lang === 'es'
                        ? '¿Cuál es la URL principal de tu negocio?'
                        : 'What is your main business URL?'}
                </h2>
                <p className="text-lg text-slate-500 leading-relaxed max-w-lg mx-auto">
                    {lang === 'es'
                        ? 'Vamos a escanear tu web para detectar automáticamente tus redes sociales y herramientas.'
                        : 'We\'ll scan your website to auto-detect your social media profiles and tools.'}
                </p>
            </div>

            {scanError && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl mb-6 font-medium text-sm flex items-center gap-2 justify-center">
                    <AlertTriangle size={16} />
                    {scanError}
                </div>
            )}

            <div className="max-w-lg mx-auto mb-8">
                <input
                    type="url"
                    className="w-full px-6 py-5 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none text-lg text-center transition-all"
                    placeholder="https://www.tunegocio.com"
                    value={mainUrl}
                    onChange={(e) => setMainUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && runPreScan()}
                />
                <p className="text-xs text-slate-400 mt-2">
                    {lang === 'es'
                        ? 'Tip: si no tenés web, poné tu perfil de Instagram o tu tienda en Mercado Libre'
                        : 'Tip: if you don\'t have a website, enter your Instagram profile or online store'}
                </p>
            </div>

            <div className="flex items-center justify-center gap-4">
                <button onClick={onCancel} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 flex items-center gap-2 transition">
                    <ArrowLeft size={18} /> {lang === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                    onClick={runPreScan}
                    disabled={!mainUrl.trim()}
                    className="px-8 py-4 rounded-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center gap-3 shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all text-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                    <Search size={22} />
                    {lang === 'es' ? 'Escanear automáticamente' : 'Auto-scan'}
                </button>
            </div>
        </div>
    );

    // ── STEP 2: Scanning animation ───────────────────────────────────
    const renderScanning = () => (
        <div className="animate-fade-in flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
            <div className="w-28 h-28 relative mb-8">
                <div className="absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-2 border-4 border-teal-300 rounded-full border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                <Search className="absolute inset-0 m-auto text-emerald-600" size={36} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">
                {lang === 'es' ? 'Escaneando tu presencia digital...' : 'Scanning your digital presence...'}
            </h3>
            <p className="text-xl text-emerald-600 font-bold transition-all duration-500" key={scanMsgIdx}>
                {scanMsgs[scanMsgIdx]}
            </p>
            <p className="text-sm text-slate-400 mt-6">
                {lang === 'es' ? 'Esto toma entre 10 y 30 segundos' : 'This takes 10-30 seconds'}
            </p>
        </div>
    );

    // ── STEP 3: Review what was found + fill gaps ────────────────────
    const renderReview = () => {
        const detectedSocials = preScanData?.socialLinks?.map(l => l.platform.toLowerCase()) || [];

        return (
            <div className="animate-fade-in max-w-3xl mx-auto">
                {/* Progress bar */}
                <div className="mb-2">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                            {lang === 'es' ? 'Paso 2 de 3 — Tus redes y presencia' : 'Step 2 of 3 — Your social presence'}
                        </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-500 ease-out" style={{ width: '66%' }} />
                    </div>
                </div>

                <div className="mb-6 mt-6">
                    <h2 className="text-3xl font-black text-slate-900 mb-2">
                        {lang === 'es'
                            ? (preScanData ? '✅ Esto es lo que encontramos' : 'Completá tu información')
                            : (preScanData ? '✅ Here\'s what we found' : 'Complete your information')}
                    </h2>
                    <p className="text-lg text-slate-500">
                        {lang === 'es'
                            ? 'Verificá que todo esté bien y completá lo que falte. Cuantas más redes completes, mejor será el diagnóstico.'
                            : 'Verify everything is correct and fill in what\'s missing. The more profiles you provide, the better the diagnosis.'}
                    </p>
                </div>

                {scanError && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl mb-6 font-medium text-sm flex items-center gap-2">
                        <AlertTriangle size={16} />
                        {scanError}
                    </div>
                )}

                {/* Auto-detected results card */}
                {preScanData && (
                    <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6 mb-6 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                            <Sparkles size={14} />
                            {lang === 'es' ? 'Detectado automáticamente' : 'Auto-detected'}
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <Globe size={20} className="text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase">{lang === 'es' ? 'Plataforma' : 'Platform'}</p>
                                <p className="text-lg font-bold text-slate-900">{preScanData.platform || 'N/A'}</p>
                            </div>
                            <div className="ml-auto">
                                {preScanData.hasSSL
                                    ? <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg">🔒 SSL</span>
                                    : <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-lg">⚠️ Sin SSL</span>
                                }
                            </div>
                        </div>

                        {preScanData.detectedTools && preScanData.detectedTools.length > 0 && (
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase mb-2">{lang === 'es' ? 'Herramientas' : 'Tools'}</p>
                                <div className="flex flex-wrap gap-2">
                                    {preScanData.detectedTools.map((tool, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">{tool}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Editable social URLs */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <Edit3 size={16} className="text-slate-500" />
                        <p className="text-sm font-bold text-slate-700">
                            {lang === 'es' ? 'Tus redes sociales y presencia digital' : 'Your social media & digital presence'}
                        </p>
                        <span className="text-xs text-slate-400">
                            {lang === 'es' ? '(completá todo lo que tengas)' : '(fill in everything you have)'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {socialFields.map((social) => {
                            const wasDetected = preScanData?.socialLinks?.some(
                                l => l.platform.toLowerCase().includes(social.label.toLowerCase())
                            );
                            return (
                                <div key={social.label} className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                        <span>{social.emoji}</span> {social.label}
                                        {wasDetected && <span className="text-emerald-500 text-[10px] ml-1">✓ detectado</span>}
                                    </label>
                                    <input
                                        type="url"
                                        className={`w-full px-4 py-3 rounded-xl border ${wasDetected ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-300'} focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-sm transition-all`}
                                        placeholder={social.ph}
                                        value={social.value}
                                        onChange={(e) => social.setter(e.target.value)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Google Maps / Business — Autocomplete */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">📍</span>
                        <p className="text-sm font-bold text-slate-700">
                            {lang === 'es' ? 'Google Maps / Perfil de Negocio' : 'Google Maps / Business Profile'}
                        </p>
                    </div>
                    <input
                        ref={googleInputRef}
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-sm transition-all"
                        placeholder={lang === 'es' ? 'Empezá a escribir el nombre de tu negocio...' : 'Start typing your business name...'}
                        value={googleMapsQuery}
                        onChange={(e) => { setGoogleMapsQuery(e.target.value); setGooglePlaceId(''); }}
                    />
                    {googlePlaceId && (
                        <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1 font-medium">
                            ✓ {lang === 'es' ? 'Negocio seleccionado de Google Maps' : 'Business selected from Google Maps'}
                        </p>
                    )}
                    {!googlePlaceId && (
                        <p className="text-xs text-slate-400 mt-1.5">
                            {lang === 'es' ? 'Escribí y seleccioná tu negocio del desplegable. Si no aparece, poné el nombre + ciudad.' : 'Type and select your business from the dropdown. If not found, enter name + city.'}
                        </p>
                    )}
                </div>

                {/* Marketplaces */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🛒</span>
                            <p className="text-sm font-bold text-slate-700">
                                {lang === 'es' ? '¿Vendés en algún marketplace?' : 'Do you sell on any marketplace?'}
                            </p>
                        </div>
                    </div>

                    {marketplaces.length > 0 && (
                        <div className="space-y-2 mb-3">
                            {marketplaces.map((mp, i) => (
                                <div key={i} className="flex gap-2 items-center">
                                    <select
                                        className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium outline-none focus:border-emerald-500 w-44"
                                        value={mp.platform}
                                        onChange={(e) => {
                                            const updated = [...marketplaces];
                                            updated[i] = { ...updated[i], platform: e.target.value };
                                            setMarketplaces(updated);
                                        }}
                                    >
                                        <option value="Mercado Libre">Mercado Libre</option>
                                        <option value="Amazon">Amazon</option>
                                        <option value="Tienda Nube Marketplace">Tienda Nube Marketplace</option>
                                        <option value="Shopee">Shopee</option>
                                        <option value="Etsy">Etsy</option>
                                        <option value="Otro">{lang === 'es' ? 'Otro' : 'Other'}</option>
                                    </select>
                                    <input
                                        type="text"
                                        className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-sm"
                                        placeholder={lang === 'es' ? 'Nombre de tu tienda (opcional)' : 'Store name (optional)'}
                                        value={mp.storeName}
                                        onChange={(e) => {
                                            const updated = [...marketplaces];
                                            updated[i] = { ...updated[i], storeName: e.target.value };
                                            setMarketplaces(updated);
                                        }}
                                    />
                                    <button
                                        onClick={() => setMarketplaces(marketplaces.filter((_, j) => j !== i))}
                                        className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 hover:bg-red-100 transition text-red-500"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={() => setMarketplaces([...marketplaces, { platform: 'Mercado Libre', storeName: '' }])}
                        className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition flex items-center justify-center gap-2 text-sm font-bold"
                    >
                        <PlusCircle size={14} /> {lang === 'es' ? 'Agregar marketplace' : 'Add marketplace'}
                    </button>
                </div>

                {/* Navigation */}
                <div className="mt-8 flex items-center justify-between">
                    <button
                        onClick={() => { setStep('url'); setPreScanData(null); setScanError(null); }}
                        className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 flex items-center gap-2"
                    >
                        <ArrowLeft size={18} /> {lang === 'es' ? 'Atrás' : 'Back'}
                    </button>
                    <button
                        onClick={() => setStep('competitors')}
                        className="px-8 py-4 rounded-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center gap-3 shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all text-lg"
                    >
                        {lang === 'es' ? 'Siguiente: Competidores' : 'Next: Competitors'}
                        <ArrowRight size={22} />
                    </button>
                </div>
            </div>
        );
    };

    // ── STEP 4: Competitors ──────────────────────────────────────────
    const renderCompetitors = () => (
        <div className="animate-fade-in max-w-3xl mx-auto">
            {/* Progress bar */}
            <div className="mb-2">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                        {lang === 'es' ? 'Paso 3 de 3 — Tu competencia' : 'Step 3 of 3 — Your competition'}
                    </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-500 ease-out w-full" />
                </div>
            </div>

            <div className="mb-6 mt-6">
                <h2 className="text-3xl font-black text-slate-900 mb-2">
                    {lang === 'es'
                        ? '🎯 ¿Quiénes son tus competidores directos?'
                        : '🎯 Who are your direct competitors?'}
                </h2>
                <p className="text-lg text-slate-500">
                    {lang === 'es'
                        ? 'Nadie conoce mejor a tu competencia que vos. Danos al menos 1 competidor para comparar su presencia digital con la tuya.'
                        : 'Nobody knows your competition better than you. Give us at least 1 competitor to benchmark their digital presence against yours.'}
                </p>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Users size={20} className="text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-blue-800 mb-1">
                            {lang === 'es' ? '¿Qué vamos a hacer con esto?' : 'What will we do with this?'}
                        </p>
                        <p className="text-sm text-blue-700 leading-relaxed">
                            {lang === 'es'
                                ? 'Vamos a escanear la web y redes de cada competidor para mostrarte una comparación real: seguidores, engagement, herramientas, estrategia de contenido, y qué están haciendo mejor que vos.'
                                : 'We\'ll scan each competitor\'s website and social media to show you a real comparison: followers, engagement, tools, content strategy, and what they\'re doing better than you.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Competitor inputs */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <ShoppingBag size={16} className="text-slate-500" />
                        {lang === 'es' ? 'Competidores directos' : 'Direct competitors'}
                    </p>
                    <span className="text-xs text-slate-400">
                        {lang === 'es' ? `${validCompetitors.length} de mín. 1` : `${validCompetitors.length} of min. 1`}
                    </span>
                </div>

                <div className="space-y-3">
                    {competitors.map((comp, i) => (
                        <div key={i} className="flex gap-3 items-start">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-1">
                                <span className="text-sm font-black text-slate-500">{i + 1}</span>
                            </div>
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-sm transition-all"
                                    placeholder={lang === 'es' ? 'Nombre del competidor' : 'Competitor name'}
                                    value={comp.name}
                                    onChange={(e) => updateCompetitor(i, 'name', e.target.value)}
                                />
                                <input
                                    type="url"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-sm transition-all"
                                    placeholder="https://www.competidor.com"
                                    value={comp.website}
                                    onChange={(e) => updateCompetitor(i, 'website', e.target.value)}
                                />
                            </div>
                            {competitors.length > 1 && (
                                <button
                                    onClick={() => removeCompetitor(i)}
                                    className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 mt-1 hover:bg-red-100 transition text-red-500"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {competitors.length < 5 && (
                    <button
                        onClick={addCompetitor}
                        className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition flex items-center justify-center gap-2 text-sm font-bold"
                    >
                        <PlusCircle size={16} /> {lang === 'es' ? 'Agregar otro competidor' : 'Add another competitor'}
                    </button>
                )}
            </div>

            {/* What you'll receive */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6 mb-6">
                <h3 className="font-black text-slate-900 text-lg mb-4">
                    {lang === 'es' ? '📊 Lo que vas a recibir:' : '📊 What you\'ll receive:'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {[
                        lang === 'es' ? '📊 Comparación real con seguidores y engagement' : '📊 Real comparison with followers & engagement',
                        lang === 'es' ? '🔍 Hallazgos clave priorizados por gravedad' : '🔍 Key findings prioritized by severity',
                        lang === 'es' ? '🔧 Auditoría técnica web completa' : '🔧 Complete web technical audit',
                        lang === 'es' ? '🤖 SEO para IAs (AEO) — ¡Vanguardia!' : '🤖 AI-Ready SEO (AEO) — Cutting edge!',
                        lang === 'es' ? '📱 Diagnóstico de cada red social' : '📱 Social media diagnosis per channel',
                        lang === 'es' ? '🏆 Qué hace mejor tu competencia vs vos' : '🏆 What competitors do better vs. you',
                        lang === 'es' ? '💰 Dinero que estás dejando en la mesa' : '💰 Money you\'re leaving on the table',
                        lang === 'es' ? '📅 Plan de acción 30/60/90 días' : '📅 30/60/90 day action plan',
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-slate-700 font-medium">
                            <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                            {item}
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between">
                <button
                    onClick={() => setStep('review')}
                    className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 flex items-center gap-2"
                >
                    <ArrowLeft size={18} /> {lang === 'es' ? 'Atrás' : 'Back'}
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={validCompetitors.length === 0}
                    className="px-8 py-4 rounded-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center gap-3 shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all text-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                    <Sparkles size={22} />
                    {lang === 'es' ? 'Continuar al pago' : 'Continue to payment'}
                </button>
            </div>
        </div>
    );

    // ── MAIN RENDER ──────────────────────────────────────────────────
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-6 sm:p-12 overflow-hidden relative">
                {/* Decorative element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                {step === 'url' && renderUrlStep()}
                {step === 'scanning' && renderScanning()}
                {step === 'review' && renderReview()}
                {step === 'competitors' && renderCompetitors()}
            </div>
        </div>
    );
}
