import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import AppHeader from '../AppHeader';
import {
    Loader2, ArrowLeft, Target, Shield, Search, Presentation,
    UserCircle2, Clock, MapPin, MonitorSmartphone, Music, Car,
    Briefcase, MessagesSquare, Zap, Crosshair, HelpCircle,
    LayoutTemplate, Megaphone, FileText, TrendingUp, Store,
    Repeat, BarChart3, Rocket, CheckCircle2, ListTodo,
    DollarSign, Calendar, MessageSquare, AlertTriangle,
    Star, Package, ChevronDown, ChevronUp, Copy, Check,
    Flame, Sun, Globe, Download, Sparkles
} from 'lucide-react';
import { analyzeProductDeepDive } from '../../services/geminiDeepDiveService';
import ProfundizarPanel from '../ProfundizarPanel';
import GlossaryModal from '../GlossaryModal';
import FeedbackModal from '../FeedbackModal';
import type {
    DeepDiveResult, DeepDivePersona, ObjectionHandling, CompetitorAnalysis,
    SalesSurvivalKit, DeepDiveExecutionStep, PricingStrategy, UnitEconomics,
    ContentCalendarDay, StrategicAnalysis, DeepDiveInput, SeasonalityInsight, QuickWin, SocialListening
} from '../../types';

