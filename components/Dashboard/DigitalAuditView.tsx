import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import {
    Loader2, ArrowLeft, Globe, Shield, Search, Sparkles,
    BarChart3, TrendingUp, AlertTriangle, CheckCircle2,
    Download, Zap, Star, Clock, Target, Mail,
    ChevronDown, ChevronUp, ExternalLink, Bot,
    MessageCircle, Filter, Palette, Users, LayoutDashboard, Megaphone, UsersRound, ShoppingCart, Heart
} from 'lucide-react';
import { analyzeDigitalAudit } from '../../services/digitalAuditService';
import GlossaryModal from '../GlossaryModal';
import FeedbackModal from '../FeedbackModal';
import type {
    DigitalAuditResult, DigitalAuditInput, StrategicAnalysis,
    SocialMediaChannelAudit, CompetitorDigitalBenchmark,
    PrioritizedOpportunity, DigitalRisk, RoadmapMilestone,
    CriticalFinding
} from '../../types';

// ── Universal safe text renderer ────────────────────────────────────
const safeText = (v: any): string => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (Array.isArray(v)) return v.map(safeText).filter(Boolean).join(', ');
    if (typeof v === 'object') return Object.values(v).map(safeText).filter(Boolean).join('\n');
    return String(v);
};

// ── Traffic Light Component ──────────────────────────────────────────
const TrafficLight = ({ score }: { score: string }) => {
    // Defensive check: handle undefined or non-string scores
    const safeScore = typeof score === 'string' ? score : '';
    const colorMap: Record<string, { bg: string; text: string; label: string }> = {
        good: { bg: 'bg-green-100', text: 'text-green-700', label: '🟢' },
        ready: { bg: 'bg-green-100', text: 'text-green-700', label: '🟢' },
        strong: { bg: 'bg-green-100', text: 'text-green-700', label: '🟢' },
        positive: { bg: 'bg-green-100', text: 'text-green-700', label: '🟢' },
        active: { bg: 'bg-green-100', text: 'text-green-700', label: '🟢' },
        needs_work: { bg: 'bg-amber-100', text: 'text-amber-700', label: '🟡' },
        partial: { bg: 'bg-amber-100', text: 'text-amber-700', label: '🟡' },
        moderate: { bg: 'bg-amber-100', text: 'text-amber-700', label: '🟡' },
        mixed: { bg: 'bg-amber-100', text: 'text-amber-700', label: '🟡' },
        basic: { bg: 'bg-amber-100', text: 'text-amber-700', label: '🟡' },
        critical: { bg: 'bg-red-100', text: 'text-red-700', label: '🔴' },
        invisible: { bg: 'bg-red-100', text: 'text-red-700', label: '🔴' },
        weak: { bg: 'bg-red-100', text: 'text-red-700', label: '🔴' },
        negative: { bg: 'bg-red-100', text: 'text-red-700', label: '🔴' },
        absent: { bg: 'bg-slate-100', text: 'text-slate-500', label: '⚪' },
    };
    const s = colorMap[safeScore] || { bg: 'bg-slate-100', text: 'text-slate-600', label: '⚪' };
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${s.bg} ${s.text}`}>
            {s.label} {safeScore ? safeScore.replace(/_/g, ' ') : 'N/A'}
        </span>
    );
};

// ── Radar Chart (CSS-based) ──────────────────────────────────────────
const RadarChart = ({ breakdown }: { breakdown: any }) => {
    if (!breakdown || typeof breakdown !== 'object') return null;
    const b = breakdown;
    const categories = [
        { key: 'web', label: 'Web', value: b.web ?? 0 },
        { key: 'seo', label: 'SEO', value: b.seo ?? 0 },
        { key: 'social', label: 'Redes Sociales', value: b.redesSociales ?? b.socialMedia ?? b.social ?? 0 },
        { key: 'reputation', label: 'Reputación', value: b.reputacion ?? b.reputation ?? 0 },
        { key: 'email', label: 'Email / CRM', value: b.emailCrm ?? b.email ?? 0 },
        { key: 'ai', label: 'IA (AEO)', value: b.iaReadiness ?? b.aiReadiness ?? 0 },
    ];
    const getColor = (val: number) => val >= 70 ? 'bg-emerald-500' : val >= 40 ? 'bg-amber-500' : 'bg-red-500';
    const getTextColor = (val: number) => val >= 70 ? 'text-emerald-600' : val >= 40 ? 'text-amber-600' : 'text-red-600';

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-black text-lg text-slate-900 mb-5 flex items-center gap-2">
                <BarChart3 size={20} className="text-emerald-500" />
                Desglose del Puntaje
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {categories.map(cat => (
                    <div key={cat.key} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-slate-600">{cat.label}</span>
                            <span className={`text-xl font-black ${getTextColor(cat.value)}`}>{cat.value}</span>
                        </div>
                        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-1000 ${getColor(cat.value)}`} style={{ width: `${Math.min(cat.value, 100)}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Grade Badge ──────────────────────────────────────────────────────
const GradeBadge = ({ grade }: { grade: string }) => {
    const colors: Record<string, string> = {
        A: 'from-emerald-500 to-green-500',
        B: 'from-blue-500 to-cyan-500',
        C: 'from-amber-500 to-yellow-500',
        D: 'from-orange-500 to-red-400',
        F: 'from-red-500 to-rose-600',
    };
    return (
        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${colors[grade] || colors.C} flex items-center justify-center shadow-lg`}>
            <span className="text-4xl font-black text-white">{grade}</span>
        </div>
    );
};

// ── Collapsible Section ──────────────────────────────────────────────
const CollapsibleSection = ({ title, icon, children, defaultOpen = false, badge }: {
    title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; badge?: React.ReactNode;
}) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-6 py-5 hover:bg-slate-50 transition text-left">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">{icon}</div>
                <h3 className="text-lg font-bold text-slate-900 flex-1">{title}</h3>
                {badge}
                {open ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
            </button>
            {open && <div className="px-6 pb-6 border-t border-slate-100 pt-4">{children}</div>}
        </div>
    );
};

// Safe defaults for DigitalAuditResult — Gemini's free-form JSON may miss any field
// Helper: safely parse a JSON string field, returning the parsed object or the original value if already an object
const safeParse = (val: any): any => {
    if (!val) return null;
    if (typeof val === 'object') return val; // already parsed (e.g. from saved DB data)
    if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return null; }
    }
    return null;
};

const safeResult = (raw: any): DigitalAuditResult => {
    const r = raw || {};
    const wt = r.webTechnical || {};
    const seo = r.seoAnalysis || {};
    const ai = r.aiReadiness || {};
    const rep = r.reputationAnalysis || {};
    const email = r.emailCrmAssessment || {};
    const crawl = ai.aiCrawlerAccess || {};

    // Parse extended sections (these come as JSON strings from Gemini schema)
    r.socialProof = safeParse(r.socialProof);
    r.funnelAnalysis = safeParse(r.funnelAnalysis);
    r.contentIdentityAudit = safeParse(r.contentIdentityAudit);
    r.competitorComparison = safeParse(r.competitorComparison);
    r.channelStrategies = safeParse(r.channelStrategies);
    r.adStrategy = safeParse(r.adStrategy);
    r.influencerStrategy = safeParse(r.influencerStrategy);
    r.marketplaceAnalysis = safeParse(r.marketplaceAnalysis);

    return {
        ...r,
        snapshot: r.snapshot || { platform: 'N/A', ssl: false, tools: [], socialPresence: [] },
        findings: Array.isArray(r.findings) ? r.findings : [],
        webTechnical: {
            overallScore: wt.overallScore ?? 0,
            ssl: wt.ssl ?? false,
            sitemap: wt.sitemap ?? false,
            robotsTxt: wt.robotsTxt ?? false,
            pageSpeedScore: wt.pageSpeedScore ?? 'N/A',
            mobileReadiness: wt.mobileReadiness ?? 'N/A',
            detectedTools: Array.isArray(wt.detectedTools) ? wt.detectedTools : [],
            brokenLinks: Array.isArray(wt.brokenLinks) ? wt.brokenLinks : [],
            pageErrors: Array.isArray(wt.pageErrors) ? wt.pageErrors : [],
            conversionReadyAudit: wt.conversionReadyAudit || { score: 0, details: '' },
            schemaMarkup: wt.schemaMarkup || { exists: false, recommendation: '' },
        },
        seoAnalysis: {
            overallScore: seo.overallScore ?? 0,
            titleTag: seo.titleTag ?? '',
            metaDescription: seo.metaDescription ?? '',
            headingStructure: seo.headingStructure ?? '',
            indexedPages: seo.indexedPages ?? 'N/A',
            organicKeywords: Array.isArray(seo.organicKeywords) ? seo.organicKeywords : [],
            recommendations: Array.isArray(seo.recommendations) ? seo.recommendations : [],
            productNamingIssues: Array.isArray(seo.productNamingIssues) ? seo.productNamingIssues : [],
        },
        aiReadiness: {
            overallScore: ai.overallScore ?? 0,
            llmMentionability: ai.llmMentionability ?? '',
            structuredDataForAI: ai.structuredDataForAI ?? '',
            conversationalSearchFit: ai.conversationalSearchFit ?? '',
            aiCrawlerAccess: {
                blocked: Array.isArray(crawl.blocked) ? crawl.blocked : [],
                allowed: Array.isArray(crawl.allowed) ? crawl.allowed : [],
                recommendation: crawl.recommendation ?? '',
            },
        },
        socialMediaAudit: Array.isArray(r.socialMediaAudit) ? r.socialMediaAudit : [],
        reputationAnalysis: {
            overallScore: rep.overallScore ?? 0,
            googleRating: rep.googleRating ?? 'N/A',
            googleReviewCount: rep.googleReviewCount ?? 0,
            sentimentSummary: rep.sentimentSummary ?? '',
            responseRate: rep.responseRate ?? '',
            recommendations: Array.isArray(rep.recommendations) ? rep.recommendations : [],
        },
        competitorBenchmark: Array.isArray(r.competitorBenchmark) ? r.competitorBenchmark : [],
        emailCrmAssessment: {
            leadNurturingScore: email.leadNurturingScore ?? 0,
            hasEmailCapture: email.hasEmailCapture ?? false,
            emailPlatformDetected: email.emailPlatformDetected ?? '',
            crmMaturity: email.crmMaturity ?? '',
            recommendations: Array.isArray(email.recommendations) ? email.recommendations : [],
        },
        industryLeaders: Array.isArray(r.industryLeaders) ? r.industryLeaders : [],
        opportunities: Array.isArray(r.opportunities) ? r.opportunities : [],
        risks: Array.isArray(r.risks) ? r.risks : [],
        digitalHealthGrade: r.digitalHealthGrade || 'C',
        executiveSummary: r.executiveSummary || '',
        moneyOnTheTable: r.moneyOnTheTable || '',
        roadmap: r.roadmap || [],
        visualIdentityAudit: r.visualIdentityAudit || { overallScore: '', brandConsistency: '', photoQuality: '', feedAesthetic: '', recommendations: [] },
        customerPerception: r.customerPerception || { currentImage: '', idealImage: '', gaps: [], quickWins: [] },
    } as DigitalAuditResult;
};