export default function DeepDiveView() {
    const { reportId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [lang, setLang] = useState('es');
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [generatingStep, setGeneratingStep] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<DeepDiveResult | null>(null);
    const [productName, setProductName] = useState('');
    const [activeTab, setActiveTab] = useState<string>('quickwins');
    const [profundizarOpen, setProfundizarOpen] = useState(false);
    const [profundizarSection, setProfundizarSection] = useState({ title: '', content: '' });

    useEffect(() => {
        if (!user || !reportId) return;

        const fetchOrGenerate = async () => {
            try {
                const { data, error: fetchError } = await supabase
                    .from('product_analyses')
                    .select('*, business_reports!product_analyses_business_report_id_fkey!inner(business_name, analysis_result, onboarding_data)')
                    .eq('id', reportId)
                    .single();

                if (fetchError) throw fetchError;
                if (!data) throw new Error('No se encontró el análisis');

                setProductName((data.product_input_data as any)?.productName || 'Producto');

                // If already completed, just show it
                if (data.status === 'completed' && data.analysis_result) {
                    setResult(data.analysis_result as DeepDiveResult);
                    setLoading(false);
                    return;
                }

                // If pending (paid), draft (with beta skip), or analyzing (user refreshed mid-gen) — trigger generation
                if (data.status === 'pending' || data.status === 'draft' || data.status === 'analyzing') {
                    setLoading(false);
                    setGenerating(true);

                    // Update status to analyzing
                    await supabase.from('product_analyses').update({ status: 'analyzing' }).eq('id', reportId);

                    setGeneratingStep(lang === 'es' ? 'Cargando contexto del negocio...' : 'Loading business context...');

                    const parentReport = (data as any).business_reports;
                    const parentAnalysis = parentReport?.analysis_result as StrategicAnalysis;
                    const productInput = data.product_input_data as DeepDiveInput;

                    if (!parentAnalysis) throw new Error('No se encontró el análisis del negocio padre.');

                    // Strip heavy fields from parent onboarding
                    let parentOnboarding: Record<string, any> | null = null;
                    if (parentReport?.onboarding_data) {
                        const { productImages, documents, ...light } = parentReport.onboarding_data as any;
                        parentOnboarding = light;
                    }

                    setGeneratingStep(lang === 'es' ? 'Analizando producto con IA...' : 'Analyzing product with AI...');

                    const { result: aiResult } = await analyzeProductDeepDive(parentAnalysis, parentOnboarding, productInput, lang as any);

                    setGeneratingStep(lang === 'es' ? 'Guardando resultados...' : 'Saving results...');

                    await supabase
                        .from('product_analyses')
                        .update({ status: 'completed', analysis_result: aiResult })
                        .eq('id', reportId);

                    setResult(aiResult);
                    setGenerating(false);
                    return;
                }

                // If failed or other status
                throw new Error(lang === 'es' ? 'El análisis falló. Intentá de nuevo desde el Dashboard.' : 'Analysis failed. Try again from the Dashboard.');

            } catch (err: any) {
                console.error(err);
                // If generation fails, mark as failed
                if (generating) {
                    try { await supabase.from('product_analyses').update({ status: 'failed' }).eq('id', reportId); } catch (_) { }
                }
                setError(err.message || 'Error al cargar el análisis');
                setLoading(false);
                setGenerating(false);
            }
        };

        fetchOrGenerate();
    }, [user, reportId]);

    // Rotating insight messages during generation
    const [insightIndex, setInsightIndex] = useState(0);
    const insights = lang === 'es' ? [
        '🔍 Analizando el ADN de tu producto...',
        '🧠 Construyendo perfiles psicográficos de tus clientes ideales...',
        '⚔️ Desarmando la estrategia de tus competidores...',
        '💡 Diseñando 7 días de contenido irresistible...',
        '🎯 Calculando tu unit economics ideal...',
        '📧 Escribiendo templates de emails y DMs en frío...',
        '🗺️ Mapeando dónde vive tu cliente ideal en internet...',
        '💰 Optimizando tu estrategia de precios...',
        '🚀 Armando tu plan de ejecución para los próximos 90 días...',
        '✨ Puliendo los últimos detalles del informe...'
    ] : [
        '🔍 Analyzing your product DNA...',
        '🧠 Building psychographic profiles of ideal customers...',
        '⚔️ Tearing down competitor strategies...',
        '💡 Designing 7 days of irresistible content...',
        '🎯 Calculating ideal unit economics...',
        '📧 Writing cold email and DM templates...',
        '🗺️ Mapping where your ideal customer lives online...',
        '💰 Optimizing your pricing strategy...',
        '🚀 Building your 90-day execution plan...',
        '✨ Polishing the final details...'
    ];

    useEffect(() => {
        if (!generating) return;
        const interval = setInterval(() => {
            setInsightIndex(prev => {
                if (prev >= insights.length - 1) return prev; // Stay on last message, don't loop
                return prev + 1;
            });
        }, 4000);
        return () => clearInterval(interval);
    }, [generating, insights.length]);

    if (generating) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                {/* Floating particles */}
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full opacity-20"
                        style={{
                            width: `${Math.random() * 6 + 2}px`,
                            height: `${Math.random() * 6 + 2}px`,
                            background: i % 2 === 0 ? '#a78bfa' : '#c084fc',
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animation: `float ${Math.random() * 6 + 4}s ease-in-out infinite`,
                            animationDelay: `${Math.random() * 5}s`
                        }}
                    />
                ))}

                {/* Central glow */}
                <div className="absolute w-96 h-96 bg-violet-600/20 rounded-full filter blur-[100px] animate-pulse"></div>

                <div className="relative z-10 max-w-lg text-center">
                    {/* Main animated icon */}
                    <div className="w-32 h-32 relative mb-10 mx-auto">
                        <div className="absolute inset-0 border-[3px] border-violet-400/30 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
                        <div className="absolute inset-0 border-[3px] border-violet-500/50 rounded-full"></div>
                        <div className="absolute inset-0 border-[3px] border-transparent border-t-fuchsia-400 border-r-violet-400 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
                        <div className="absolute inset-3 border-[3px] border-transparent border-b-cyan-400 border-l-violet-300 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }}></div>
                        <div className="absolute inset-6 border-[3px] border-transparent border-t-fuchsia-300 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
                        <Search className="absolute inset-0 m-auto text-white drop-shadow-lg" size={36} />
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                        {lang === 'es' ? 'Generando tu Deep Dive' : 'Generating your Deep Dive'}
                    </h2>
                    <p className="text-lg text-violet-300 font-semibold mb-8">{productName}</p>

                    {/* Current step */}
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/10">
                        <p className="text-sm text-violet-300 font-bold uppercase tracking-wider mb-2">
                            {generatingStep}
                        </p>
                        <p className="text-xl text-white font-bold transition-all duration-500" key={insightIndex}>
                            {insights[insightIndex]}
                        </p>
                    </div>

                    {/* Progress dots */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        {insights.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-500 ${i <= insightIndex ? 'bg-violet-400 w-4' : 'bg-white/20 w-1.5'
                                    }`}
                            />
                        ))}
                    </div>

                    <p className="text-sm text-violet-400/60">
                        {lang === 'es' ? 'La IA está trabajando. Esto toma entre 30 y 90 segundos.' : 'AI is working. This takes 30-90 seconds.'}
                    </p>
                </div>

                <style>{`
                    @keyframes float {
                        0%, 100% { transform: translateY(0px) translateX(0px); }
                        25% { transform: translateY(-20px) translateX(10px); }
                        50% { transform: translateY(-10px) translateX(-15px); }
                        75% { transform: translateY(-25px) translateX(5px); }
                    }
                `}</style>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
                <Loader2 className="animate-spin text-violet-600 mb-4" size={48} />
                <h2 className="text-xl font-bold text-slate-800">Cargando Deep Dive...</h2>
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 font-sans">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center">
                    <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
                    <p className="text-red-600 mb-6">{error || 'No se pudo cargar la información'}</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-900 transition"
                    >
                        Volver al Panel
                    </button>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'quickwins', label: lang === 'es' ? '🔥 Quick Wins' : '🔥 Quick Wins', icon: Flame },
        { id: 'market', label: lang === 'es' ? 'Estrategia' : 'Strategy', icon: TrendingUp },
        { id: 'pricing', label: lang === 'es' ? 'Pricing & ROI' : 'Pricing & ROI', icon: DollarSign },
        { id: 'personas', label: 'Personas', icon: UserCircle2 },
        { id: 'objections', label: lang === 'es' ? 'Objeciones' : 'Objections', icon: Shield },
        { id: 'competitors', label: lang === 'es' ? 'Competencia' : 'Competitors', icon: Crosshair },
        { id: 'social', label: lang === 'es' ? 'Redes' : 'Social', icon: Globe },
        { id: 'sales', label: lang === 'es' ? 'Kit de Ventas' : 'Sales Kit', icon: Zap },
        { id: 'content', label: lang === 'es' ? 'Contenido' : 'Content', icon: Calendar },
        { id: 'seasonality', label: lang === 'es' ? 'Estacionalidad' : 'Seasonality', icon: Sun },
        { id: 'execution', label: lang === 'es' ? 'Plan de Acción' : 'Action Plan', icon: Rocket },
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">

            <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Header Section */}
                <div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition mb-6"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        {lang === 'es' ? 'Volver al Dashboard' : 'Back to Dashboard'}
                    </button>
                    <div className="flex justify-end mb-4 print:hidden">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-1.5 px-4 py-2 bg-white text-slate-700 rounded-xl text-sm font-semibold border border-slate-200 hover:bg-slate-50 hover:shadow transition"
                        >
                            <Download size={14} />
                            PDF
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-violet-900 via-fuchsia-900 to-indigo-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-fuchsia-500/10 rounded-full filter blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-violet-200 uppercase tracking-widest mb-4">
                                <Search size={14} />
                                {lang === 'es' ? 'Deep Dive — Análisis Táctico' : 'Tactical Deep Dive'}
                            </div>
                            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
                                {productName}
                            </h1>
                            <p className="text-lg text-violet-200 max-w-3xl leading-relaxed">
                                {result.summary}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 📌 3 Pasos Para Esta Semana */}
                {result.quickWins && result.quickWins.length > 0 && (
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 sm:p-8 text-white shadow-lg print:shadow-none">
                        <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                            <Rocket size={20} />
                            {lang === 'es' ? '📌 Tu Plan de Acción Inmediato' : '📌 Your Immediate Action Plan'}
                        </h3>
                        <p className="text-amber-100 text-sm mb-4">
                            {lang === 'es' ? 'Estas son las 3 acciones más importantes que podés hacer esta semana:' : 'These are the 3 most important actions you can take this week:'}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {result.quickWins.slice(0, 3).map((win, i) => (
                                <div key={i} className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-black text-lg mb-3">{i + 1}</div>
                                    <p className="font-bold text-sm leading-snug">{win.action}</p>
                                    <span className="inline-flex items-center gap-1 text-xs mt-2 text-amber-100 font-medium">
                                        <Clock size={10} /> {win.timeToExecute}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === tab.id
                                ? 'bg-violet-600 text-white shadow-md'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="pb-20">
                    {activeTab === 'quickwins' && <QuickWinsTab wins={result.quickWins} lang={lang} />}
                    {activeTab === 'market' && result.marketStrategy && <MarketStrategyTab data={result.marketStrategy} lang={lang} />}
                    {activeTab === 'pricing' && <PricingTab pricing={result.pricingStrategy} economics={result.unitEconomics} lang={lang} />}
                    {activeTab === 'personas' && <PersonasTab personas={result.targetPersonas} lang={lang} onProfundizar={(title, content) => { setProfundizarSection({ title, content }); setProfundizarOpen(true); }} />}
                    {activeTab === 'objections' && <ObjectionsTab objections={result.objectionMatrix} lang={lang} />}
                    {activeTab === 'competitors' && <CompetitorsTab competitors={result.competitorTearDown} lang={lang} onProfundizar={(title, content) => { setProfundizarSection({ title, content }); setProfundizarOpen(true); }} />}
                    {activeTab === 'social' && <SocialListeningTab data={result.socialListeningNiche} lang={lang} />}
                    {activeTab === 'sales' && <SalesKitTab kit={result.salesSurvivalKit} lang={lang} />}
                    {activeTab === 'content' && <ContentCalendarTab calendar={result.contentCalendar} lang={lang} />}
                    {activeTab === 'seasonality' && <SeasonalityTab data={result.seasonality} lang={lang} />}
                    {activeTab === 'execution' && <ExecutionTab plan={result.executionPlan} lang={lang} />}

                    {/* Profundizar button */}
                    <div className="mt-8 text-center print:hidden">
                        <button
                            onClick={() => {
                                const tabLabel = tabs.find(t => t.id === activeTab)?.label || activeTab;
                                const contentMap: Record<string, string> = {
                                    quickwins: result.quickWins?.map(w => w.action).join('. ') || '',
                                    market: JSON.stringify(result.marketStrategy || {}).slice(0, 2000),
                                    pricing: `Price: ${result.pricingStrategy?.recommendedPrice}. ${result.pricingStrategy?.justification || ''}. CAC: ${result.unitEconomics?.estimatedCAC}. LTV: ${result.unitEconomics?.estimatedLTV}`,
                                    personas: result.targetPersonas?.map(p => `${p.name}: ${p.profile}`).join(' | ') || '',
                                    objections: result.objectionMatrix?.map(o => `${o.objection}: ${o.response}`).join(' | ') || '',
                                    competitors: result.competitorTearDown?.map(c => `${c.name}: ${c.attackStrategy}`).join(' | ') || '',
                                    social: result.socialListeningNiche?.map(s => `${s.platform}: ${s.insight}`).join(' | ') || '',
                                    sales: `Email: ${result.salesSurvivalKit?.coldEmailTemplate?.slice(0, 200)}. Pitch: ${result.salesSurvivalKit?.elevatorPitch?.slice(0, 200)}`,
                                    content: result.contentCalendar?.map(d => `${d.day}: ${d.topic}`).join(', ') || '',
                                    seasonality: result.seasonality?.map(s => `${s.period}: ${s.strategy}`).join(' | ') || '',
                                    execution: result.executionPlan?.map(e => `${e.phase}: ${e.actions?.join(', ')}`).join(' | ') || '',
                                };
                                setProfundizarSection({ title: tabLabel, content: contentMap[activeTab] || '' });
                                setProfundizarOpen(true);
                            }}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-50 text-violet-700 border border-violet-200 rounded-xl font-bold text-sm hover:bg-violet-100 hover:shadow transition-all"
                        >
                            <Sparkles size={16} />
                            {lang === 'es' ? 'Profundizar esta sección' : 'Deep dive this section'}
                        </button>
                    </div>

                    {/* Feedback trigger */}
                    <div className="mt-8 print:hidden">
                        <FeedbackModal
                            deepDiveId={reportId}
                            reportType="deepdive"
                            userId={user!.id}
                            lang={lang}
                        />
                    </div>
                </div>

                {/* ProfundizarPanel */}
                <ProfundizarPanel
                    isOpen={profundizarOpen}
                    onClose={() => setProfundizarOpen(false)}
                    sectionTitle={profundizarSection.title}
                    sectionContent={profundizarSection.content}
                    reportContext={`Producto: ${productName}. Resumen: ${result.summary?.slice(0, 500) || ''}`}
                    reportId={reportId || ''}
                    reportType="product"
                    lang={lang as any}
                />

                <GlossaryModal lang={lang as any} />

            </main>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

function MarketStrategyTab({ data, lang }: { data: DeepDiveResult['marketStrategy'], lang: string }) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                            <Briefcase className="text-indigo-600" size={24} />
                        </div>
                        <div>
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest block mb-1">{lang === 'es' ? 'Modelo Ideal' : 'Ideal Model'}</span>
                            <h3 className="text-2xl font-black text-slate-900">{data.businessModel}</h3>
                        </div>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">{data.modelJustification}</p>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <BarChart3 className="text-emerald-600" size={24} />
                        </div>
                        <div>
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest block mb-1">{lang === 'es' ? 'Volumen Esperado' : 'Expected Volume'}</span>
                            <h3 className="text-xl font-bold text-slate-900">{lang === 'es' ? 'Proyección Mensual' : 'Monthly Projection'}</h3>
                        </div>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">{data.expectedMonthlyVolume}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
                        <Store className="text-blue-500" />
                        <h3 className="font-bold text-slate-800">{lang === 'es' ? 'Plataformas Recomendadas' : 'Recommended Platforms'}</h3>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-wrap gap-2">
                            {data.recommendedPlatforms.map((platform, i) => (
                                <span key={i} className="px-4 py-2 bg-blue-50 text-blue-700 font-semibold rounded-lg border border-blue-100">{platform}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
                        <Repeat className="text-rose-500" />
                        <h3 className="font-bold text-slate-800">{lang === 'es' ? 'Retención y Lealtad' : 'Retention & Loyalty'}</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{lang === 'es' ? 'Estrategias de Retención' : 'Retention Strategies'}</h4>
                            <ul className="space-y-2">
                                {data.retentionStrategies.map((strat, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0"></div>
                                        {strat}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{lang === 'es' ? 'Ganchos de Lealtad' : 'Loyalty Hooks'}</h4>
                            <div className="flex flex-wrap gap-2">
                                {data.loyaltyHooks.map((hook, i) => (
                                    <span key={i} className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-full border border-rose-100">{hook}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PricingTab({ pricing, economics, lang }: { pricing?: PricingStrategy, economics?: UnitEconomics, lang: string }) {
    if (!pricing && !economics) return <p className="text-slate-500 italic p-8">{lang === 'es' ? 'Datos no disponibles.' : 'Data not available.'}</p>;

    return (
        <div className="space-y-6">
            {/* Pricing Strategy */}
            {pricing && (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <DollarSign className="text-emerald-600" size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900">{lang === 'es' ? 'Estrategia de Pricing' : 'Pricing Strategy'}</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">{lang === 'es' ? 'Evaluación Precio Actual' : 'Current Price Assessment'}</span>
                            <p className="text-slate-800 font-semibold text-lg">{pricing.currentPriceAssessment}</p>
                        </div>
                        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest block mb-2">{lang === 'es' ? 'Precio Recomendado' : 'Recommended Price'}</span>
                            <p className="text-emerald-900 font-black text-2xl">{pricing.recommendedPrice}</p>
                        </div>
                    </div>

                    <p className="text-slate-700 font-medium mb-6">{pricing.justification}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{lang === 'es' ? 'Técnicas de Anclaje Psicológico' : 'Psychological Anchors'}</h4>
                            <ul className="space-y-2">
                                {pricing.psychologicalAnchors.map((anchor, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700 font-medium bg-violet-50 p-3 rounded-xl border border-violet-100">
                                        <Star size={16} className="text-violet-500 flex-shrink-0 mt-0.5" />
                                        {anchor}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{lang === 'es' ? 'Oportunidades de Bundle/Upsell' : 'Bundle Opportunities'}</h4>
                            <ul className="space-y-2">
                                {pricing.bundleOpportunities.map((bundle, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700 font-medium bg-amber-50 p-3 rounded-xl border border-amber-100">
                                        <Package size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                        {bundle}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Unit Economics */}
            {economics && (
                <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>

                    <h3 className="text-2xl font-black mb-6 relative z-10 flex items-center gap-3">
                        <BarChart3 size={24} className="text-indigo-400" />
                        {lang === 'es' ? 'Economía por Unidad' : 'Unit Economics'}
                    </h3>
                    <p className="text-sm text-slate-400 mb-6 relative z-10 -mt-4">{lang === 'es' ? 'Cuánto te cuesta vender, cuánto ganás por cliente, y cuándo empezás a ser rentable' : 'How much it costs to sell, how much you earn per customer, and when you break even'}</p>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
                        {[
                            { label: 'CAC', value: economics.estimatedCAC, color: 'text-rose-400', hint: lang === 'es' ? 'Costo de conseguir un cliente' : 'Cost to get one customer' },
                            { label: 'LTV', value: economics.estimatedLTV, color: 'text-emerald-400', hint: lang === 'es' ? 'Ganancia total por cliente' : 'Total earnings per customer' },
                            { label: 'Break Even', value: economics.breakEvenUnits, color: 'text-amber-400', hint: lang === 'es' ? 'Ventas mínimas para no perder' : 'Min sales to not lose money' },
                            { label: lang === 'es' ? 'Margen' : 'Margin', value: economics.suggestedMargin, color: 'text-blue-400', hint: lang === 'es' ? 'Lo que te queda después de costos' : 'What you keep after costs' },
                            { label: 'ROI', value: economics.roiProjection, color: 'text-indigo-400', hint: lang === 'es' ? 'Retorno por cada $ invertido' : 'Return per $ invested' },
                        ].map((metric, i) => (
                            <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">{metric.label}</p>
                                <p className={`text-xl font-black ${metric.color}`}>{metric.value}</p>
                                <p className="text-[10px] text-slate-500 mt-1">{metric.hint}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function PersonasTab({ personas, lang, onProfundizar }: { personas: DeepDivePersona[], lang: string, onProfundizar?: (title: string, content: string) => void }) {
    return (
        <div className="space-y-8">
            {personas.map((persona, i) => (
                <div key={`persona-${i}`}>
                    <PersonaDeepDiveCard persona={persona} lang={lang} />
                    {onProfundizar && (
                        <div className="mt-3 flex justify-end">
                            <button
                                onClick={() => onProfundizar(
                                    `Persona: ${persona.name}`,
                                    `${persona.name} (${persona.type}) — ${persona.oneLiner}. Canal principal: ${persona.goToMarket?.primaryChannel}. Pitch ideal: ${persona.goToMarket?.thePerfectPitch}. Tono: ${persona.goToMarket?.toneOfVoice}`
                                )}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-violet-600 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition"
                            >
                                <Sparkles size={12} />
                                {lang === 'es' ? `Profundizar sobre ${persona.name}` : `Deep dive on ${persona.name}`}
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function ObjectionsTab({ objections, lang }: { objections: ObjectionHandling[], lang: string }) {
    const severityColors: Record<string, string> = {
        'Alta': 'bg-rose-100 text-rose-700 border-rose-200',
        'Media': 'bg-amber-100 text-amber-700 border-amber-200',
        'Baja': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };

    return (
        <div className="space-y-4">
            {objections.map((obj, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 hover:border-violet-300 hover:shadow-lg transition-all">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="text-rose-600" size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <h3 className="text-xl font-bold text-slate-800">"{obj.objection}"</h3>
                                {obj.severity && (
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${severityColors[obj.severity] || 'bg-slate-100 text-slate-600'}`}>
                                        {obj.severity}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm font-semibold text-rose-500 uppercase tracking-widest mb-4">
                                {lang === 'es' ? 'Miedo subyacente' : 'Underlying Fear'}: {obj.underlyingFear}
                            </p>
                            <div className="bg-slate-50 border-l-4 border-violet-500 p-4 rounded-r-xl mb-3">
                                <p className="text-slate-700 italic font-medium leading-relaxed">
                                    "{obj.twoLineResponse}"
                                </p>
                            </div>
                            {obj.reframeTechnique && (
                                <div className="bg-violet-50 p-3 rounded-xl border border-violet-100">
                                    <span className="text-xs font-bold text-violet-500 uppercase tracking-wider block mb-1">{lang === 'es' ? 'Técnica de Reencuadre' : 'Reframe Technique'}</span>
                                    <p className="text-sm text-violet-900 font-medium">{obj.reframeTechnique}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function CompetitorsTab({ competitors, lang, onProfundizar }: { competitors: CompetitorAnalysis[], lang: string, onProfundizar?: (title: string, content: string) => void }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitors.map((comp, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl transition flex flex-col">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
                        <Target className="text-slate-600" size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{comp.name}</h3>
                    <a href={comp.website?.startsWith('http') ? comp.website : `https://${comp.website}`} target="_blank" rel="noopener noreferrer" className="text-violet-600 text-sm font-medium hover:underline mb-4 truncate block">
                        {comp.website}
                    </a>
                    <div className="flex-1 space-y-4">
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">{lang === 'es' ? 'Solapamiento' : 'Overlap'}</span>
                            <p className="text-sm text-slate-700">{comp.overlap}</p>
                        </div>
                        <div className="p-3 bg-violet-50 rounded-xl border border-violet-100">
                            <span className="text-xs font-bold text-violet-500 uppercase tracking-wider mb-1 block">{lang === 'es' ? 'Cómo Ganarles' : 'How to Beat Them'}</span>
                            <p className="text-sm font-semibold text-violet-900">{comp.differentiation}</p>
                        </div>
                    </div>
                    {onProfundizar && (
                        <button
                            onClick={() => onProfundizar(
                                `Competidor: ${comp.name}`,
                                `${comp.name} (${comp.website}). Solapamiento: ${comp.overlap}. Diferenciación: ${comp.differentiation}`
                            )}
                            className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-violet-600 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition w-full"
                        >
                            <Sparkles size={12} />
                            {lang === 'es' ? `Profundizar sobre ${comp.name}` : `Deep dive on ${comp.name}`}
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold transition">
            {copied ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
        </button>
    );
}

function SalesKitTab({ kit, lang }: { kit: SalesSurvivalKit, lang: string }) {
    return (
        <div className="space-y-6">
            {/* Elevator Pitch */}
            {kit.elevatorPitch && (
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 text-white shadow-lg overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full filter blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-black text-lg flex items-center gap-2"><Zap size={20} /> {lang === 'es' ? 'Elevator Pitch (30 seg)' : 'Elevator Pitch (30s)'}</h3>
                            <CopyButton text={kit.elevatorPitch} />
                        </div>
                        <p className="text-lg font-medium leading-relaxed text-violet-100">{kit.elevatorPitch}</p>
                    </div>
                </div>
            )}

            {/* Cold Email */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <MessagesSquare className="text-blue-500" />
                        <h3 className="font-bold text-slate-800">Cold Email Template</h3>
                    </div>
                    <CopyButton text={kit.coldEmailTemplate} />
                </div>
                <div className="p-6 sm:p-8">
                    <div className="bg-slate-800 text-slate-200 p-6 rounded-2xl font-mono text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                        {kit.coldEmailTemplate}
                    </div>
                </div>
            </div>

            {/* Cold DM */}
            {kit.coldDmTemplate && (
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <MessageSquare className="text-emerald-500" />
                            <h3 className="font-bold text-slate-800">{lang === 'es' ? 'DM Template (Instagram/WhatsApp)' : 'DM Template'}</h3>
                        </div>
                        <CopyButton text={kit.coldDmTemplate} />
                    </div>
                    <div className="p-6 sm:p-8">
                        <div className="bg-emerald-900 text-emerald-100 p-6 rounded-2xl font-mono text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                            {kit.coldDmTemplate}
                        </div>
                    </div>
                </div>
            )}

            {/* Landing Page Structure */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
                    <LayoutTemplate className="text-emerald-500" />
                    <h3 className="font-bold text-slate-800">{lang === 'es' ? 'Estructura de Landing Page' : 'Landing Page Structure'}</h3>
                </div>
                <div className="p-6 sm:p-8 space-y-4">
                    {kit.landingPageStructure.map((block, i) => (
                        <div key={i} className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                {i + 1}
                            </div>
                            <p className="text-slate-700 text-lg pt-1">{block}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Ad Angles */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
                    <Megaphone className="text-amber-500" />
                    <h3 className="font-bold text-slate-800">{lang === 'es' ? 'Ángulos de Anuncios (Ads)' : 'Ad Angles'}</h3>
                </div>
                <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {kit.adAngles.map((angle, i) => (
                        <div key={i} className="bg-amber-50 border border-amber-200 p-5 rounded-2xl">
                            <span className="text-amber-500 font-black text-4xl opacity-20 block mb-2">0{i + 1}</span>
                            <p className="text-amber-900 font-semibold">{angle}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ContentCalendarTab({ calendar, lang }: { calendar?: ContentCalendarDay[], lang: string }) {
    if (!calendar || calendar.length === 0) return <p className="text-slate-500 italic p-8">{lang === 'es' ? 'Calendario no disponible.' : 'Calendar not available.'}</p>;

    const dayColors: Record<string, string> = {
        'Lunes': 'from-blue-500 to-blue-600', 'Monday': 'from-blue-500 to-blue-600',
        'Martes': 'from-violet-500 to-violet-600', 'Tuesday': 'from-violet-500 to-violet-600',
        'Miércoles': 'from-fuchsia-500 to-fuchsia-600', 'Wednesday': 'from-fuchsia-500 to-fuchsia-600',
        'Jueves': 'from-amber-500 to-amber-600', 'Thursday': 'from-amber-500 to-amber-600',
        'Viernes': 'from-emerald-500 to-emerald-600', 'Friday': 'from-emerald-500 to-emerald-600',
        'Sábado': 'from-rose-500 to-rose-600', 'Saturday': 'from-rose-500 to-rose-600',
        'Domingo': 'from-indigo-500 to-indigo-600', 'Sunday': 'from-indigo-500 to-indigo-600',
    };

    return (
        <div className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-8 border border-emerald-100 shadow-sm mb-6">
                <h2 className="text-2xl font-black text-emerald-900 mb-2 flex items-center gap-2">
                    <Calendar className="text-emerald-600" /> {lang === 'es' ? 'Calendario de Contenido — 7 Días' : 'Content Calendar — 7 Days'}
                </h2>
                <p className="text-emerald-700 font-medium">{lang === 'es' ? 'Contenido listo para publicar, diseñado para vender este producto.' : 'Ready-to-post content designed to sell this product.'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {calendar.map((day, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition flex flex-col">
                        <div className={`bg-gradient-to-r ${dayColors[day.day] || 'from-slate-500 to-slate-600'} px-5 py-3 text-white`}>
                            <span className="font-black text-lg">{day.day}</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">{day.platform}</span>
                                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">{day.format}</span>
                            </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <h4 className="font-bold text-slate-900 mb-2">{day.topic}</h4>
                            <p className="text-sm text-slate-600 flex-1 leading-relaxed mb-3">{day.copyExample}</p>
                            <div className="bg-violet-50 px-3 py-2 rounded-lg border border-violet-100">
                                <span className="text-xs font-bold text-violet-500 block mb-0.5">CTA</span>
                                <span className="text-sm font-semibold text-violet-900">{day.cta}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ExecutionTab({ plan, lang }: { plan: DeepDiveExecutionStep[], lang: string }) {
    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-8 border border-emerald-100 shadow-sm">
                <h2 className="text-2xl font-black text-emerald-900 mb-2 flex items-center gap-2">
                    <Rocket className="text-emerald-600" /> {lang === 'es' ? 'Plan de Ejecución' : 'Execution Plan'}
                </h2>
                <p className="text-emerald-700 font-medium">
                    {lang === 'es' ? 'El paso a paso exacto para los próximos 90 días enfocado 100% en ventas y tracción.' : 'Exact step-by-step for the next 90 days, 100% focused on sales.'}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {plan.map((step, idx) => (
                    <div key={idx} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-lg transition flex flex-col">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xl">
                                {idx + 1}
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                                    {lang === 'es'
                                        ? `Fase ${step.phase === 'ShortTerm' ? '1: Corto Plazo' : '2: Mediano Plazo'}`
                                        : `Phase ${step.phase === 'ShortTerm' ? '1: Short Term' : '2: Medium Term'}`}
                                </span>
                                <h3 className="text-xl font-bold text-slate-900">{step.timing}</h3>
                            </div>
                        </div>

                        <div className="mb-6">
                            <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest block mb-2"><Target size={14} className="inline mr-1" /> {lang === 'es' ? 'Objetivo' : 'Focus'}</span>
                            <p className="text-slate-800 font-semibold text-lg leading-snug">{step.focus}</p>
                        </div>

                        <div className="space-y-6 flex-1">
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3"><ListTodo size={14} className="inline mr-1" /> {lang === 'es' ? 'Acciones Clave' : 'Key Actions'}</span>
                                <ul className="space-y-3">
                                    {step.actions.map((action, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-700 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                                            <span>{action}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-slate-800 text-white p-5 rounded-2xl mt-auto">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2"><BarChart3 size={14} className="inline mr-1" /> KPIs</span>
                                <ul className="space-y-2">
                                    {step.metrics.map((metric, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm font-semibold">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                                            {metric}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// PERSONA CARD (Reusable deep dive persona card)
// ═══════════════════════════════════════════════════════════════════════

const PersonaDeepDiveCard: React.FC<{ persona: DeepDivePersona, lang: string }> = ({ persona, lang }) => {
    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row">
            {/* Header Column */}
            <div className="bg-slate-50 lg:w-1/3 p-8 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-center">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider w-max mb-4 ${persona.type === 'Ideal' ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-700'
                    }`}>
                    Perfil {persona.type}
                </span>
                <h2 className="text-3xl font-black text-slate-900 mb-3 leading-tight">{persona.name}</h2>
                <p className="text-lg text-slate-600 font-medium italic mb-6">"{persona.oneLiner}"</p>

                <div className="space-y-4 border-t border-slate-200 pt-6">
                    <div className="flex items-center gap-3">
                        <Briefcase size={18} className="text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700">{persona.demographic.role} • {persona.demographic.industry}</span>
                    </div>
                </div>
            </div>

            {/* Deep Data Content */}
            <div className="flex-1 p-8 bg-white grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Day in the life */}
                <div className="space-y-6">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={16} /> Day in the Life
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <span className="text-xs font-bold text-slate-500 block mb-1">{lang === 'es' ? 'Hábitos de Trabajo' : 'Work Habits'}</span>
                            <p className="text-sm text-slate-800">{persona.dayInTheLife.workdayHabits}</p>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-500 block mb-1">{lang === 'es' ? 'Ritual Matutino' : 'Morning Routine'}</span>
                            <p className="text-sm text-slate-800">{persona.dayInTheLife.morningRoutine}</p>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-500 block mb-1">{lang === 'es' ? 'Entornos Físicos' : 'Physical Places'}</span>
                            <p className="text-sm text-slate-800 flex items-center gap-1.5 flex-wrap">
                                <MapPin size={14} className="text-rose-400" />
                                {persona.dayInTheLife.frequentPhysicalPlaces.join(', ')}
                            </p>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-500 block mb-1">{lang === 'es' ? 'Entornos Digitales' : 'Digital Places'}</span>
                            <p className="text-sm text-slate-800 flex items-center gap-1.5 flex-wrap">
                                <MonitorSmartphone size={14} className="text-blue-400" />
                                {persona.dayInTheLife.frequentDigitalPlaces.join(', ')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Aspirations & Tactical */}
                <div className="space-y-6">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Target size={16} /> {lang === 'es' ? 'Aspiraciones y Táctica' : 'Aspirations & Tactics'}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <span className="text-xs font-bold text-slate-500 block mb-1">{lang === 'es' ? 'Marcas e Influencers' : 'Brands & Influencers'}</span>
                            <p className="text-sm text-slate-800">
                                {persona.aspirations.clothingBrands.join(', ')} • {persona.aspirations.influencersFollowed.join(', ')}
                            </p>
                        </div>
                        <div className="bg-violet-50 p-4 rounded-xl border border-violet-100 mt-4">
                            <span className="text-xs font-bold text-violet-500 block mb-2 uppercase tracking-wide">{lang === 'es' ? 'Pitch Perfecto' : 'Perfect Pitch'}</span>
                            <p className="text-sm font-bold text-violet-900 leading-relaxed">{persona.goToMarket.thePerfectPitch}</p>
                            <div className="mt-3 pt-3 border-t border-violet-200 flex gap-4">
                                <div>
                                    <span className="text-xs font-medium text-violet-600 block mb-1">{lang === 'es' ? 'Canal Principal' : 'Primary Channel'}</span>
                                    <span className="text-sm font-bold text-violet-800 bg-white px-2 py-0.5 rounded shadow-sm">{persona.goToMarket.primaryChannel}</span>
                                </div>
                                <div>
                                    <span className="text-xs font-medium text-violet-600 block mb-1">{lang === 'es' ? 'Tono' : 'Tone'}</span>
                                    <span className="text-sm font-bold text-violet-800 bg-white px-2 py-0.5 rounded shadow-sm">{persona.goToMarket.toneOfVoice}</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-500 block mb-1">{lang === 'es' ? 'Tácticas Específicas' : 'Specific Tactics'}</span>
                            <ul className="list-disc pl-4 text-sm text-slate-800 space-y-1">
                                {persona.goToMarket.specificTactics.map((t, i) => <li key={i}>{t}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Quick Wins Tab ───────────────────────────────────────────────────
function QuickWinsTab({ wins, lang }: { wins?: QuickWin[], lang: string }) {
    if (!wins || wins.length === 0) return <div className="text-slate-400 text-center py-8">{lang === 'es' ? 'No hay quick wins disponibles.' : 'No quick wins available.'}</div>;
    return (
        <div className="space-y-4">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white mb-6">
                <h3 className="text-2xl font-black mb-2 flex items-center gap-2"><Flame size={24} /> {lang === 'es' ? 'Hacé esto HOY' : 'Do this TODAY'}</h3>
                <p className="text-amber-100 text-sm">{lang === 'es' ? 'Acciones concretas que podés ejecutar ahora mismo, cada una en menos de 1 hora.' : 'Concrete actions you can execute right now, each in under 1 hour.'}</p>
            </div>
            {wins.map((win, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-lg flex-shrink-0">{i + 1}</div>
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-900 text-lg mb-2">{win.action}</h4>
                            <div className="flex flex-wrap gap-3 mb-3">
                                <span className="inline-flex items-center gap-1 text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg"><Clock size={12} /> {win.timeToExecute}</span>
                                <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg"><TrendingUp size={12} /> {win.expectedImpact}</span>
                            </div>
                            {win.tools.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {win.tools.map((tool, j) => (
                                        <span key={j} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">{tool}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Social Listening Tab ─────────────────────────────────────────────
function SocialListeningTab({ data, lang }: { data?: SocialListening[], lang: string }) {
    if (!data || data.length === 0) return <div className="text-slate-400 text-center py-8">{lang === 'es' ? 'No hay datos de social listening.' : 'No social listening data.'}</div>;
    const sentimentColor = (s: string) => {
        const sl = s.toLowerCase();
        if (sl.includes('positiv')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (sl.includes('negativ')) return 'bg-red-50 text-red-700 border-red-200';
        return 'bg-amber-50 text-amber-700 border-amber-200';
    };
    return (
        <div className="space-y-4">
            <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2"><Globe size={22} /> {lang === 'es' ? '¿Qué dicen las redes sobre tu producto?' : 'What are people saying about your product?'}</h3>
            {data.map((item, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-black bg-violet-100 text-violet-700 px-3 py-1 rounded-lg uppercase">{item.platform}</span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${sentimentColor(item.sentiment)}`}>{item.sentiment}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 mb-2">{item.topic}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.insight}</p>
                    {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-600 hover:underline mt-2 block">Ver conversación →</a>}
                </div>
            ))}
        </div>
    );
}

// ── Seasonality Tab ──────────────────────────────────────────────────
function SeasonalityTab({ data, lang }: { data?: SeasonalityInsight[], lang: string }) {
    if (!data || data.length === 0) return <div className="text-slate-400 text-center py-8">{lang === 'es' ? 'No hay datos de estacionalidad.' : 'No seasonality data.'}</div>;
    const intensityStyle = (i: string) => {
        if (i === 'Alta') return 'bg-emerald-500 text-white';
        if (i === 'Media') return 'bg-amber-500 text-white';
        return 'bg-slate-300 text-slate-700';
    };
    return (
        <div className="space-y-4">
            <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2"><Sun size={22} /> {lang === 'es' ? '¿Cuándo se vende más tu producto?' : 'When does your product sell best?'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.map((season, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-black text-slate-900 text-lg">{season.period}</h4>
                            <span className={`text-xs font-bold px-3 py-1 rounded-lg ${intensityStyle(season.intensity)}`}>{season.intensity}</span>
                        </div>
                        <div className="mb-4">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">{lang === 'es' ? 'Fechas Clave' : 'Key Dates'}</span>
                            <div className="flex flex-wrap gap-2">
                                {season.keyDates.map((d, j) => (
                                    <span key={j} className="text-xs bg-violet-50 text-violet-700 px-2.5 py-1 rounded-lg font-medium border border-violet-100">{d}</span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">{lang === 'es' ? 'Estrategia' : 'Strategy'}</span>
                            <p className="text-sm text-slate-700 leading-relaxed">{season.strategy}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