export default function DigitalAuditView() {
    const { reportId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [lang] = useState('es');
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [generatingStep, setGeneratingStep] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<DigitalAuditResult | null>(null);
    const [auditInput, setAuditInput] = useState<DigitalAuditInput | null>(null);
    const [auditName, setAuditName] = useState('');
    const generationLock = useRef(false);

    useEffect(() => {
        if (!user || !reportId) return;

        const fetchOrGenerate = async () => {
            try {
                const { data, error: fetchError } = await supabase
                    .from('digital_audits')
                    .select('*, business_reports!digital_audits_business_report_id_fkey!inner(business_name, analysis_result, onboarding_data)')
                    .eq('id', reportId)
                    .single();

                if (fetchError) throw fetchError;
                if (!data) throw new Error('No se encontró la auditoría');

                setAuditName((data as any).business_reports?.business_name || 'Auditoría Digital');

                if (data.status === 'completed' && data.audit_result) {
                    setAuditInput(data.audit_input as DigitalAuditInput);
                    setResult(safeResult(data.audit_result));
                    setLoading(false);
                    return;
                }

                // If already analyzing, show generating UI and poll for completion
                if (data.status === 'analyzing') {
                    setLoading(false);
                    setGenerating(true);
                    setGeneratingStep('Otra pestaña está generando el informe...');
                    // Poll every 5s until completed
                    const poll = setInterval(async () => {
                        const { data: updated } = await supabase
                            .from('digital_audits')
                            .select('status, audit_result, audit_input')
                            .eq('id', reportId)
                            .single();
                        if (updated?.status === 'completed' && updated.audit_result) {
                            clearInterval(poll);
                            setAuditInput(updated.audit_input as DigitalAuditInput);
                            setResult(safeResult(updated.audit_result));
                            setGenerating(false);
                        } else if (updated?.status === 'failed') {
                            clearInterval(poll);
                            setError('La auditoría falló. Intentá de nuevo desde el Dashboard.');
                            setGenerating(false);
                        }
                    }, 5000);
                    return;
                }

                if (data.status === 'pending' || data.status === 'draft') {
                    // Mutex: prevent concurrent generation in same tab (React StrictMode)
                    if (generationLock.current) return;
                    generationLock.current = true;

                    // Atomic claim: only proceed if we're the one who flips the status
                    const { data: claimData, error: claimError } = await supabase
                        .from('digital_audits')
                        .update({ status: 'analyzing' })
                        .eq('id', reportId)
                        .in('status', ['pending', 'draft'])
                        .select('id');

                    if (claimError || !claimData || claimData.length === 0) {
                        // Another process already claimed it — switch to polling
                        generationLock.current = false;
                        setLoading(false);
                        setGenerating(true);
                        setGeneratingStep('El informe se está generando...');
                        return;
                    }

                    setLoading(false);
                    setGenerating(true);

                    setGeneratingStep('Cargando contexto del negocio...');

                    const parentReport = (data as any).business_reports;
                    const parentAnalysis = parentReport?.analysis_result as StrategicAnalysis;
                    const auditInput = data.audit_input as DigitalAuditInput;

                    if (!parentAnalysis) throw new Error('No se encontró el análisis del negocio padre.');

                    let parentOnboarding: Record<string, any> | null = null;
                    if (parentReport?.onboarding_data) {
                        const { productImages, documents, ...light } = parentReport.onboarding_data as any;
                        parentOnboarding = light;
                    }

                    setGeneratingStep('Capturando screenshot de tu web y analizando visualmente...');

                    const { result: aiResult, costUsd } = await analyzeDigitalAudit(auditInput, parentAnalysis, parentOnboarding, lang as any);

                    setGeneratingStep('Guardando resultados...');

                    await supabase.from('digital_audits').update({
                        status: 'completed',
                        audit_result: aiResult,
                        api_cost_usd: costUsd
                    }).eq('id', reportId);

                    setAuditInput(auditInput);
                    setResult(safeResult(aiResult));
                    setGenerating(false);
                    generationLock.current = false;
                    return;
                }

                throw new Error(lang === 'es' ? 'La auditoría falló. Intentá de nuevo desde el Dashboard.' : 'Audit failed. Try again from the Dashboard.');

            } catch (err: any) {
                console.error(err);
                if (generationLock.current) {
                    try { await supabase.from('digital_audits').update({ status: 'failed' }).eq('id', reportId); } catch (_) { }
                }
                generationLock.current = false;
                setError(err.message || 'Error al cargar la auditoría');
                setLoading(false);
                setGenerating(false);
            }
        };

        fetchOrGenerate();
    }, [user, reportId]);

    // Generating messages
    const [insightIndex, setInsightIndex] = useState(0);
    const insights = lang === 'es' ? [
        '🔍 Escaneando tu sitio web...',
        '📱 Analizando tus redes sociales...',
        '⭐ Evaluando tu reputación online...',
        '🔧 Auditando aspectos técnicos...',
        '🤖 Verificando AI-Readiness (AEO)...',
        '🏆 Comparando con competidores...',
        '📧 Evaluando email marketing...',
        '🚀 Calculando oportunidades y ROI...',
        '📅 Generando tu roadmap 30/60/90...',
        '✨ Finalizando tu diagnóstico digital...'
    ] : [
        '🔍 Scanning your website...',
        '📱 Analyzing social media...',
        '⭐ Evaluating online reputation...',
        '🔧 Auditing technical aspects...',
        '🤖 Checking AI-Readiness (AEO)...',
        '🏆 Comparing with competitors...',
        '📧 Evaluating email marketing...',
        '🚀 Calculating opportunities & ROI...',
        '📅 Generating your 30/60/90 roadmap...',
        '✨ Finalizing your digital diagnosis...'
    ];

    useEffect(() => {
        if (!generating) return;
        const interval = setInterval(() => {
            setInsightIndex(prev => prev >= insights.length - 1 ? prev : prev + 1);
        }, 5000);
        return () => clearInterval(interval);
    }, [generating]);

    // ── GENERATING STATE ─────────────────────────────────────────────
    if (generating) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className="absolute rounded-full opacity-20" style={{
                        width: `${Math.random() * 6 + 2}px`, height: `${Math.random() * 6 + 2}px`,
                        background: i % 2 === 0 ? '#34d399' : '#6ee7b7',
                        left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                        animation: `float ${Math.random() * 6 + 4}s ease-in-out infinite`,
                        animationDelay: `${Math.random() * 5}s`
                    }} />
                ))}
                <div className="absolute w-96 h-96 bg-emerald-600/20 rounded-full filter blur-[100px] animate-pulse"></div>
                <div className="relative z-10 max-w-lg text-center">
                    <div className="w-32 h-32 relative mb-10 mx-auto">
                        <div className="absolute inset-0 border-[3px] border-emerald-400/30 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
                        <div className="absolute inset-0 border-[3px] border-emerald-500/50 rounded-full"></div>
                        <div className="absolute inset-0 border-[3px] border-transparent border-t-teal-400 border-r-emerald-400 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
                        <div className="absolute inset-3 border-[3px] border-transparent border-b-cyan-400 border-l-emerald-300 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }}></div>
                        <Search className="absolute inset-0 m-auto text-white drop-shadow-lg" size={36} />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2">Auditando tu presencia digital</h2>
                    <p className="text-lg text-emerald-300 font-semibold mb-8">{auditName}</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/10">
                        <p className="text-sm text-emerald-300 font-bold uppercase tracking-wider mb-2">{generatingStep}</p>
                        <p className="text-xl text-white font-bold transition-all duration-500" key={insightIndex}>{insights[insightIndex]}</p>
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-8">
                        {insights.map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= insightIndex ? 'bg-emerald-400 w-4' : 'bg-white/20 w-1.5'}`} />
                        ))}
                    </div>
                    <p className="text-sm text-emerald-400/60">La IA está trabajando. Esto toma entre 60 y 120 segundos.</p>
                </div>
                <style>{`@keyframes float { 0%, 100% { transform: translateY(0px) translateX(0px); } 25% { transform: translateY(-20px) translateX(10px); } 50% { transform: translateY(-10px) translateX(-15px); } 75% { transform: translateY(-25px) translateX(5px); } }`}</style>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
                <Loader2 className="animate-spin text-emerald-600 mb-4" size={48} />
                <h2 className="text-xl font-bold text-slate-800">Cargando auditoría...</h2>
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 font-sans">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center">
                    <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
                    <p className="text-red-600 mb-6">{error || 'No se pudo cargar la auditoría'}</p>
                    <button onClick={() => navigate('/dashboard')} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-900 transition">
                        Volver al Panel
                    </button>
                </div>
            </div>
        );
    }

    // ── SVG Gauge Component ────────────────────────────────────────────
    const ScoreGauge = ({ score, size = 160, label }: { score: number; size?: number; label?: string }) => {
        const radius = (size - 20) / 2;
        const circumference = 2 * Math.PI * radius;
        const pct = Math.min(Math.max(score, 0), 100);
        const offset = circumference - (pct / 100) * circumference;
        const color = pct >= 70 ? '#34d399' : pct >= 40 ? '#fbbf24' : '#f87171';
        return (
            <div className="flex flex-col items-center">
                <svg width={size} height={size} className="transform -rotate-90">
                    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
                    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
                        strokeDasharray={circumference} strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 1.5s ease-out' }} />
                </svg>
                <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
                    <span className="text-5xl font-black text-white">{pct}</span>
                    <span className="text-sm text-slate-400 font-bold">/100</span>
                </div>
                {label && <span className="text-xs text-slate-400 mt-2 font-semibold uppercase tracking-wider">{label}</span>}
            </div>
        );
    };

    // ── KPI Card Component ──────────────────────────────────────────────
    const KpiCard = ({ label, score, icon, explanation }: { label: string; score: any; icon: React.ReactNode; explanation: string }) => {
        const numScore = typeof score === 'number' ? score : (typeof score === 'string' ? ({'good': 80, 'ready': 80, 'strong': 85, 'active': 75, 'needs_work': 50, 'partial': 45, 'moderate': 55, 'mixed': 50, 'basic': 40, 'critical': 20, 'invisible': 10, 'weak': 25, 'absent': 0}[score] ?? 50) : 50);
        const color = numScore >= 70 ? 'emerald' : numScore >= 40 ? 'amber' : 'red';
        const statusLabel = numScore >= 70 ? 'Bien' : numScore >= 40 ? 'A mejorar' : 'Crítico';
        return (
            <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-4 hover:border-white/20 transition group relative">
                <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>{icon}</div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                </div>
                <div className="flex items-end gap-2 mb-2">
                    <span className={`text-3xl font-black text-${color}-400`}>{typeof score === 'number' ? score : numScore}</span>
                    <span className={`text-xs font-bold text-${color}-400 mb-1 px-2 py-0.5 rounded-full bg-${color}-500/20`}>{statusLabel}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full bg-${color}-500 transition-all duration-1000`} style={{ width: `${Math.min(numScore, 100)}%` }} />
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">{explanation}</p>
            </div>
        );
    };

    // ── Info Tooltip Component ───────────────────────────────────────────
    const InfoTip = ({ text }: { text: string }) => (
        <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-white/5 mt-1">
            <span className="text-emerald-400">💡</span> {text}
        </span>
    );

    // ── Section Header ──────────────────────────────────────────────────
    const SectionHeader = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) => (
        <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">{icon}</div>
            <div>
                <h2 className="text-xl font-black text-white tracking-tight">{title}</h2>
                <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
            </div>
        </div>
    );

    // ── Severity Card ───────────────────────────────────────────────────
    const SeverityCard = ({ finding }: { finding: CriticalFinding }) => {
        const styles = {
            critical: { border: 'border-red-500/40', bg: 'bg-red-500/10', dot: 'bg-red-500', label: 'CRÍTICO', labelBg: 'bg-red-500/20 text-red-400' },
            warning: { border: 'border-amber-500/40', bg: 'bg-amber-500/10', dot: 'bg-amber-500', label: 'A MEJORAR', labelBg: 'bg-amber-500/20 text-amber-400' },
            opportunity: { border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500', label: 'OPORTUNIDAD', labelBg: 'bg-emerald-500/20 text-emerald-400' },
        };
        const s = styles[finding.severity] || styles.warning;
        const effortLabels: Record<string, string> = { quick_fix: '⚡ <1 hora', medium: '🔧 1-7 días', major: '🏗️ Especialista' };
        return (
            <div className={`rounded-2xl border ${s.border} ${s.bg} p-5 backdrop-blur-sm hover:scale-[1.01] transition-transform`}>
                <div className="flex items-center gap-2 flex-wrap mb-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${s.labelBg}`}>{s.label}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-400">{(finding.area || 'General').replace(/_/g, ' ')}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-slate-500">{effortLabels[finding.effort] || finding.effort}</span>
                </div>
                <h4 className="text-base font-bold text-white mb-2">{finding.title}</h4>
                <p className="text-sm text-slate-300 leading-relaxed mb-3">{finding.diagnosis}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    <div className="p-2.5 bg-white/5 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">¿Por qué importa?</span>
                        <p className="text-xs text-slate-300">{finding.whyItMatters}</p>
                    </div>
                    <div className="p-2.5 bg-white/5 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">💰 Impacto</span>
                        <p className="text-xs text-white font-bold">{finding.moneyImpact}</p>
                    </div>
                </div>
                <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">🛠️ Solución</span>
                    <p className="text-xs text-emerald-200 leading-relaxed">{finding.fix}</p>
                </div>
            </div>
        );
    };

    // ── MAIN REPORT ──────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-950 font-sans flex flex-col">
            {/* Print styles override for light background */}
            <style>{`@media print { .bg-slate-950 { background: white !important; } .text-white { color: #1e293b !important; } .text-slate-300, .text-slate-400, .text-slate-500 { color: #475569 !important; } .bg-slate-900\\/80, .bg-slate-900 { background: #f8fafc !important; border: 1px solid #e2e8f0 !important; } .border-white\\/10 { border-color: #e2e8f0 !important; } }`}</style>

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* ── TOP BAR ────────────────────────────────────────────── */}
                <div className="flex items-center justify-between print:hidden">
                    <button onClick={() => navigate('/dashboard')} className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Volver al Dashboard
                    </button>
                    <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold border border-white/10 hover:bg-slate-700 hover:text-white transition">
                        <Download size={14} /> Descargar PDF
                    </button>
                </div>

                {/* ══════════════════════════════════════════════════════════
                    HERO — Score Gauge + Grade + Business Name
                ══════════════════════════════════════════════════════════ */}
                <div className="bg-gradient-to-br from-slate-900 via-emerald-950/50 to-slate-900 rounded-3xl p-8 sm:p-12 border border-white/10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full filter blur-[120px]" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/5 rounded-full filter blur-[100px]" />
                    <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
                        {/* Gauge */}
                        <div className="relative flex-shrink-0">
                            <ScoreGauge score={result.snapshot?.digitalMaturityScore ?? 0} size={180} />
                        </div>
                        {/* Info */}
                        <div className="flex-1 text-center lg:text-left">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold text-emerald-300 uppercase tracking-widest mb-3">
                                <Search size={12} /> Auditoría de Presencia Digital
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">{auditName}</h1>
                            <div className="flex items-center gap-3 flex-wrap justify-center lg:justify-start mb-4">
                                <GradeBadge grade={safeText(result.digitalHealthGrade)} />
                                <div>
                                    <span className="text-emerald-300 text-sm font-bold block">Grado de Salud Digital</span>
                                    <InfoTip text="Esta nota resume el estado general de tu presencia online. A = excelente, F = necesita trabajo urgente." />
                                </div>
                            </div>
                            {result.snapshot?.scoreExplanation && (
                                <p className="text-slate-300 text-sm leading-relaxed bg-white/5 rounded-xl px-5 py-3 border border-white/10 max-w-2xl">
                                    {safeText(result.snapshot.scoreExplanation)}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════════
                    KPI SCORECARDS — 6 pillars breakdown
                ══════════════════════════════════════════════════════════ */}
                {result.snapshot?.scoreBreakdown && (() => {
                    const b = result.snapshot.scoreBreakdown;
                    const cards = [
                        { label: 'Web', score: b.web ?? 0, icon: <Globe size={16} className="text-blue-400" />, explanation: 'Velocidad, seguridad y funcionalidad de tu sitio web' },
                        { label: 'SEO', score: b.seo ?? 0, icon: <Search size={16} className="text-green-400" />, explanation: 'Qué tan fácil te encuentran en Google cuando buscan lo que vendés' },
                        { label: 'Redes', score: b.redesSociales ?? b.socialMedia ?? b.social ?? 0, icon: <TrendingUp size={16} className="text-pink-400" />, explanation: 'Tu presencia, engagement y estrategia en redes sociales' },
                        { label: 'Reputación', score: b.reputacion ?? b.reputation ?? 0, icon: <Star size={16} className="text-amber-400" />, explanation: 'Reseñas, comentarios y qué opinan de vos online' },
                        { label: 'Email/CRM', score: b.emailCrm ?? b.email ?? 0, icon: <Mail size={16} className="text-cyan-400" />, explanation: 'Si capturás datos de tus visitantes y les hacés seguimiento' },
                        { label: 'IA (AEO)', score: b.iaReadiness ?? b.aiReadiness ?? 0, icon: <Bot size={16} className="text-violet-400" />, explanation: 'Si tu negocio aparece cuando la gente le pregunta a ChatGPT, Gemini, etc.' },
                    ];
                    return (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {cards.map((c, i) => <div key={i}><KpiCard label={c.label} score={c.score} icon={c.icon} explanation={c.explanation} /></div>)}
                        </div>
                    );
                })()}

                {/* ══════════════════════════════════════════════════════════
                    PLATFORM PRESENCE OVERVIEW
                ══════════════════════════════════════════════════════════ */}
                {(() => {
                    const platforms = [
                        { name: 'Instagram', emoji: '📸', active: !!result.socialMediaAudit?.find((p: any) => p.platform?.toLowerCase().includes('instagram')), url: auditInput?.instagramUrl },
                        { name: 'Facebook', emoji: '📘', active: !!result.socialMediaAudit?.find((p: any) => p.platform?.toLowerCase().includes('facebook')), url: auditInput?.facebookUrl },
                        { name: 'TikTok', emoji: '🎵', active: !!result.socialMediaAudit?.find((p: any) => p.platform?.toLowerCase().includes('tiktok')), url: auditInput?.tiktokUrl },
                        { name: 'LinkedIn', emoji: '💼', active: !!result.socialMediaAudit?.find((p: any) => p.platform?.toLowerCase().includes('linkedin')), url: auditInput?.linkedinUrl },
                        { name: 'YouTube', emoji: '▶️', active: !!result.socialMediaAudit?.find((p: any) => p.platform?.toLowerCase().includes('youtube')), url: auditInput?.youtubeUrl },
                        { name: 'X/Twitter', emoji: '✒️', active: !!result.socialMediaAudit?.find((p: any) => ['x', 'twitter'].some(t => p.platform?.toLowerCase().includes(t))), url: auditInput?.xUrl },
                        { name: 'Pinterest', emoji: '📌', active: !!result.socialMediaAudit?.find((p: any) => p.platform?.toLowerCase().includes('pinterest')), url: auditInput?.pinterestUrl },
                        { name: 'Google Maps', emoji: '📍', active: !!(result.socialProof?.googleRating || result.socialProof?.googleReviewsAnalysis?.averageRating || result.reputationAnalysis?.googleRating), url: auditInput?.googleMapsUrl },
                        { name: 'Meta Ads', emoji: '📢', active: !!(result.adStrategy?.metaAds?.isRunning || result.adStrategy?.recommendedPlatforms?.length > 0 || (typeof result.adStrategy === 'string' && result.adStrategy.includes('Meta'))), url: null },
                        { name: 'Google Ads', emoji: '🔍', active: !!(result.adStrategy?.googleAds?.isRunning || (typeof result.adStrategy === 'string' && result.adStrategy.includes('Google'))), url: null },
                    ];
                    const activeCount = platforms.filter(p => p.active).length;
                    return (
                        <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-bold text-white flex items-center gap-2">
                                    <Globe size={16} className="text-emerald-400" /> Presencia por Plataforma
                                </span>
                                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full">
                                    {activeCount} de {platforms.length} activas
                                </span>
                            </div>
                            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                {platforms.map((p, i) => {
                                    const Component = p.url ? 'a' : 'div';
                                    const hrefProps = p.url ? { href: typeof p.url === 'string' && p.url.startsWith('http') ? p.url : `https://${p.url}`, target: "_blank", rel: "noopener noreferrer" } : {};
                                    return (
                                        <Component key={i} {...hrefProps} className={`group relative flex flex-col items-center gap-1 p-2 rounded-xl transition ${p.active ? 'bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20' : 'bg-white/5 border border-white/5 opacity-40'} ${p.url ? 'cursor-pointer hover:opacity-100' : ''}`}>
                                            <span className="text-lg">{p.emoji}</span>
                                            <span className="text-[9px] font-bold text-slate-400 text-center leading-tight">{p.name}</span>
                                            <span className={`text-[10px] font-black ${p.active ? 'text-emerald-400' : 'text-slate-600'}`}>{p.active ? '✓' : '✗'}</span>
                                            
                                            {/* Tooltip */}
                                            {p.url && (
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded border border-slate-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10 shadow-xl max-w-[200px] overflow-hidden text-ellipsis">
                                                    {p.url.replace(/^https?:\/\/(www\.)?/, '')}
                                                </div>
                                            )}
                                        </Component>
                                    );
                                })}
                            </div>
                            <InfoTip text="Las plataformas marcadas son aquellas donde encontramos presencia activa o anuncios. Si falta alguna, podés agregarla en el onboarding para incluirla en futuros informes." />
                        </div>
                    );
                })()}

                {/* ══════════════════════════════════════════════════════════
                    EXECUTIVE SUMMARY
                ══════════════════════════════════════════════════════════ */}
                <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8">
                    <SectionHeader icon={<Sparkles size={20} className="text-emerald-400" />} title="Resumen Ejecutivo" subtitle="Lo más importante que necesitás saber sobre tu presencia digital" />
                    <p className="text-slate-300 text-base leading-relaxed whitespace-pre-line">{safeText(result.executiveSummary) || 'N/A'}</p>
                </div>

                {/* ══════════════════════════════════════════════════════════
                    MONEY ON THE TABLE
                ══════════════════════════════════════════════════════════ */}
                <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-2xl p-6 sm:p-8 border border-amber-500/30 backdrop-blur-sm">
                    <SectionHeader icon={<Zap size={20} className="text-amber-400" />} title="💰 Plata Sobre la Mesa" subtitle="Oportunidades de ingreso que estás dejando pasar por no tener optimizada tu presencia digital" />
                    <div className="space-y-3">
                        {Array.isArray(result.moneyOnTheTable) ? (
                            result.moneyOnTheTable.map((item: any, i: number) => (
                                <div key={i} className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                                    <span className="text-2xl">💸</span>
                                    <div className="flex-1">
                                        <span className="text-amber-300 font-bold text-sm">{safeText(item.area)}</span>
                                        <p className="text-slate-300 text-sm mt-1">{safeText(item.description)}</p>
                                        {item.estimatedLoss && <span className="text-amber-400 font-black text-base mt-1 block">{safeText(item.estimatedLoss)}</span>}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-300 whitespace-pre-line">{safeText(result.moneyOnTheTable) || 'N/A'}</p>
                        )}
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════════
                    CRITICAL FINDINGS
                ══════════════════════════════════════════════════════════ */}
                {result.findings && result.findings.length > 0 && (
                    <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8">
                        <SectionHeader icon={<AlertTriangle size={20} className="text-amber-400" />} title="🔍 Hallazgos Clave" subtitle="Los problemas y oportunidades más importantes. Cada uno incluye por qué importa y cómo solucionarlo." />
                        <div className="flex flex-wrap gap-2 mb-6">
                            {result.findings.filter(f => f.severity === 'critical').length > 0 && (
                                <span className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-full text-xs font-bold">🔴 {result.findings.filter(f => f.severity === 'critical').length} críticos</span>
                            )}
                            {result.findings.filter(f => f.severity === 'warning').length > 0 && (
                                <span className="px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold">🟡 {result.findings.filter(f => f.severity === 'warning').length} a mejorar</span>
                            )}
                            {result.findings.filter(f => f.severity === 'opportunity').length > 0 && (
                                <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold">🟢 {result.findings.filter(f => f.severity === 'opportunity').length} oportunidades</span>
                            )}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {result.findings
                                .sort((a, b) => ({ critical: 0, warning: 1, opportunity: 2 }[a.severity] ?? 2) - ({ critical: 0, warning: 1, opportunity: 2 }[b.severity] ?? 2))
                                .map((finding, i) => <div key={i}><SeverityCard finding={finding} /></div>)}
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    WEB TECHNICAL — Dashboard Style
                ══════════════════════════════════════════════════════════ */}
                <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8">
                    <SectionHeader icon={<Globe size={20} className="text-blue-400" />} title="🌐 Auditoría Web Técnica" subtitle="El estado técnico de tu sitio web — si funciona rápido, es seguro y está bien armado para vender" />
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        {[
                            { label: 'SSL (Candado)', ok: result.webTechnical.ssl, tip: 'El candadito verde que aparece en el navegador. Sin esto, Google marca tu sitio como "No seguro" y los clientes desconfían.' },
                            { label: 'Sitemap', ok: result.webTechnical.sitemap, tip: 'Es como un mapa de tu sitio para Google. Sin esto, Google puede tardar más en encontrar tus páginas.' },
                            { label: 'robots.txt', ok: result.webTechnical.robotsTxt, tip: 'Un archivo que le dice a Google qué puede ver y qué no de tu sitio.' },
                        ].map((item, i) => (
                            <div key={i} className={`p-3 rounded-xl border ${item.ok ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    {item.ok ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertTriangle size={16} className="text-red-400" />}
                                    <span className={`text-sm font-bold ${item.ok ? 'text-emerald-300' : 'text-red-300'}`}>{item.label}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">{item.tip}</p>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10"><span className="text-[10px] text-slate-500 block mb-1">Velocidad</span><span className="text-lg font-black text-white">{result.webTechnical.pageSpeedScore}</span><p className="text-[10px] text-slate-500">Qué tan rápido carga tu web</p></div>
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10"><span className="text-[10px] text-slate-500 block mb-1">Celular</span><span className="text-lg font-black text-white">{result.webTechnical.mobileReadiness}</span><p className="text-[10px] text-slate-500">Si se ve bien en el celular</p></div>
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10"><span className="text-[10px] text-slate-500 block mb-1">Conversión</span><span className="text-sm font-bold text-white">{safeText(result.webTechnical?.conversionReadyAudit?.details) || 'N/A'}</span><p className="text-[10px] text-slate-500">Si tu web está lista para vender</p></div>
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10"><span className="text-[10px] text-slate-500 block mb-1">Schema</span><span className="text-sm font-bold text-white">{result.webTechnical?.schemaMarkup?.exists ? '✅ Tiene' : '❌ No tiene'}</span><p className="text-[10px] text-slate-500">Etiquetas invisibles que ayudan a Google a entender tu negocio</p></div>
                    </div>
                    {result.webTechnical.detectedTools.length > 0 && (
                        <div className="mt-3">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Herramientas Detectadas en tu Web</span>
                            <div className="flex flex-wrap gap-2">{result.webTechnical.detectedTools.map((t, i) => <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-slate-300">{t.name}</span>)}</div>
                        </div>
                    )}
                </div>

                {/* ══════════════════════════════════════════════════════════
                    SEO — Search Engine Optimization
                ══════════════════════════════════════════════════════════ */}
                <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8">
                    <SectionHeader icon={<Search size={20} className="text-green-400" />} title="🔍 SEO — Cómo te encuentra la gente en Google" subtitle="SEO significa optimización para buscadores. Es lo que hace que cuando alguien busca lo que vos vendés, aparezca TU negocio y no el de la competencia." />
                    
                    {/* Google SERP Positioning (Data-Driven SEO) */}
                    {auditInput?.serpData && auditInput.serpData.length > 0 && (
                        <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-blue-500/20">
                            <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2 mb-4">
                                <Search size={16} />
                                Posicionamiento Real en Google (Top 10)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {auditInput.serpData.map((serp, i) => (
                                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-medium text-slate-400">Búsqueda:</span>
                                                {serp.userPosition ? (
                                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                                                        Top {serp.userPosition}
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                                                        No Aparece
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm font-bold text-white mb-3">"{serp.query}"</p>
                                        </div>
                                        
                                        <div className="space-y-2 mt-auto">
                                            {serp.userPosition && (
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-400">Tu posición:</span>
                                                    <span className="font-bold text-emerald-400">#{serp.userPosition}</span>
                                                </div>
                                            )}
                                            {serp.userInLocalPack && (
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-400">Google Maps:</span>
                                                    <span className="font-bold text-blue-400">Sos relevante 📍</span>
                                                </div>
                                            )}
                                            {serp.competitorPositions && serp.competitorPositions.length > 0 && (
                                                <div className="pt-2 border-t border-white/10 mt-2">
                                                    <p className="text-[10px] text-slate-500 mb-1">Competidores en el radar:</p>
                                                    {serp.competitorPositions.map((c, idx) => (
                                                        <div key={idx} className="flex justify-between items-center text-xs">
                                                            <span className="text-slate-400 truncate pr-2">{c.name}</span>
                                                            <span className="font-bold text-amber-400">#{c.position}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {(!serp.userPosition && (!serp.competitorPositions || serp.competitorPositions.length === 0)) && (
                                                <div className="pt-2 border-t border-white/10 mt-2">
                                                    <p className="text-[10px] text-slate-500 italic">Ni vos ni tu competencia están en la Pág. 1</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10"><span className="text-[10px] text-slate-500 block mb-1">Blog</span><span className="text-sm font-bold text-white">{result.seoAnalysis?.blogStatus || 'N/A'}</span><p className="text-[10px] text-slate-500">Tener blog ayuda a que Google te recomiende</p></div>
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10"><span className="text-[10px] text-slate-500 block mb-1">Meta Tags</span><span className="text-sm font-bold text-white">{result.seoAnalysis?.metaTagsStatus || 'N/A'}</span><p className="text-[10px] text-slate-500">Títulos y descripciones que ve Google</p></div>
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10"><span className="text-[10px] text-slate-500 block mb-1">Keywords</span><span className="text-sm font-bold text-white truncate">{safeText(result.seoAnalysis?.keywordGapAnalysis)?.slice(0, 60) || 'N/A'}</span></div>
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10"><span className="text-[10px] text-slate-500 block mb-1">Autoridad</span><span className="text-sm font-bold text-white">{safeText(result.seoAnalysis?.contentAuthorityScore) || 'N/A'}</span><p className="text-[10px] text-slate-500">Qué tanta confianza genera tu contenido</p></div>
                    </div>
                    {result.seoAnalysis.productNamingIssues && result.seoAnalysis.productNamingIssues.length > 0 && (
                        <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 mb-3">
                            <span className="text-xs font-bold text-amber-400 uppercase block mb-3">🏷️ Nombres de Productos con Problemas de SEO</span>
                            <p className="text-[11px] text-slate-400 mb-3">Estos nombres no ayudan a que te encuentren en Google. Te sugerimos cambiarlos para que coincidan con lo que la gente busca.</p>
                            <div className="space-y-2">
                                {result.seoAnalysis.productNamingIssues.map((issue, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                                        <span className="text-red-400 font-mono text-xs line-through">{issue.currentName}</span>
                                        <span className="text-slate-500">→</span>
                                        <span className="text-emerald-400 font-bold text-xs">{issue.suggestedName}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {result.seoAnalysis?.localSeoCheck && (
                        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <span className="text-xs font-bold text-blue-400 block mb-1">📍 SEO Local (Google Maps, búsquedas "cerca de mí")</span>
                            <p className="text-sm text-slate-300">{safeText(result.seoAnalysis.localSeoCheck?.localReviewSummary) || 'N/A'}</p>
                        </div>
                    )}
                </div>

                {/* ══════════════════════════════════════════════════════════
                    AI READINESS (AEO)
                ══════════════════════════════════════════════════════════ */}
                <div className="bg-gradient-to-br from-violet-950/50 to-slate-900 rounded-2xl border border-violet-500/20 p-6 sm:p-8">
                    <SectionHeader icon={<Bot size={20} className="text-violet-400" />} title="🤖 SEO para IAs (AEO)" subtitle="AEO = Answer Engine Optimization. Es lo nuevo: que tu negocio aparezca cuando la gente le pregunta a ChatGPT, Gemini o Siri. Hoy no es obligatorio, pero en 1-2 años será tan importante como Google." />
                    {result.aiReadiness?.summary && (
                        <p className="text-slate-300 text-sm leading-relaxed bg-white/5 rounded-xl p-4 border border-white/10 mb-4">{safeText(result.aiReadiness.summary)}</p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        {[
                            { label: 'Datos Estructurados', value: result.aiReadiness?.structuredData?.detected, tip: 'Etiquetas invisibles en tu web que ayudan a las IAs a entender tu negocio', detail: safeText(result.aiReadiness?.structuredData?.recommendation) },
                            { label: 'Contenido Q&A', value: result.aiReadiness?.qaContent?.hasQaFormat, tip: 'Preguntas y respuestas que las IAs pueden usar directamente', detail: safeText(result.aiReadiness?.qaContent?.recommendation) },
                            { label: 'llms.txt', value: result.aiReadiness?.llmsTxt?.exists, tip: 'Un archivo especial que le dice a las IAs cómo describir tu negocio', detail: safeText(result.aiReadiness?.llmsTxt?.recommendation) },
                            { label: 'E-E-A-T', value: null, tip: 'Experiencia, conocimiento, autoridad y confianza que transmite tu web', detail: safeText(result.aiReadiness?.eeatScore) },
                        ].map((item, i) => (
                            <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/10">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">{item.value === true ? '🟢' : item.value === false ? '🔴' : '📊'}</span>
                                    <span className="text-xs font-bold text-slate-300">{item.label}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 mb-1">{item.tip}</p>
                                {item.detail && <p className="text-[10px] text-violet-300">{item.detail}</p>}
                            </div>
                        ))}
                    </div>
                    {result.aiReadiness?.aiCrawlerAccess?.blocked?.length > 0 && (
                        <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                            <span className="text-xs font-bold text-red-400 block mb-1">⚠️ Bots de IA BLOQUEADOS</span>
                            <p className="text-xs text-slate-300">{result.aiReadiness.aiCrawlerAccess.blocked.join(', ')}</p>
                            <p className="text-[10px] text-red-300 mt-1">Esto significa que ChatGPT, Gemini y otros NO pueden leer tu web para recomendarte. {result.aiReadiness.aiCrawlerAccess.recommendation}</p>
                        </div>
                    )}

                </div>

                {/* ══════════════════════════════════════════════════════════
                    SOCIAL MEDIA DASHBOARD
                ══════════════════════════════════════════════════════════ */}
                {result.socialMediaAudit && result.socialMediaAudit.length > 0 && (
                    <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8">
                        <SectionHeader icon={<TrendingUp size={20} className="text-pink-400" />} title="📱 Redes Sociales" subtitle="El estado de tus perfiles en redes sociales. Engagement = qué tanto tu audiencia interactúa con tu contenido (likes, comentarios, compartidos)." />
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-slate-500 text-[10px] uppercase tracking-wider border-b border-white/10">
                                        <th className="px-4 py-3 font-bold">Red</th>
                                        <th className="px-4 py-3 font-bold">Seguidores</th>
                                        <th className="px-4 py-3 font-bold">Engagement</th>
                                        <th className="px-4 py-3 font-bold">Frecuencia Posts</th>
                                        <th className="px-4 py-3 font-bold">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {result.socialMediaAudit.map((profile: any, i: number) => (
                                        <tr key={i} className="hover:bg-white/5 transition">
                                            <td className="px-4 py-3 font-bold text-white">{safeText(profile.platform)}</td>
                                            <td className="px-4 py-3 text-slate-300 font-medium">{safeText(profile.followers)}</td>
                                            <td className="px-4 py-3 text-slate-300">{safeText(profile.engagement)}</td>
                                            <td className="px-4 py-3 text-slate-400">{safeText(profile.postingFrequency)}</td>
                                            <td className="px-4 py-3"><TrafficLight score={profile.overallScore} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {result.socialMediaAudit.some((p: any) => p.topPosts?.length > 0) && (
                            <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                                <span className="text-xs font-bold text-slate-400 uppercase block mb-3">🔥 Posts Más Exitosos</span>
                                <div className="space-y-2">
                                    {result.socialMediaAudit.flatMap((p: any) => (p.topPosts || []).slice(0, 3).map((post: any, j: number) => (
                                        <div key={`${p.platform}-${j}`} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition">
                                            <span className="text-sm font-bold text-pink-400 whitespace-nowrap">{safeText(p.platform)}</span>
                                            <p className="text-xs text-slate-300 flex-1 line-clamp-2">{safeText(post.description || post.content || post.caption)}</p>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className="text-xs text-emerald-400 font-bold">{safeText(post.engagement || post.likes)}</span>
                                                {(post.url || post.link) && (
                                                    <a href={post.url || post.link} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition">
                                                        <ExternalLink size={12} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    COMPETITOR BENCHMARKING
                ══════════════════════════════════════════════════════════ */}
                {result.competitorBenchmark && result.competitorBenchmark.length > 0 && (
                    <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8">
                        <SectionHeader icon={<Users size={20} className="text-violet-400" />} title="🥊 Tu Negocio vs Competencia" subtitle="Comparamos tu presencia digital con la de tus competidores directos. Esto te muestra dónde estás ganando y dónde podés mejorar." />
                        {result.competitorBenchmark.map((comp: any, i: number) => (
                            <div key={i} className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-black text-xs">{i + 1}</span>
                                        {safeText(comp.competitorName || comp.name)}
                                    </h4>
                                    {(comp.website || comp.profileUrl) && (
                                        <a href={typeof (comp.website || comp.profileUrl) === 'string' && (comp.website || comp.profileUrl).startsWith('http') ? (comp.website || comp.profileUrl) : `https://${comp.website || comp.profileUrl}`} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-400 hover:underline flex items-center gap-1">
                                            <ExternalLink size={12} /> Ver perfil
                                        </a>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="p-2 bg-white/5 rounded-lg text-center"><span className="text-[10px] text-slate-500 block">Seguidores IG</span><span className="text-sm font-bold text-white">{safeText(comp.followers || 'N/A')}</span></div>
                                    <div className="p-2 bg-white/5 rounded-lg text-center"><span className="text-[10px] text-slate-500 block">Engagement</span><span className="text-sm font-bold text-white">{safeText(comp.engagementRate || 'N/A')}</span></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                                        <span className="text-[10px] font-bold text-red-400 uppercase block mb-1">🔥 Qué hacen mejor</span>
                                        <p className="text-xs text-slate-300">{safeText(comp.whatTheyDoBetter || comp.contentStrategyGap)}</p>
                                    </div>
                                    <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                        <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">👑 Qué hacés mejor vos</span>
                                        <p className="text-xs text-slate-300">{safeText(comp.whatClientDoesBetter)}</p>
                                    </div>
                                </div>
                                <div className="p-3 bg-violet-500/10 rounded-xl border border-violet-500/20 mb-3">
                                    <span className="text-[10px] font-bold text-violet-400 uppercase block mb-1">💡 Qué podés aprender</span>
                                    <p className="text-xs text-slate-300">{safeText(comp.keyTakeaway)}</p>
                                </div>
                                {comp.professionalInterpretation && (
                                    <div className="mt-3 p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                        <span className="text-[10px] font-bold text-indigo-400 uppercase block mb-1">📋 Interpretación Profesional</span>
                                        <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">{safeText(comp.professionalInterpretation)}</p>
                                    </div>
                                )}
                                {comp.topPosts && comp.topPosts.length > 0 && (
                                    <div className="mt-4 border-t border-white/10 pt-4">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">📸 Sus posts más exitosos</span>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {comp.topPosts.slice(0, 3).map((post: any, j: number) => (
                                                <div key={j} className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col h-full">
                                                    <p className="text-xs text-slate-300 line-clamp-3 mb-3 flex-grow italic">"{safeText(post.caption)}"</p>
                                                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-auto pt-2 border-t border-white/5">
                                                        <div className="flex gap-2">
                                                            <span className="flex items-center gap-1 text-pink-400"><Heart size={10} /> {safeText(post.likes)}</span>
                                                            <span className="flex items-center gap-1 text-blue-400"><MessageCircle size={10} /> {safeText(post.comments)}</span>
                                                        </div>
                                                        {post.url && (
                                                            <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1">
                                                                Ver post <ExternalLink size={10} />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    INDUSTRY LEADERS
                ══════════════════════════════════════════════════════════ */}
                {result.industryLeaders && result.industryLeaders.length > 0 && (
                    <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8">
                        <SectionHeader icon={<Star size={20} className="text-amber-400" />} title="🏆 Referentes del Rubro" subtitle="Marcas líderes en tu industria que son referencia en marketing digital. Estudiar qué les funciona te da un shortcut para mejorar tu estrategia. No son tu competencia directa, sino inspiración." />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {result.industryLeaders.map((leader: any, i: number) => (
                                <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-base font-bold text-white">{safeText(leader.name)}</h4>
                                        {leader.profileUrl && <a href={typeof leader.profileUrl === 'string' && leader.profileUrl.startsWith('http') ? leader.profileUrl : `https://${leader.profileUrl}`} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:underline"><ExternalLink size={12} /></a>}
                                    </div>
                                    <div className="flex gap-3 text-xs text-slate-400 mb-2">
                                        <span>{safeText(leader.platform)}</span>
                                        <span>👥 {safeText(leader.followers)}</span>
                                        <span>📊 {safeText(leader.engagementRate)}</span>
                                    </div>
                                    <p className="text-xs text-slate-300 mb-2">{safeText(leader.strategy)}</p>
                                    <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                        <p className="text-[10px] text-emerald-300">{safeText(leader.lessonsForUser)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    EMAIL & CRM
                ══════════════════════════════════════════════════════════ */}
                <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8">
                    <SectionHeader icon={<Mail size={20} className="text-cyan-400" />} title="📧 Email Marketing & CRM" subtitle="CRM = herramienta para gestionar clientes. Email marketing = enviar emails con ofertas, novedades o contenido de valor a tus contactos. Es uno de los canales con mayor retorno de inversión." />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                        <div className={`p-3 rounded-xl border ${result.emailCrmAssessment.hasEmailCapture ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                            <div className="flex items-center gap-2">{result.emailCrmAssessment.hasEmailCapture ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertTriangle size={16} className="text-red-400" />}<span className={`text-sm font-bold ${result.emailCrmAssessment.hasEmailCapture ? 'text-emerald-300' : 'text-red-300'}`}>Captura de Email</span></div>
                            <p className="text-[10px] text-slate-500 mt-1">{result.emailCrmAssessment.hasEmailCapture ? 'Tu web captura datos de visitantes' : 'No estás capturando emails de tus visitantes — estás perdiendo contactos potenciales'}</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10"><span className="text-[10px] text-slate-500 block mb-1">Plataforma</span><span className="text-sm font-bold text-white">{safeText(result.emailCrmAssessment.emailPlatformDetected) || 'N/A'}</span></div>
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10"><span className="text-[10px] text-slate-500 block mb-1">Madurez CRM</span><span className="text-sm font-bold text-white">{safeText(result.emailCrmAssessment.crmMaturity) || 'N/A'}</span><p className="text-[10px] text-slate-500">Qué tan sofisticado es tu seguimiento de clientes</p></div>
                    </div>
                    {result.emailCrmAssessment.recommendations.length > 0 && (
                        <div className="space-y-1">{result.emailCrmAssessment.recommendations.map((r: any, i: number) => <div key={i} className="flex items-start gap-2 text-sm text-slate-300"><CheckCircle2 size={14} className="text-cyan-400 mt-0.5 flex-shrink-0" /><span>{safeText(r)}</span></div>)}</div>
                    )}
                </div>

                {/* ══════════════════════════════════════════════════════════
                    VISUAL IDENTITY
                ══════════════════════════════════════════════════════════ */}
                {result.visualIdentityAudit && safeText(result.visualIdentityAudit.overallScore) && (
                    <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8">
                        <SectionHeader icon={<Sparkles size={20} className="text-pink-400" />} title="🎨 Identidad Visual Digital" subtitle="Cómo se ve tu marca en internet. La coherencia visual genera confianza y profesionalismo." />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { label: 'Nivel General', value: result.visualIdentityAudit.overallScore },
                                { label: 'Consistencia', value: result.visualIdentityAudit.brandConsistency },
                                { label: 'Calidad Fotos', value: result.visualIdentityAudit.photoQuality },
                                { label: 'Estética Feed', value: result.visualIdentityAudit.feedAesthetic },
                            ].map((item, i) => (
                                <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                                    <span className="text-[10px] text-slate-500 block mb-1">{item.label}</span>
                                    <span className="text-base font-black text-white">{safeText(item.value) || 'N/A'}</span>
                                </div>
                            ))}
                        </div>
                        {Array.isArray(result.visualIdentityAudit.recommendations) && result.visualIdentityAudit.recommendations.length > 0 && (
                            <div className="mt-4 p-4 bg-pink-500/10 rounded-xl border border-pink-500/20">
                                <span className="text-xs font-bold text-pink-400 uppercase block mb-2">🎯 Mejoras Visuales Sugeridas</span>
                                {result.visualIdentityAudit.recommendations.map((rec: any, i: number) => <div key={i} className="flex gap-2 mb-1"><span className="text-pink-400">▸</span><p className="text-xs text-slate-300">{safeText(rec)}</p></div>)}
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    CUSTOMER PERCEPTION
                ══════════════════════════════════════════════════════════ */}
                {result.customerPerception && safeText(result.customerPerception.currentImage) && (
                    <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8">
                        <SectionHeader icon={<TrendingUp size={20} className="text-amber-400" />} title="👁️ Cómo te Ven tus Clientes" subtitle="La percepción que tus clientes tienen de tu marca. Muchas veces lo que vos creés que transmitís no es lo que la gente percibe." />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                <span className="text-xs font-bold text-amber-400 uppercase block mb-2">😐 Imagen Actual</span>
                                <p className="text-sm text-slate-300">{safeText(result.customerPerception.currentImage)}</p>
                            </div>
                            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                <span className="text-xs font-bold text-emerald-400 uppercase block mb-2">🌟 Imagen Ideal</span>
                                <p className="text-sm text-slate-300">{safeText(result.customerPerception.idealImage)}</p>
                            </div>
                        </div>
                        {Array.isArray(result.customerPerception.gaps) && result.customerPerception.gaps.length > 0 && (
                            <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20 mb-3">
                                <span className="text-xs font-bold text-red-400 uppercase block mb-2">⚠️ Brechas de Percepción</span>
                                {result.customerPerception.gaps.map((gap: any, i: number) => <div key={i} className="flex gap-2 mb-1"><span className="text-red-400">▸</span><p className="text-xs text-slate-300">{safeText(gap)}</p></div>)}
                            </div>
                        )}
                        {Array.isArray(result.customerPerception.quickWins) && result.customerPerception.quickWins.length > 0 && (
                            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                <span className="text-xs font-bold text-blue-400 uppercase block mb-2">⚡ Victorias Rápidas</span>
                                {result.customerPerception.quickWins.map((win: any, i: number) => <div key={i} className="flex gap-2 mb-1"><span className="text-blue-400">▸</span><p className="text-xs text-slate-300">{safeText(win)}</p></div>)}
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    SOCIAL PROOF
                ══════════════════════════════════════════════════════════ */}
                {result.socialProof && (
                    <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8">
                        <SectionHeader icon={<MessageCircle size={20} className="text-blue-400" />} title="💬 Prueba Social" subtitle="Social Proof = lo que otros dicen de vos. Reseñas, comentarios y menciones. Las personas confían más en lo que dicen otros clientes que en lo que dice tu publicidad." />
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center"><span className="text-xs font-bold text-emerald-400 uppercase block mb-1">Confianza Global</span><span className="text-3xl font-black text-white">{safeText(result.socialProof.trustScore)}<span className="text-sm text-slate-500">/100</span></span></div>
                            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 text-center"><span className="text-xs font-bold text-blue-400 uppercase block mb-1">Sentimiento General</span><div className="mt-1"><TrafficLight score={result.socialProof.overallSentiment} /></div></div>
                        </div>
                        {result.socialProof.googleReviewsAnalysis && (
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mt-6">
                                <div className="flex items-start gap-4 mb-5">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-2xl">🗺️</span>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 text-lg">Tu Ficha de Google Maps</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-amber-500 font-bold text-lg">{safeText(result.socialProof.googleReviewsAnalysis.averageRating)}</span>
                                            <div className="flex text-amber-500 text-sm">★★★★★</div>
                                            <span className="text-slate-500 text-sm">({safeText(result.socialProof.googleReviewsAnalysis.totalReviews)} reseñas verificadas)</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                                        <h5 className="font-bold text-emerald-800 text-sm mb-3 flex items-center gap-2">
                                            <span className="text-emerald-500">👍</span> Lo que más elogian
                                        </h5>
                                        <ul className="space-y-2">
                                            {result.socialProof.googleReviewsAnalysis.positiveThemes?.map((t: string, i: number) => (
                                                <li key={i} className="text-emerald-700 text-sm flex items-start gap-2">
                                                    <span className="text-emerald-400 mt-0.5">•</span>
                                                    <span>{safeText(t)}</span>
                                                </li>
                                            ))}
                                            {(!result.socialProof.googleReviewsAnalysis.positiveThemes || result.socialProof.googleReviewsAnalysis.positiveThemes.length === 0) && (
                                                <li className="text-slate-500 text-sm italic">No hay suficientes datos.</li>
                                            )}
                                        </ul>
                                    </div>
                                    <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                                        <h5 className="font-bold text-red-800 text-sm mb-3 flex items-center gap-2">
                                            <span className="text-red-500">👎</span> Lo que más critican
                                        </h5>
                                        <ul className="space-y-2">
                                            {result.socialProof.googleReviewsAnalysis.negativeThemes?.map((t: string, i: number) => (
                                                <li key={i} className="text-red-700 text-sm flex items-start gap-2">
                                                    <span className="text-red-400 mt-0.5">•</span>
                                                    <span>{safeText(t)}</span>
                                                </li>
                                            ))}
                                            {(!result.socialProof.googleReviewsAnalysis.negativeThemes || result.socialProof.googleReviewsAnalysis.negativeThemes.length === 0) && (
                                                <li className="text-slate-500 text-sm italic">Sin críticas recurrentes detectadas.</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                        {Array.isArray(result.socialProof.recommendations) && (
                            <div className="space-y-1">{result.socialProof.recommendations.map((r: string, i: number) => <div key={i} className="flex gap-2"><span className="text-blue-400">▸</span><p className="text-xs text-slate-300">{safeText(r)}</p></div>)}</div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    FUNNEL ANALYSIS
                ══════════════════════════════════════════════════════════ */}
                {result.funnelAnalysis && (
                    <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8">
                        <SectionHeader icon={<Filter size={20} className="text-indigo-400" />} title="🔎 Funnel de Ventas" subtitle="Funnel = el camino que recorre un potencial cliente desde que te conoce hasta que te compra. Como un embudo: entran muchos arriba y salen pocos abajo comprando. El objetivo es que se pierdan la menor cantidad posible en el camino." />
                        <div className="p-4 bg-gradient-to-r from-red-500/20 to-amber-500/20 rounded-xl border border-red-500/30 mb-4">
                            <span className="text-xs font-bold text-red-400 uppercase block mb-1">🚨 Fuga Principal</span>
                            <p className="text-sm text-white font-medium">{safeText(result.funnelAnalysis.biggestLeak)}</p>
                            <InfoTip text="Esto es donde más clientes potenciales estás perdiendo. Solucionarlo debería ser prioridad." />
                        </div>
                        <div className="space-y-3">
                            {result.funnelAnalysis.stages?.map((stage: any, i: number) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-sm flex-shrink-0">{i + 1}</div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-bold text-white uppercase block">{safeText(stage.stage)}</span>
                                        <p className="text-xs text-slate-400 mt-1">{safeText(stage.currentState)}</p>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <div className="p-2 bg-red-500/10 rounded-lg"><span className="text-[10px] font-bold text-red-400">❌ Problema:</span><p className="text-[10px] text-slate-300">{safeText(stage.bottleneck)}</p></div>
                                            <div className="p-2 bg-emerald-500/10 rounded-lg"><span className="text-[10px] font-bold text-emerald-400">✅ Fix:</span><p className="text-[10px] text-slate-300">{safeText(stage.fix)}</p></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    CONTENT IDENTITY
                ══════════════════════════════════════════════════════════ */}
                {result.contentIdentityAudit && (
                    <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8">
                        <SectionHeader icon={<Palette size={20} className="text-indigo-400" />} title="🎭 Identidad de Contenido" subtitle="Qué tipo de contenido publicás, el tono que usás y si tu marca se ve consistente en todos los canales." />
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center"><span className="text-[10px] text-slate-500 block mb-1">Calidad Visual</span><span className="text-2xl font-black text-indigo-400">{safeText(result.contentIdentityAudit.visualScore)}<span className="text-sm text-slate-500">/10</span></span></div>
                            <div className={`p-3 rounded-xl border text-center ${result.contentIdentityAudit.isTransactionalOnly ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                                <span className="text-[10px] text-slate-500 block mb-1">Perfil</span>
                                <span className={`text-sm font-bold ${result.contentIdentityAudit.isTransactionalOnly ? 'text-red-400' : 'text-emerald-400'}`}>{result.contentIdentityAudit.isTransactionalOnly ? 'SOLO VENDE ❌' : 'BALANCE OK ✅'}</span>
                                <p className="text-[10px] text-slate-500 mt-1">{result.contentIdentityAudit.isTransactionalOnly ? 'Solo publicás ofertas. Necesitás contenido de valor para generar confianza.' : 'Tenés un buen balance entre contenido de valor y ventas.'}</p>
                            </div>
                        </div>
                        {Array.isArray(result.contentIdentityAudit.contentMix) && (
                            <div className="p-3 bg-white/5 rounded-xl border border-white/10 mb-3">
                                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-3">Content Mix</span>
                                {result.contentIdentityAudit.contentMix.map((mix: any, i: number) => {
                                    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-slate-500'];
                                    const numStr = safeText(mix.percentage).replace(/[^0-9]/g, '');
                                    const width = numStr ? Math.min(100, Math.max(5, parseInt(numStr))) : 20;
                                    return (
                                        <div key={i} className="mb-2">
                                            <div className="flex justify-between text-xs mb-1"><span className="text-slate-300">{safeText(mix.type)}</span><span className="text-slate-500">{safeText(mix.percentage)}</span></div>
                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className={`h-full ${colors[i % colors.length]} rounded-full`} style={{ width: `${width}%` }} /></div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    COMPETITOR COMPARISON TABLE
                ══════════════════════════════════════════════════════════ */}
                {result.competitorComparison && (
                    <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8">
                        <SectionHeader icon={<Users size={20} className="text-emerald-400" />} title="📊 Comparativa por Plataforma" subtitle="Tu performance vs competidores en cada red social. Los números en verde significan que estás por encima del promedio." />
                        {result.competitorComparison.platforms?.map((plat: any, i: number) => (
                            <div key={i} className="mb-4 overflow-x-auto">
                                <h4 className="text-sm font-bold text-white mb-2">{safeText(plat.platform)}</h4>
                                <table className="w-full text-left text-xs">
                                    <thead><tr className="text-slate-500 text-[10px] uppercase border-b border-white/10"><th className="px-3 py-2">Perfil</th><th className="px-3 py-2">Seguidores</th><th className="px-3 py-2">Engagement</th><th className="px-3 py-2">Frecuencia</th></tr></thead>
                                    <tbody className="divide-y divide-white/5">
                                        <tr className="bg-emerald-500/10"><td className="px-3 py-2 font-bold text-emerald-400">TU NEGOCIO</td><td className="px-3 py-2 text-white font-bold">{safeText(plat.userMetrics?.followers)}</td><td className="px-3 py-2 text-white font-bold">{safeText(plat.userMetrics?.engagement)}</td><td className="px-3 py-2 text-slate-300">{safeText(plat.userMetrics?.postFreq)}</td></tr>
                                        {plat.competitors?.map((comp: any, j: number) => (
                                            <tr key={j} className="hover:bg-white/5"><td className="px-3 py-2 text-slate-300 font-medium">{safeText(comp.name)}</td><td className="px-3 py-2 text-slate-400">{safeText(comp.followers)}</td><td className="px-3 py-2 text-slate-400">{safeText(comp.engagement)}</td><td className="px-3 py-2 text-slate-500">{safeText(comp.postFreq)}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    CHANNEL STRATEGIES
                ══════════════════════════════════════════════════════════ */}
                {Array.isArray(result.channelStrategies) && result.channelStrategies.length > 0 && (
                    <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8">
                        <SectionHeader icon={<LayoutDashboard size={20} className="text-indigo-400" />} title="📈 Estrategias por Canal" subtitle="Recomendaciones específicas para cada plataforma donde tenés presencia digital." />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {result.channelStrategies.map((strat: any, i: number) => (
                                <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <h4 className="font-bold text-base text-white mb-3">{safeText(strat.platform)}</h4>
                                    <div className="p-2 bg-white/5 rounded-lg mb-2"><span className="text-[10px] text-slate-500 block">Estado Actual</span><p className="text-xs text-slate-300 italic">{safeText(strat.currentState)}</p></div>
                                    <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 mb-2"><span className="text-[10px] font-bold text-emerald-400 block">🎯 Estrategia</span><p className="text-xs text-emerald-200">{safeText(strat.strategy)}</p></div>
                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                        <div><span className="text-slate-500 block">Frecuencia</span><span className="text-white font-bold">{safeText(strat.postingSchedule)}</span></div>
                                        <div><span className="text-slate-500 block">Presupuesto</span><span className="text-emerald-400 font-bold">{safeText(strat.budgetSuggestion)}</span></div>
                                    </div>
                                    {Array.isArray(strat.kpis) && strat.kpis.length > 0 && (
                                        <div className="mt-2 p-2 bg-slate-950 rounded-lg">
                                            <span className="text-[10px] font-bold text-slate-500 block mb-1">📊 KPIs</span>
                                            <div className="grid grid-cols-2 gap-1">{strat.kpis.map((kpi: any, j: number) => <div key={j} className="text-center p-1"><span className="text-[9px] text-slate-500 block">{safeText(kpi.metric)}</span><span className="text-emerald-400 font-bold text-xs">{safeText(kpi.target30d)}</span></div>)}</div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    AD STRATEGY
                ══════════════════════════════════════════════════════════ */}
                {result.adStrategy && (
                    <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8">
                        <SectionHeader icon={<Megaphone size={20} className="text-orange-400" />} title="🎯 Estrategia Publicitaria (Ads)" subtitle="Ads = publicidad paga en redes sociales o Google. Cuánto invertir, dónde y qué tipo de anuncios hacer para maximizar el retorno." />
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/10"><span className="text-[10px] text-slate-500 block mb-1">Inversión Actual</span><span className="text-sm font-bold text-white">{safeText(result.adStrategy.currentAdSpend)}</span></div>
                            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20"><span className="text-[10px] text-emerald-400 block mb-1">Presupuesto Recomendado</span><span className="text-sm font-bold text-emerald-300">{safeText(result.adStrategy.recommendedBudget)}</span></div>
                        </div>
                        {Array.isArray(result.adStrategy.adTypes) && result.adStrategy.adTypes.length > 0 && (
                            <div className="space-y-2">{result.adStrategy.adTypes.map((ad: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                                    <div><span className="text-sm font-bold text-white">{safeText(ad.type)}</span><p className="text-xs text-slate-400">{safeText(ad.why)}</p></div>
                                    <span className="text-xs font-bold text-amber-400 whitespace-nowrap ml-3">{safeText(ad.budget)}</span>
                                </div>
                            ))}</div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    INFLUENCER STRATEGY
                ══════════════════════════════════════════════════════════ */}
                {result.influencerStrategy && (
                    <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8">
                        <SectionHeader icon={<UsersRound size={20} className="text-pink-400" />} title="🤝 Marketing con Creadores" subtitle="Trabajar con influencers o creadores de contenido de tu rubro para que recomienden tu producto. Puede ser desde un canje hasta una campaña paga." />
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-center"><span className="text-[10px] text-indigo-400 block mb-1">Tier Recomendado</span><span className="text-sm font-bold text-white">{safeText(result.influencerStrategy.recommendedTier)}</span><p className="text-[10px] text-slate-500 mt-1">Nano = {'<'}10K seg. Micro = 10-50K. Macro = 50K+</p></div>
                            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center"><span className="text-[10px] text-emerald-400 block mb-1">Costo Estimado</span><span className="text-sm font-bold text-emerald-300">{safeText(result.influencerStrategy.estimatedCost)}</span></div>
                        </div>
                        {Array.isArray(result.influencerStrategy.suggestedProfiles) && result.influencerStrategy.suggestedProfiles.length > 0 && (
                            <div className="space-y-2 mb-3">{result.influencerStrategy.suggestedProfiles.map((prof: any, j: number) => (
                                <div key={j} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/10">
                                    <span className="text-sm font-bold text-white">{safeText(prof.name)}</span>
                                    <span className="text-xs text-slate-400">{safeText(prof.platform)} • {safeText(prof.followers)}</span>
                                    <span className="text-xs text-pink-400 ml-auto">{safeText(prof.whyRelevant)}</span>
                                </div>
                            ))}</div>
                        )}
                        {Array.isArray(result.influencerStrategy.collaborationIdeas) && result.influencerStrategy.collaborationIdeas.length > 0 && (
                            <div className="p-3 bg-violet-500/10 rounded-xl border border-violet-500/20"><span className="text-xs font-bold text-violet-400 block mb-2">🎬 Ideas de Colaboración</span>{result.influencerStrategy.collaborationIdeas.map((idea: string, i: number) => <div key={i} className="flex gap-2 mb-1"><span className="text-violet-400">▸</span><p className="text-xs text-slate-300">{safeText(idea)}</p></div>)}</div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    MARKETPLACE  
                ══════════════════════════════════════════════════════════ */}
                {result.marketplaceAnalysis && (
                    <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8">
                        <SectionHeader icon={<ShoppingCart size={20} className="text-yellow-400" />} title="🛒 Presencia en Marketplace" subtitle="Si vendés productos, estar en MercadoLibre u otros marketplaces puede significar ventas adicionales con poco esfuerzo." />
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20"><span className="text-[10px] text-yellow-400 block mb-1">Plataforma</span><span className="text-sm font-bold text-white">{safeText(result.marketplaceAnalysis.platform)}</span></div>
                            <div className="p-3 bg-white/5 rounded-xl border border-white/10"><span className="text-[10px] text-slate-500 block mb-1">Presencia Actual</span><span className="text-sm font-medium text-slate-300">{safeText(result.marketplaceAnalysis.currentPresence)}</span></div>
                        </div>
                        {Array.isArray(result.marketplaceAnalysis.recommendations) && result.marketplaceAnalysis.recommendations.length > 0 && (
                            <div className="space-y-1">{result.marketplaceAnalysis.recommendations.map((r: string, i: number) => <div key={i} className="flex gap-2"><span className="text-yellow-400">▸</span><p className="text-xs text-slate-300">{safeText(r)}</p></div>)}</div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    OPPORTUNITIES (Plan de Acción)
                ══════════════════════════════════════════════════════════ */}
                <div className="bg-gradient-to-br from-emerald-950/50 to-slate-900 rounded-2xl border border-emerald-500/20 p-6 sm:p-8">
                    <SectionHeader icon={<Zap size={20} className="text-emerald-400" />} title="🚀 Plan de Acción Priorizado" subtitle="Las acciones concretas que recomendamos, ordenadas por impacto y facilidad de implementación." />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {result.opportunities.map((opp: any, i: number) => {
                            const catStyles: Record<string, string> = {
                                'Victoria Rápida': 'border-emerald-500/40 bg-emerald-500/10', 'Quick Win': 'border-emerald-500/40 bg-emerald-500/10',
                                'Inversión Estratégica': 'border-blue-500/40 bg-blue-500/10', 'Strategic Investment': 'border-blue-500/40 bg-blue-500/10',
                                'Corrección Urgente': 'border-red-500/40 bg-red-500/10', 'Critical Fix': 'border-red-500/40 bg-red-500/10',
                            };
                            return (
                                <div key={i} className={`rounded-xl border p-4 ${catStyles[safeText(opp.category)] || 'border-white/10 bg-white/5'}`}>
                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                        <h4 className="text-sm font-bold text-white">{safeText(opp.title)}</h4>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-300">{safeText(opp.category)}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${opp.impact === 'high' ? 'bg-emerald-500/20 text-emerald-400' : opp.impact === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'}`}>Impacto: {safeText(opp.impact)}</span>
                                    </div>
                                    <p className="text-xs text-slate-300 mb-2">{safeText(opp.description)}</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-2 bg-white/5 rounded-lg"><span className="text-[10px] text-slate-500 block">Esfuerzo</span><span className="text-xs font-bold text-white">{safeText(opp.effort)}</span></div>
                                        <div className="p-2 bg-white/5 rounded-lg"><span className="text-[10px] text-slate-500 block">ROI Est.</span><span className="text-xs font-bold text-emerald-400">{safeText(opp.estimatedRoi)}</span></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════════
                    RISKS
                ══════════════════════════════════════════════════════════ */}
                <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8">
                    <SectionHeader icon={<Shield size={20} className="text-amber-400" />} title="⚠️ Riesgos y Desafíos" subtitle="Cosas a tener en cuenta. No te asustes — todos los negocios tienen riesgos. Lo importante es conocerlos y mitigarlos." />
                    <div className="space-y-3">
                        {result.risks.map((risk: any, i: number) => (
                            <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${risk.severity === 'high' ? 'bg-red-500/20 text-red-400' : risk.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{safeText(risk.severity)}</span>
                                    <h4 className="text-sm font-bold text-white">{safeText(risk.risk)}</h4>
                                </div>
                                <p className="text-xs text-slate-300 mb-2">{safeText(risk.detail)}</p>
                                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                    <span className="text-[10px] font-bold text-emerald-400 block mb-1">🛡️ Mitigación</span>
                                    <p className="text-xs text-emerald-200">{safeText(risk.mitigation)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════════
                    ROADMAP 30/60/90
                ══════════════════════════════════════════════════════════ */}
                <div className="bg-gradient-to-br from-indigo-950/50 to-slate-900 rounded-2xl border border-indigo-500/20 p-6 sm:p-8">
                    <SectionHeader icon={<Clock size={20} className="text-indigo-400" />} title="📅 Roadmap 30/60/90 Días" subtitle="Tu plan paso a paso. Los primeros 30 días enfocate en lo urgente. Los 60 en construir. Los 90 en escalar." />
                    <div className="space-y-4">
                        {(Array.isArray(result.roadmap) ? result.roadmap : (() => {
                            const rm = result.roadmap as any;
                            if (!rm || typeof rm !== 'object') return [];
                            return [
                                rm.days30 && { phase: '30 días', focus: rm.days30.focus || '', actions: Array.isArray(rm.days30.actions) ? rm.days30.actions : Array.isArray(rm.days30) ? rm.days30 : [], kpis: Array.isArray(rm.days30.kpis) ? rm.days30.kpis : [] },
                                rm.days60 && { phase: '60 días', focus: rm.days60.focus || '', actions: Array.isArray(rm.days60.actions) ? rm.days60.actions : Array.isArray(rm.days60) ? rm.days60 : [], kpis: Array.isArray(rm.days60.kpis) ? rm.days60.kpis : [] },
                                rm.days90 && { phase: '90 días', focus: rm.days90.focus || '', actions: Array.isArray(rm.days90.actions) ? rm.days90.actions : Array.isArray(rm.days90) ? rm.days90 : [], kpis: Array.isArray(rm.days90.kpis) ? rm.days90.kpis : [] },
                            ].filter(Boolean);
                        })()).map((phase: any, i: number) => {
                            const colors = ['from-emerald-500 to-teal-500', 'from-blue-500 to-indigo-500', 'from-violet-500 to-purple-500'];
                            const labels = ['30 días', '60 días', '90 días'];
                            return (
                                <div key={i} className="p-5 bg-white/5 rounded-xl border border-white/10">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${colors[i] || colors[0]} text-white text-sm font-bold shadow-sm`}>{labels[i] || safeText(phase.phase)}</div>
                                        <h4 className="text-sm font-bold text-white">{safeText(phase.focus)}</h4>
                                    </div>
                                    <ul className="space-y-1 mb-3">{(phase.actions || []).map((action: any, j: number) => <li key={j} className="flex items-start gap-2 text-xs text-slate-300"><CheckCircle2 size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />{safeText(action)}</li>)}</ul>
                                    {(phase.kpis || []).length > 0 && <div className="flex flex-wrap gap-1">{(phase.kpis || []).map((kpi: any, k: number) => <span key={k} className="px-2 py-1 bg-white/5 rounded-lg text-[10px] font-bold text-slate-400 border border-white/10">📊 {safeText(kpi)}</span>)}</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════════
                    HIGHLIGHTS SUMMARY (RESUMEN EJECUTIVO RÁPIDO)
                ══════════════════════════════════════════════════════════ */}
                <div className="mt-12 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-2xl border-2 border-indigo-400 p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-indigo-500 rounded-full mix-blend-multiply opacity-20 blur-2xl animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-purple-500 rounded-full mix-blend-multiply opacity-20 blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <Sparkles className="text-yellow-400 w-8 h-8" />
                            <h2 className="text-2xl font-black text-white tracking-tight">El Resumen (TL;DR)</h2>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Score Box */}
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 flex flex-col items-center justify-center text-center">
                                <span className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-2">Puntaje General</span>
                                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                                    {safeText(result.overallScore || result.digitalHealthGrade)}
                                </div>
                            </div>

                            {/* Top Finding */}
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 md:col-span-2">
                                <h3 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                                    <CheckCircle2 size={18} /> Mayor Fortaleza Detectada
                                </h3>
                                <p className="text-slate-200 text-sm leading-relaxed">
                                    {result.findings && result.findings.length > 0 
                                        ? safeText(result.findings.filter((f: any) => f.impact === 'high' || f.impact === 'positive')[0]?.finding || result.findings[0].finding)
                                        : "No se detectaron fortalezas claras."}
                                </p>
                                
                                <h3 className="text-red-400 font-bold mt-4 mb-3 flex items-center gap-2">
                                    <AlertTriangle size={18} /> Prioridad #1 a Resolver
                                </h3>
                                <p className="text-slate-200 text-sm leading-relaxed">
                                    {result.risks && result.risks.length > 0
                                        ? safeText(result.risks.filter((r: any) => r.severity === 'high')[0]?.risk || result.risks[0].risk)
                                        : "No se detectaron riesgos críticos inmediatos."}
                                </p>
                            </div>
                        </div>

                        {/* Top Opportunities */}
                        {result.opportunities && result.opportunities.length > 0 && (
                            <div className="mt-6 bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
                                <h3 className="text-indigo-300 font-bold mb-4 flex items-center gap-2">
                                    <TrendingUp size={18} /> El camino para crecer (Top 3 Oportunidades)
                                </h3>
                                <div className="space-y-3">
                                    {result.opportunities.slice(0, 3).map((opp: any, i: number) => (
                                        <div key={i} className="flex gap-3">
                                            <span className="text-indigo-400 font-black">{i + 1}.</span>
                                            <div>
                                                <span className="text-white font-bold text-sm block">{safeText(opp.title)}</span>
                                                <span className="text-slate-400 text-xs block">{safeText(opp.description)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── FEEDBACK + GLOSSARY ─────────────────────────────────── */}
                <div className="mt-8 print:hidden">
                    <FeedbackModal deepDiveId={reportId} reportType="digital_audit" userId={user!.id} lang={lang} />
                </div>

                <GlossaryModal lang={lang as any} />
            </main>
        </div>
    );
}
