import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import {
    Loader2, ArrowLeft, Globe, Shield, Search, Sparkles,
    BarChart3, TrendingUp, AlertTriangle, CheckCircle2,
    Download, Zap, Star, Clock, Target, Mail,
    ChevronDown, ChevronUp, ExternalLink, Bot,
    MessageCircle, Filter, Palette, Users, LayoutDashboard, Megaphone, UsersRound, ShoppingCart
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
const safeResult = (raw: any): DigitalAuditResult => {
    const r = raw || {};
    const wt = r.webTechnical || {};
    const seo = r.seoAnalysis || {};
    const ai = r.aiReadiness || {};
    const rep = r.reputationAnalysis || {};
    const email = r.emailCrmAssessment || {};
    const crawl = ai.aiCrawlerAccess || {};

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
    const [auditName, setAuditName] = useState('');

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
                    setResult(safeResult(data.audit_result));
                    setLoading(false);
                    return;
                }

                if (data.status === 'pending' || data.status === 'draft' || data.status === 'analyzing') {
                    setLoading(false);
                    setGenerating(true);

                    await supabase.from('digital_audits').update({ status: 'analyzing' }).eq('id', reportId);

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

                    setResult(safeResult(aiResult));
                    setGenerating(false);
                    return;
                }

                throw new Error(lang === 'es' ? 'La auditoría falló. Intentá de nuevo desde el Dashboard.' : 'Audit failed. Try again from the Dashboard.');

            } catch (err: any) {
                console.error(err);
                if (generating) {
                    try { await supabase.from('digital_audits').update({ status: 'failed' }).eq('id', reportId); } catch (_) { }
                }
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

    // ── MAIN REPORT ──────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
            <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Back + PDF */}
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate('/dashboard')} className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Volver al Dashboard
                    </button>
                    <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 bg-white text-slate-700 rounded-xl text-sm font-semibold border border-slate-200 hover:bg-slate-50 hover:shadow transition print:hidden">
                        <Download size={14} /> PDF
                    </button>
                </div>

                {/* ── HERO HEADER ──────────────────────────────────────────── */}
                <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full filter blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
                        <GradeBadge grade={safeText(result.digitalHealthGrade)} />
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-emerald-200 uppercase tracking-widest mb-3">
                                <Search size={14} />
                                Auditoría de Presencia Digital
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">{auditName}</h1>
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-4xl font-black text-emerald-300">{result.snapshot?.digitalMaturityScore ?? 'N/A'}/100</span>
                                <span className="text-emerald-200 text-base font-semibold">Puntuación de Madurez Digital</span>
                            </div>
                            {result.snapshot?.scoreExplanation && (
                                <p className="mt-4 text-emerald-100/90 text-base leading-relaxed bg-white/10 rounded-xl px-5 py-4 border border-white/10">
                                    {safeText(result.snapshot.scoreExplanation)}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── SCORE BREAKDOWN ──────────────────────────────────────── */}
                {result.snapshot?.scoreBreakdown && <RadarChart breakdown={result.snapshot.scoreBreakdown} />}

                {/* ── EXECUTIVE SUMMARY ────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                    <h3 className="font-black text-lg text-slate-900 mb-4 flex items-center gap-2">
                        <Sparkles size={20} className="text-emerald-500" />
                        Resumen Ejecutivo
                    </h3>
                    <div className="text-base text-slate-700 leading-relaxed font-medium">
                        <p className="whitespace-pre-line">{safeText(result.executiveSummary) || 'N/A'}</p>
                    </div>
                </div>

                {/* ── MONEY ON THE TABLE ───────────────────────────────────── */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
                    <h3 className="text-xl font-black mb-3 flex items-center gap-2">
                        💰 Plata Sobre la Mesa
                    </h3>
                    <div className="text-amber-100 leading-relaxed font-medium">
                        {Array.isArray(result.moneyOnTheTable) ? (
                            <ul className="list-disc list-inside space-y-2 text-base">
                                {result.moneyOnTheTable.map((item: any, i: number) => (
                                    <li key={i}>
                                        <strong className="text-white">{safeText(item.area)}:</strong> {safeText(item.description)}
                                        {item.estimatedLoss && <span className="ml-1 text-white opacity-90 font-bold">({safeText(item.estimatedLoss)})</span>}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="whitespace-pre-line text-base">{safeText(result.moneyOnTheTable) || 'N/A'}</p>
                        )}
                    </div>
                </div>

                {/* ── CRITICAL FINDINGS (heart of the report) ──────────────── */}
                {result.findings && result.findings.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-black text-slate-900">
                                🔍 Hallazgos Clave
                            </h2>
                            <span className="text-sm text-slate-500">
                                {result.findings.filter(f => f.severity === 'critical').length > 0 &&
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold mr-2">
                                        🔴 {result.findings.filter(f => f.severity === 'critical').length} críticos
                                    </span>
                                }
                                {result.findings.filter(f => f.severity === 'warning').length > 0 &&
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold mr-2">
                                        🟡 {result.findings.filter(f => f.severity === 'warning').length} a mejorar
                                    </span>
                                }
                                {result.findings.filter(f => f.severity === 'opportunity').length > 0 &&
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                        🟢 {result.findings.filter(f => f.severity === 'opportunity').length} oportunidades
                                    </span>
                                }
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 -mt-1 mb-4">
                            Estos son los problemas y oportunidades más importantes que encontramos. Cada uno incluye por qué importa, cuánto te puede costar, y qué hacer al respecto.
                        </p>
                        {result.findings
                            .sort((a, b) => {
                                const order = { critical: 0, warning: 1, opportunity: 2 };
                                return (order[a.severity] || 2) - (order[b.severity] || 2);
                            })
                            .map((finding, i) => {
                                const severityStyles = {
                                    critical: { border: 'border-red-300', bg: 'bg-red-50', icon: '🔴', label: 'CRÍTICO', labelBg: 'bg-red-100 text-red-700' },
                                    warning: { border: 'border-amber-300', bg: 'bg-amber-50', icon: '🟡', label: 'A MEJORAR', labelBg: 'bg-amber-100 text-amber-700' },
                                    opportunity: { border: 'border-emerald-300', bg: 'bg-emerald-50', icon: '🟢', label: 'OPORTUNIDAD', labelBg: 'bg-emerald-100 text-emerald-700' },
                                };
                                const style = severityStyles[finding.severity] || severityStyles.warning;
                                const effortLabels: Record<string, string> = {
                                    quick_fix: '⚡ Rápido (< 1 hora)',
                                    medium: '🔧 Medio (1-7 días)',
                                    major: '🏗️ Requiere especialista',
                                };
                                return (
                                    <div key={i} className={`rounded-2xl border-2 ${style.border} ${style.bg} p-5 sm:p-6 hover:shadow-md transition`}>
                                        <div className="flex items-start gap-3 mb-3">
                                            <span className="text-2xl mt-0.5">{style.icon}</span>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${style.labelBg}`}>{style.label}</span>
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-600">{(finding.area || 'General').replace(/_/g, ' ')}</span>
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white text-slate-500 border border-slate-200">{effortLabels[finding.effort] || finding.effort}</span>
                                                </div>
                                                <h4 className="text-lg font-bold text-slate-900">{finding.title}</h4>
                                            </div>
                                        </div>
                                        <div className="ml-10 space-y-3">
                                            <div>
                                                <p className="text-sm text-slate-700 leading-relaxed">{finding.diagnosis}</p>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="p-3 bg-white/80 rounded-xl">
                                                    <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                                                        💡 ¿Por qué importa?
                                                    </span>
                                                    <p className="text-sm text-slate-700">{finding.whyItMatters}</p>
                                                </div>
                                                <div className="p-3 bg-white/80 rounded-xl">
                                                    <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                                                        💰 Impacto estimado
                                                    </span>
                                                    <p className="text-sm font-bold text-slate-900">{finding.moneyImpact}</p>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-white/80 rounded-xl border border-slate-200">
                                                <span className="text-xs font-bold text-emerald-600 uppercase block mb-1">
                                                    🛠️ Cómo solucionarlo
                                                </span>
                                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{finding.fix}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}

                {/* ── COLLAPSIBLE SECTIONS ─────────────────────────────────── */}

                {/* Web Technical */}
                <CollapsibleSection title="🌐 Auditoría Web Técnica" icon={<Globe size={20} className="text-emerald-600" />} defaultOpen badge={<TrafficLight score={result.webTechnical.overallScore} />}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                            {[{ label: 'SSL', ok: result.webTechnical.ssl }, { label: 'Sitemap', ok: result.webTechnical.sitemap }, { label: 'robots.txt', ok: result.webTechnical.robotsTxt }].map((item, i) => (
                                <div key={i} className={`flex items-center gap-2 p-3 rounded-xl ${item.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} font-bold text-sm`}>
                                    {item.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />} {item.label}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-xl"><span className="text-xs font-bold text-slate-400 block mb-1">Page Speed</span><p className="font-bold text-slate-900">{result.webTechnical.pageSpeedScore}</p></div>
                            <div className="p-4 bg-slate-50 rounded-xl"><span className="text-xs font-bold text-slate-400 block mb-1">Mobile</span><p className="font-bold text-slate-900">{result.webTechnical.mobileReadiness}</p></div>
                        </div>
                        {result.webTechnical.detectedTools.length > 0 && (
                            <div><span className="text-xs font-bold text-slate-400 uppercase mb-2 block">Herramientas Detectadas</span>
                                <div className="flex flex-wrap gap-2">{result.webTechnical.detectedTools.map((t, i) => <span key={i} className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm font-medium text-slate-700">{t.name} — {t.status}</span>)}</div>
                            </div>
                        )}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200"><span className="text-xs font-bold text-slate-400 block mb-1">Conversión</span><p className="text-base text-slate-700">{safeText(result.webTechnical?.conversionReadyAudit?.details) || 'N/A'}</p></div>
                        <div className="p-4 bg-slate-50 rounded-xl"><span className="text-xs font-bold text-slate-400 block mb-1">Schema Markup</span><p className="text-sm text-slate-700">{result.webTechnical?.schemaMarkup?.recommendation || 'N/A'}</p></div>
                    </div>
                </CollapsibleSection>

                {/* SEO */}
                <CollapsibleSection title="🔍 SEO (Cómo te encuentra la gente en Google)" icon={<Search size={20} className="text-emerald-600" />} badge={<TrafficLight score={result.seoAnalysis.overallScore} />}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-xl"><span className="text-xs font-bold text-slate-400 block mb-1">Blog</span><p className="text-sm font-medium text-slate-700">{result.seoAnalysis?.blogStatus || 'N/A'}</p></div>
                            <div className="p-4 bg-slate-50 rounded-xl"><span className="text-xs font-bold text-slate-400 block mb-1">Meta Tags</span><p className="text-sm font-medium text-slate-700">{result.seoAnalysis?.metaTagsStatus || 'N/A'}</p></div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200"><span className="text-xs font-bold text-slate-400 block mb-1">Análisis de Keywords</span><p className="text-base text-slate-700">{safeText(result.seoAnalysis?.keywordGapAnalysis) || 'N/A'}</p></div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200"><span className="text-xs font-bold text-slate-400 block mb-1">Autoridad del Contenido</span><p className="text-base text-slate-700">{safeText(result.seoAnalysis?.contentAuthorityScore) || 'N/A'}</p></div>
                        {/* Product Naming Issues */}
                        {result.seoAnalysis.productNamingIssues && result.seoAnalysis.productNamingIssues.length > 0 && (
                            <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                                <span className="text-xs font-bold text-orange-600 block mb-3 uppercase">
                                    🏷️ Nombres de Productos con Problemas de SEO
                                </span>
                                <div className="space-y-2">
                                    {result.seoAnalysis.productNamingIssues.map((issue, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-100">
                                            <span className="text-red-500 font-bold text-sm mt-0.5">✗</span>
                                            <div className="flex-1">
                                                <p className="text-sm font-mono font-bold text-red-700">{issue.currentName}</p>
                                                <p className="text-xs text-slate-500 my-1">{issue.problem}</p>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-green-500 font-bold text-sm">→</span>
                                                    <p className="text-sm font-medium text-green-700">{issue.suggestedName}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {result.seoAnalysis?.localSeoCheck && <div className="p-4 bg-blue-50 rounded-xl border border-blue-200"><span className="text-xs font-bold text-blue-500 block mb-1">SEO Local</span><p className="text-base text-blue-900">{safeText(result.seoAnalysis.localSeoCheck?.localReviewSummary) || 'N/A'}</p></div>}
                    </div>
                </CollapsibleSection>

                {/* AI READINESS */}
                <CollapsibleSection title="🤖 SEO para IAs (AEO — Vanguardia)" icon={<Bot size={20} className="text-emerald-600" />} defaultOpen badge={<TrafficLight score={result.aiReadiness.overallScore} />}>
                    <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                            <p className="text-base text-emerald-900 leading-relaxed">{safeText(result.aiReadiness?.summary) || 'Análisis de AI-readiness no disponible.'}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { label: 'Datos Estructurados (Schema)', desc: 'Etiquetas invisibles que ayudan a las IAs', value: result.aiReadiness?.structuredData?.detected ? '🟢' : '🔴', detail: safeText(result.aiReadiness?.structuredData?.recommendation) },
                                { label: 'Contenido Q&A', desc: 'Respuestas directas para IAs', value: result.aiReadiness?.qaContent?.hasQaFormat ? '🟢' : '🔴', detail: safeText(result.aiReadiness?.qaContent?.recommendation) },
                                { label: 'llms.txt', desc: 'Manual para bots de IA', value: result.aiReadiness?.llmsTxt?.exists ? '🟢' : '🔴', detail: safeText(result.aiReadiness?.llmsTxt?.recommendation) },
                                { label: 'E-E-A-T', desc: 'Experiencia, autoridad, confianza', value: '📊', detail: safeText(result.aiReadiness?.eeatScore) },
                            ].map((item, i) => (
                                <div key={i} className="p-4 bg-white rounded-xl border border-slate-200">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg">{item.value}</span>
                                        <span className="text-sm font-bold text-slate-800">{item.label}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mb-2">{item.desc}</p>
                                    <p className="text-xs text-slate-600">{item.detail}</p>
                                </div>
                            ))}
                        </div>
                        {result.aiReadiness.aiCrawlerAccess.blocked.length > 0 && (
                            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                                <span className="text-xs font-bold text-red-600 block mb-1">⚠️ Bots de IA BLOQUEADOS</span>
                                <p className="text-sm text-red-800">{result.aiReadiness.aiCrawlerAccess.blocked.join(', ')}</p>
                                <p className="text-xs text-red-600 mt-1">{result.aiReadiness.aiCrawlerAccess.recommendation}</p>
                            </div>
                        )}
                    </div>
                </CollapsibleSection>

                {/* Social Media */}
                <CollapsibleSection title="📱 Redes Sociales" icon={<TrendingUp size={20} className="text-emerald-600" />} defaultOpen>
                    <div className="space-y-6">
                        {result.socialMediaAudit.map((channel: any, i: number) => (
                            <div key={i} className="rounded-2xl border-2 border-slate-200 bg-white overflow-hidden hover:shadow-md transition">
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
                                    <h4 className="font-black text-slate-900 text-xl">{safeText(channel.platform)}</h4>
                                    <TrafficLight score={channel.status} />
                                </div>
                                <div className="p-6 space-y-5">
                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div className="p-3 bg-slate-50 rounded-xl">
                                            <span className="text-xs text-slate-400 block mb-1">Seguidores</span>
                                            <span className="text-lg font-black text-slate-900">{safeText(channel.followers)}</span>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-xl">
                                            <span className="text-xs text-slate-400 block mb-1">Engagement</span>
                                            <span className="text-lg font-black text-slate-900">{safeText(channel.engagementRate)}</span>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-xl">
                                            <span className="text-xs text-slate-400 block mb-1">Frecuencia</span>
                                            <span className="text-lg font-black text-slate-900">{safeText(channel.postingFrequency)}</span>
                                        </div>
                                    </div>

                                    {/* Recommendation */}
                                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                        <span className="text-xs font-bold text-emerald-600 uppercase block mb-2">💡 Recomendación</span>
                                        <p className="text-base text-emerald-900 leading-relaxed">{safeText(channel.recommendation)}</p>
                                    </div>

                                    {/* Content Types Recommended */}
                                    {channel.contentTypesRecommended && Array.isArray(channel.contentTypesRecommended) && channel.contentTypesRecommended.length > 0 && (
                                        <div className="p-4 bg-violet-50 rounded-xl border border-violet-200">
                                            <span className="text-xs font-bold text-violet-600 uppercase block mb-3">🎬 Tipos de Contenido Recomendados</span>
                                            <div className="space-y-2">
                                                {channel.contentTypesRecommended.map((ct: any, j: number) => (
                                                    <div key={j} className="flex items-start gap-2">
                                                        <span className="text-violet-500 mt-1">▸</span>
                                                        <p className="text-base text-violet-900">{safeText(ct)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Content Pillars */}
                                    {channel.contentPillars && Array.isArray(channel.contentPillars) && channel.contentPillars.length > 0 && (
                                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                            <span className="text-xs font-bold text-blue-600 uppercase block mb-3">🏛️ Pilares de Contenido</span>
                                            <div className="flex flex-wrap gap-2">
                                                {channel.contentPillars.map((pillar: any, j: number) => (
                                                    <span key={j} className="px-4 py-2 bg-white rounded-lg text-sm font-semibold text-blue-800 border border-blue-200 shadow-sm">
                                                        {safeText(pillar)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Aesthetic Recommendation */}
                                    {channel.aestheticRecommendation && (
                                        <div className="p-4 bg-pink-50 rounded-xl border border-pink-200">
                                            <span className="text-xs font-bold text-pink-600 uppercase block mb-2">🎨 Estética Visual Recomendada</span>
                                            <p className="text-base text-pink-900 leading-relaxed">{safeText(channel.aestheticRecommendation)}</p>
                                        </div>
                                    )}

                                    {/* Posting Schedule */}
                                    {channel.postingSchedule && (
                                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                                            <span className="text-xs font-bold text-amber-600 uppercase block mb-2">📅 Calendario de Publicación</span>
                                            <p className="text-base text-amber-900 leading-relaxed font-medium">{safeText(channel.postingSchedule)}</p>
                                        </div>
                                    )}

                                    {/* Persona Cross Reference */}
                                    {channel.personaCrossRef && (
                                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                                            <span className="text-xs font-bold text-indigo-600 block mb-2">🎯 Conexión con tus Buyer Personas</span>
                                            <p className="text-base text-indigo-900">{safeText(channel.personaCrossRef)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>

                {/* Reputation */}
                <CollapsibleSection title="⭐ Reputación Online" icon={<Star size={20} className="text-emerald-600" />} badge={<TrafficLight score={result.reputationAnalysis?.overallSentiment ?? result.reputationAnalysis?.overallScore ?? 0} />}>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-5 bg-amber-50 rounded-xl border border-amber-200">
                            <span className="text-4xl">⭐</span>
                            <div>
                                <p className="font-black text-3xl text-slate-900">{safeText(result.reputationAnalysis?.googleReviews?.rating ?? result.reputationAnalysis?.googleRating ?? 'N/A')}</p>
                                <p className="text-base text-slate-600">{safeText(result.reputationAnalysis?.googleReviews?.count ?? result.reputationAnalysis?.googleReviewCount ?? '?')} reseñas — {safeText(result.reputationAnalysis?.googleReviews?.trend)}</p>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200"><span className="text-xs font-bold text-slate-400 block mb-2">Tasa de Respuesta a Reseñas</span><p className="font-bold text-lg text-slate-900">{safeText(result.reputationAnalysis?.responseRate) || 'N/A'}</p></div>
                    </div>
                </CollapsibleSection>

                {/* Competitors */}
                <CollapsibleSection title="🎯 Benchmark vs Competidores" icon={<Target size={20} className="text-emerald-600" />} defaultOpen>
                    <div className="space-y-5">
                        {result.competitorBenchmark.map((comp: any, i: number) => (
                            <div key={i} className="rounded-2xl border-2 border-slate-200 bg-white overflow-hidden hover:shadow-md transition">
                                <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
                                    <h4 className="font-black text-lg text-slate-900">{safeText(comp.competitorName)}</h4>
                                    {comp.website && <a href={typeof comp.website === 'string' && comp.website.startsWith('http') ? comp.website : `https://${comp.website}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 text-sm hover:underline flex items-center gap-1"><ExternalLink size={14} /> Web</a>}
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                                        <span className="text-xs font-bold text-red-600 uppercase block mb-2">❌ Qué hacen mejor que vos</span>
                                        <p className="text-base text-red-900 leading-relaxed">{safeText(comp.whatTheyDoBetter)}</p>
                                    </div>
                                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                        <span className="text-xs font-bold text-emerald-600 uppercase block mb-2">✅ Qué hacés mejor vos</span>
                                        <p className="text-base text-emerald-900 leading-relaxed">{safeText(comp.whatClientDoesBetter)}</p>
                                    </div>
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                        <span className="text-xs font-bold text-blue-600 uppercase block mb-2">📊 Diferencia en Estrategia de Contenido</span>
                                        <p className="text-base text-blue-900 leading-relaxed">{safeText(comp.contentStrategyGap)}</p>
                                    </div>
                                    <div className="p-4 bg-violet-50 rounded-xl border border-violet-200">
                                        <span className="text-xs font-bold text-violet-600 uppercase block mb-2">💡 Qué podés copiar / aprender</span>
                                        <p className="text-base text-violet-900 leading-relaxed font-medium">{safeText(comp.keyTakeaway)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>

                {/* Industry Leaders / Referentes */}
                {result.industryLeaders && result.industryLeaders.length > 0 && (
                    <CollapsibleSection title="🏆 Referentes del Rubro" icon={<Star size={20} className="text-emerald-600" />} defaultOpen>
                        <div className="space-y-5">
                            <p className="text-base text-slate-600 -mt-2 mb-2">
                                Estos son los referentes más destacados de tu rubro. Estudiá sus estrategias para inspirarte y encontrar oportunidades.
                            </p>
                            {result.industryLeaders.map((leader: any, i: number) => (
                                <div key={i} className="bg-gradient-to-br from-slate-50 to-emerald-50/30 rounded-2xl border-2 border-slate-200 p-6 hover:shadow-md transition">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h4 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                                <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-sm">{i + 1}</span>
                                                {safeText(leader.name)}
                                            </h4>
                                            <span className="text-sm text-slate-400 uppercase tracking-wider font-bold mt-0.5 block">{safeText(leader.platform)}</span>
                                        </div>
                                        {leader.profileUrl && (
                                            <a href={typeof leader.profileUrl === 'string' && leader.profileUrl.startsWith('http') ? leader.profileUrl : `https://${leader.profileUrl}`} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-sm text-emerald-600 font-semibold hover:underline px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                                                <ExternalLink size={14} /> Ver perfil
                                            </a>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="p-3 bg-white rounded-xl text-center border border-slate-100">
                                            <span className="text-xs text-slate-400 block">Seguidores</span>
                                            <span className="text-xl font-black text-slate-900">{safeText(leader.followers)}</span>
                                        </div>
                                        <div className="p-3 bg-white rounded-xl text-center border border-slate-100">
                                            <span className="text-xs text-slate-400 block">Tasa de Engagement</span>
                                            <span className="text-xl font-black text-emerald-600">{safeText(leader.engagementRate)}</span>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white rounded-xl mb-4 border border-slate-100">
                                        <span className="text-xs font-bold text-slate-400 uppercase block mb-2">Estrategia que aplica</span>
                                        <p className="text-base text-slate-700 leading-relaxed">{safeText(leader.strategy)}</p>
                                    </div>
                                    {leader.topPosts && Array.isArray(leader.topPosts) && leader.topPosts.length > 0 && (
                                        <div className="mb-4">
                                            <span className="text-xs font-bold text-slate-400 uppercase block mb-2">Publicaciones más virales</span>
                                            <div className="space-y-2">
                                                {leader.topPosts.map((post: any, j: number) => (
                                                    <div key={j} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:border-emerald-200 transition">
                                                        <span className="text-lg">🔥</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-base text-slate-700">{safeText(post.description)}</p>
                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                <span className="text-sm text-emerald-600 font-bold">{safeText(post.engagement)}</span>
                                                                {typeof post.url === 'string' && post.url && (
                                                                    <a href={post.url.startsWith('http') ? post.url : `https://${post.url}`} target="_blank" rel="noopener noreferrer"
                                                                        className="text-sm text-indigo-500 hover:underline flex items-center gap-1">
                                                                        <ExternalLink size={12} /> Ver publicación
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                        <span className="text-xs font-bold text-emerald-600 uppercase block mb-2">
                                            💡 Qué podés aprender / aplicar
                                        </span>
                                        <p className="text-base text-emerald-900 font-medium leading-relaxed">{safeText(leader.lessonsForUser)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CollapsibleSection>
                )}

                {/* Email & CRM */}
                <CollapsibleSection title="📧 Email Marketing & CRM" icon={<Mail size={20} className="text-emerald-600" />} badge={<TrafficLight score={result.emailCrmAssessment.leadNurturingScore} />}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className={`p-4 rounded-xl ${result.emailCrmAssessment.hasEmailCapture ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'} font-bold text-base`}>
                                {result.emailCrmAssessment.hasEmailCapture ? <CheckCircle2 size={16} className="inline mr-2" /> : <AlertTriangle size={16} className="inline mr-2" />}
                                Captura de Email
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200"><span className="text-xs text-slate-400 block mb-1">Plataforma</span><span className="font-bold text-lg text-slate-900">{safeText(result.emailCrmAssessment.emailPlatformDetected) || 'N/A'}</span></div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200"><span className="text-xs font-bold text-slate-400 block mb-2">Madurez CRM</span><p className="text-base text-slate-700">{safeText(result.emailCrmAssessment.crmMaturity)}</p></div>
                        {result.emailCrmAssessment.recommendations.length > 0 && (
                            <ul className="space-y-2">
                                {result.emailCrmAssessment.recommendations.map((r: any, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-base text-slate-700">
                                        <CheckCircle2 size={16} className="text-emerald-500 mt-1 flex-shrink-0" />
                                        <span>{safeText(r)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </CollapsibleSection>

                {/* ── VISUAL IDENTITY (NEW) ───────────────────────────────── */}
                {result.visualIdentityAudit && safeText(result.visualIdentityAudit.overallScore) && (
                    <CollapsibleSection title="🎨 Identidad Visual Digital" icon={<Sparkles size={20} className="text-emerald-600" />} defaultOpen>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { label: 'Nivel General', value: result.visualIdentityAudit.overallScore },
                                    { label: 'Consistencia de Marca', value: result.visualIdentityAudit.brandConsistency },
                                    { label: 'Calidad de Fotos', value: result.visualIdentityAudit.photoQuality },
                                    { label: 'Estética del Feed', value: result.visualIdentityAudit.feedAesthetic },
                                ].map((item, i) => (
                                    <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                        <span className="text-xs text-slate-400 block mb-1">{item.label}</span>
                                        <span className="text-base font-black text-slate-900">{safeText(item.value) || 'N/A'}</span>
                                    </div>
                                ))}
                            </div>
                            {Array.isArray(result.visualIdentityAudit.recommendations) && result.visualIdentityAudit.recommendations.length > 0 && (
                                <div className="p-5 bg-pink-50 rounded-xl border border-pink-200">
                                    <span className="text-xs font-bold text-pink-600 uppercase block mb-3">🎯 Recomendaciones de Mejora Visual</span>
                                    <div className="space-y-2">
                                        {result.visualIdentityAudit.recommendations.map((rec: any, i: number) => (
                                            <div key={i} className="flex items-start gap-2">
                                                <span className="text-pink-500 mt-1">▸</span>
                                                <p className="text-base text-pink-900">{safeText(rec)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                )}

                {/* ── CUSTOMER PERCEPTION (NEW) ──────────────────────────── */}
                {result.customerPerception && safeText(result.customerPerception.currentImage) && (
                    <CollapsibleSection title="👁️ Cómo te Ven tus Clientes" icon={<TrendingUp size={20} className="text-emerald-600" />} defaultOpen>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-5 bg-amber-50 rounded-xl border border-amber-200">
                                    <span className="text-xs font-bold text-amber-600 uppercase block mb-2">😐 Imagen Actual</span>
                                    <p className="text-base text-amber-900 leading-relaxed">{safeText(result.customerPerception.currentImage)}</p>
                                </div>
                                <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-200">
                                    <span className="text-xs font-bold text-emerald-600 uppercase block mb-2">🌟 Imagen Ideal</span>
                                    <p className="text-base text-emerald-900 leading-relaxed">{safeText(result.customerPerception.idealImage)}</p>
                                </div>
                            </div>
                            {Array.isArray(result.customerPerception.gaps) && result.customerPerception.gaps.length > 0 && (
                                <div className="p-5 bg-red-50 rounded-xl border border-red-200">
                                    <span className="text-xs font-bold text-red-600 uppercase block mb-3">⚠️ Brechas de Percepción</span>
                                    {result.customerPerception.gaps.map((gap: any, i: number) => (
                                        <div key={i} className="flex items-start gap-2 mb-2">
                                            <span className="text-red-500 mt-1">▸</span>
                                            <p className="text-base text-red-900">{safeText(gap)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {Array.isArray(result.customerPerception.quickWins) && result.customerPerception.quickWins.length > 0 && (
                                <div className="p-5 bg-blue-50 rounded-xl border border-blue-200">
                                    <span className="text-xs font-bold text-blue-600 uppercase block mb-3">⚡ Victorias Rápidas</span>
                                    {result.customerPerception.quickWins.map((win: any, i: number) => (
                                        <div key={i} className="flex items-start gap-2 mb-2">
                                            <span className="text-blue-500 mt-1">▸</span>
                                            <p className="text-base text-blue-900">{safeText(win)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                )}

                {/* 1. Social Proof */}
                {result.socialProof && (
                    <CollapsibleSection title="💬 Prueba Social (Social Proof)" icon={<MessageCircle size={20} className="text-emerald-600" />}>
                        <div className="space-y-4 text-slate-700 leading-relaxed text-base">
                            <div className="flex gap-4">
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center flex-1">
                                    <p className="text-sm font-bold text-emerald-600 uppercase mb-1">Confianza Global</p>
                                    <p className="text-2xl font-black text-slate-900">{safeText(result.socialProof.trustScore)}/100</p>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-center flex-1">
                                    <p className="text-sm font-bold text-blue-600 uppercase mb-1">Sentimiento</p>
                                    <p className="text-xl font-bold text-slate-900"><TrafficLight score={result.socialProof.overallSentiment} /></p>
                                </div>
                            </div>
                            
                            {result.socialProof.googleReviewsAnalysis && (
                                <div className="p-5 bg-white rounded-xl border-2 border-slate-200">
                                    <h4 className="font-bold text-lg text-slate-900 mb-3">Google Maps Reviews</h4>
                                    <div className="flex gap-4 mb-4">
                                        <div className="bg-slate-50 p-3 rounded-lg flex-1"><p className="text-sm text-slate-500">Rating Promedio</p><p className="font-bold text-lg text-slate-900">⭐ {safeText(result.socialProof.googleReviewsAnalysis.averageRating)}</p></div>
                                        <div className="bg-slate-50 p-3 rounded-lg flex-1"><p className="text-sm text-slate-500">Total Reseñas</p><p className="font-bold text-lg text-slate-900">{safeText(result.socialProof.googleReviewsAnalysis.totalReviews)}</p></div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                                            <p className="text-xs font-bold text-green-700 uppercase mb-2">✅ Destacan</p>
                                            <ul className="mb-3 space-y-1">{result.socialProof.googleReviewsAnalysis.positiveThemes?.map((t: string, i: number) => <li key={i} className="text-sm text-green-900">• {safeText(t)}</li>)}</ul>
                                            <p className="text-sm italic text-green-800 bg-white p-2 rounded-lg">"{safeText(result.socialProof.googleReviewsAnalysis.samplePositive)}"</p>
                                        </div>
                                        <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                                            <p className="text-xs font-bold text-red-700 uppercase mb-2">❌ Se quejan de</p>
                                            <ul className="mb-3 space-y-1">{result.socialProof.googleReviewsAnalysis.negativeThemes?.map((t: string, i: number) => <li key={i} className="text-sm text-red-900">• {safeText(t)}</li>)}</ul>
                                            <p className="text-sm italic text-red-800 bg-white p-2 rounded-lg">"{safeText(result.socialProof.googleReviewsAnalysis.sampleNegative)}"</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {Array.isArray(result.socialProof.socialMentions) && result.socialProof.socialMentions.length > 0 && (
                                <div className="p-5 bg-white rounded-xl border-2 border-slate-200">
                                    <h4 className="font-bold text-lg text-slate-900 mb-3">Menciones Destacadas en Redes</h4>
                                    <div className="space-y-3">
                                        {result.socialProof.socialMentions.map((m: any, i: number) => (
                                            <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-bold text-sm text-indigo-700">{safeText(m.platform)}</span>
                                                    <TrafficLight score={m.sentiment} />
                                                </div>
                                                <p className="italic text-slate-800 font-medium bg-white p-3 rounded-lg border border-slate-200">"{safeText(m.topComment)}"</p>
                                                <p className="text-xs text-slate-500 mt-2">Contexto: {safeText(m.context)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {Array.isArray(result.socialProof.recommendations) && (
                                <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-200">
                                    <span className="text-xs font-bold text-emerald-600 uppercase block mb-3">💡 Recomendaciones de Social Proof</span>
                                    {result.socialProof.recommendations.map((r: string, i: number) => (
                                        <div key={i} className="flex gap-2 mb-2"><span className="text-emerald-500">▸</span><p className="text-emerald-900">{safeText(r)}</p></div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                )}

                {/* 2. Funnel Analysis */}
                {result.funnelAnalysis && (
                    <CollapsibleSection title="🔎 Funnel de Ventas" icon={<Filter size={20} className="text-emerald-600" />}>
                        <div className="space-y-4 text-slate-700 leading-relaxed text-base">
                            <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 opacity-10 rounded-full blur-3xl translate-x-10 -translate-y-10"></div>
                                <h4 className="font-black text-xl mb-4 text-emerald-400">🚨 Fuga Principal Identificada</h4>
                                <p className="text-lg font-medium">{safeText(result.funnelAnalysis.biggestLeak)}</p>
                            </div>

                            <div className="space-y-3 relative before:absolute before:inset-0 before:left-[19px] before:w-1 before:bg-slate-200 pl-4 py-2">
                                {result.funnelAnalysis.stages?.map((stage: any, i: number) => (
                                    <div key={i} className="relative bg-white p-5 rounded-xl border-2 border-slate-200 ml-6 shadow-sm">
                                        <div className="absolute -left-[45px] top-5 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm border-4 border-white z-10">{i+1}</div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-lg text-slate-900 uppercase">{safeText(stage.stage)}</h4>
                                            <div className="flex gap-1 flex-wrap justify-end max-w-[50%]">{stage.channels?.map((c: string, j: number) => <span key={j} className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg">{safeText(c)}</span>)}</div>
                                        </div>
                                        <p className="text-sm text-slate-700 mb-3 bg-slate-50 p-2 rounded-lg"><strong>Estado actual:</strong> {safeText(stage.currentState)}</p>
                                        <div className="bg-red-50 p-3 rounded-xl border border-red-100 mb-2">
                                            <p className="text-xs font-bold text-red-600 uppercase mb-1">❌ Bottleneck</p>
                                            <p className="text-sm text-red-900">{safeText(stage.bottleneck)}</p>
                                        </div>
                                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                                            <p className="text-xs font-bold text-emerald-600 uppercase mb-1">✅ Fix Propuesto</p>
                                            <p className="text-sm text-emerald-900 font-medium">{safeText(stage.fix)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <span className="text-xs font-bold text-slate-500 uppercase block mb-2">🛣️ Rutas de Conversión Comunes</span>
                                {result.funnelAnalysis.conversionPaths?.map((path: string, i: number) => (
                                    <div key={i} className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-700 bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-100 uppercase tracking-tight">👉 {safeText(path).split('→').map((p, k, arr) => <React.Fragment key={k}><span className={k === arr.length - 1 ? 'text-emerald-600 font-bold' : ''}>{p.trim()}</span>{k < arr.length - 1 && <span className="text-slate-300 mx-1">→</span>}</React.Fragment>)}</div>
                                ))}
                            </div>
                        </div>
                    </CollapsibleSection>
                )}

                {/* 3. Content Identity */}
                {result.contentIdentityAudit && (
                    <CollapsibleSection title="🎭 Identidad de Contenido" icon={<Palette size={20} className="text-emerald-600" />}>
                        <div className="space-y-4 text-slate-700 leading-relaxed text-base">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-white border-2 border-slate-200 rounded-xl text-center shadow-sm">
                                    <p className="text-sm font-bold text-slate-500 uppercase mb-1">Calidad Visual</p>
                                    <div className="text-3xl font-black text-indigo-600">{safeText(result.contentIdentityAudit.visualScore)}<span className="text-lg text-slate-400 font-medium">/10</span></div>
                                </div>
                                <div className={`p-5 border-2 rounded-xl text-center shadow-sm flex flex-col justify-center ${result.contentIdentityAudit.isTransactionalOnly ? 'bg-red-50 border-red-200 text-red-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
                                    <p className="text-sm font-bold uppercase mb-1 opacity-80">Perfil</p>
                                    <p className="font-black leading-tight">{result.contentIdentityAudit.isTransactionalOnly ? 'SÓLO CATÁLOGO / OFERTAS ❌' : 'BALANCE SALUDABLE ✅'}</p>
                                </div>
                            </div>
                            
                            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-slate-700">Voz y Tono:</span>
                                    <span className="bg-white px-3 py-1 rounded-lg border border-slate-200 font-medium italic text-indigo-700">{safeText(result.contentIdentityAudit.toneOfVoice)}</span>
                                </div>
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
                                    <span className="font-bold text-slate-700">Consistencia Visual:</span>
                                    <span className="text-sm text-slate-600 text-right w-2/3">{safeText(result.contentIdentityAudit.brandConsistency)}</span>
                                </div>
                            </div>

                            {Array.isArray(result.contentIdentityAudit.contentMix) && (
                                <div className="p-5 bg-white border-2 border-slate-200 rounded-xl">
                                    <h4 className="font-bold text-sm text-slate-500 uppercase mb-4">Content Mix Actual (Estimado)</h4>
                                    <div className="space-y-3">
                                        {result.contentIdentityAudit.contentMix.map((mix: any, i: number) => {
                                            const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-slate-500'];
                                            const color = colors[i % colors.length];
                                            const numStr = safeText(mix.percentage).replace(/[^0-9]/g, '');
                                            const width = numStr ? Math.min(100, Math.max(5, parseInt(numStr))) : 20;
                                            return (
                                                <div key={i}>
                                                    <div className="flex justify-between text-sm font-bold mb-1"><span>{safeText(mix.type)}</span><span className="text-slate-500">{safeText(mix.percentage)}</span></div>
                                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${color} rounded-full`} style={{ width: `${width}%` }}></div></div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                                        <p className="text-sm font-bold text-slate-500 uppercase">Ratio Valor / Venta</p>
                                        <p className="text-lg font-black text-indigo-600">{safeText(result.contentIdentityAudit.valueContentRatio)}</p>
                                    </div>
                                </div>
                            )}

                            {Array.isArray(result.contentIdentityAudit.recommendations) && (
                                <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-200">
                                    <span className="text-xs font-bold text-emerald-600 uppercase block mb-3">💡 Action Items - Identidad</span>
                                    {result.contentIdentityAudit.recommendations.map((r: string, i: number) => (
                                        <div key={i} className="flex gap-2 mb-2"><span className="text-emerald-500">▸</span><p className="text-emerald-900">{safeText(r)}</p></div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                )}

                {/* 4. Competitor Comparison */}
                {result.competitorComparison && (
                    <CollapsibleSection title="🥊 Comparativa de Competidores" icon={<Users size={20} className="text-emerald-600" />}>
                        <div className="space-y-6 text-slate-700 leading-relaxed text-base">
                            {result.competitorComparison.platforms?.map((plat: any, i: number) => (
                                <div key={i} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="bg-slate-50 px-5 py-4 border-b border-slate-200">
                                        <h4 className="font-black text-lg text-slate-900">{safeText(plat.platform)}</h4>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 text-slate-500 uppercase text-xs">
                                                    <th className="px-5 py-3 font-bold">Perfil</th>
                                                    <th className="px-5 py-3 font-bold">Seguidores</th>
                                                    <th className="px-5 py-3 font-bold">Engagement</th>
                                                    <th className="px-5 py-3 font-bold">Frecuencia</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                <tr className="bg-emerald-50/50 hover:bg-emerald-50 transition">
                                                    <td className="px-5 py-4 font-bold text-emerald-800 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>TU NEGOCIO</td>
                                                    <td className="px-5 py-4 font-bold text-slate-900">{safeText(plat.userMetrics?.followers)}</td>
                                                    <td className="px-5 py-4 font-bold text-slate-900">{safeText(plat.userMetrics?.engagement)}</td>
                                                    <td className="px-5 py-4 text-slate-600">{safeText(plat.userMetrics?.postFreq)}</td>
                                                </tr>
                                                {plat.competitors?.map((comp: any, j: number) => (
                                                    <tr key={j} className="hover:bg-slate-50 transition">
                                                        <td className="px-5 py-4 font-bold text-slate-700">{safeText(comp.name)}</td>
                                                        <td className="px-5 py-4 font-medium text-slate-600">{safeText(comp.followers)}</td>
                                                        <td className="px-5 py-4 font-medium text-slate-600">{safeText(comp.engagement)}</td>
                                                        <td className="px-5 py-4 text-slate-600">{safeText(comp.postFreq)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CollapsibleSection>
                )}

                {/* 5. Channel Strategies */}
                {Array.isArray(result.channelStrategies) && result.channelStrategies.length > 0 && (
                    <CollapsibleSection title="📈 Estrategias por Canal" icon={<LayoutDashboard size={20} className="text-emerald-600" />}>
                        <div className="space-y-6">
                            {result.channelStrategies.map((strat: any, i: number) => (
                                <div key={i} className="rounded-2xl border-2 border-slate-200 bg-white overflow-hidden shadow-sm">
                                    <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
                                        <h4 className="font-black text-indigo-900 text-xl">{safeText(strat.platform)}</h4>
                                    </div>
                                    <div className="p-6 space-y-5">
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                            <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Estado Actual</span>
                                            <p className="text-slate-700 italic">{safeText(strat.currentState)}</p>
                                        </div>
                                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                                            <span className="text-xs font-bold text-emerald-600 uppercase block mb-2">🎯 Estrategia Recomendada</span>
                                            <p className="text-emerald-900 font-medium leading-relaxed">{safeText(strat.strategy)}</p>
                                        </div>
                                        
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="bg-white border border-slate-200 p-4 rounded-xl">
                                                <span className="text-xs font-bold text-slate-500 uppercase block mb-2">Tipos de Contenido</span>
                                                <ul className="space-y-1">
                                                    {strat.contentTypes?.map((ct: string, j: number) => <li key={j} className="text-sm text-slate-700 flex gap-2"><span className="text-indigo-500">•</span> {safeText(ct)}</li>)}
                                                </ul>
                                            </div>
                                            <div className="bg-white border border-slate-200 p-4 rounded-xl">
                                                <span className="text-xs font-bold text-slate-500 uppercase block mb-2">Frecuencia & Presupuesto</span>
                                                <p className="text-sm text-slate-700 mb-2"><strong>Frecuencia:</strong> {safeText(strat.postingSchedule)}</p>
                                                <p className="text-sm text-slate-700 mb-2"><strong>Presupuesto Sugerido:</strong> <span className="text-emerald-600 font-bold">{safeText(strat.budgetSuggestion)}</span></p>
                                                <p className="text-sm text-slate-700"><strong>Resultados:</strong> {safeText(strat.expectedResults)}</p>
                                            </div>
                                        </div>

                                        {Array.isArray(strat.kpis) && strat.kpis.length > 0 && (
                                            <div className="bg-slate-900 text-white p-5 rounded-xl">
                                                <span className="text-xs font-bold text-slate-400 uppercase block mb-3">📊 KPIs a medir (Proyección)</span>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                    {strat.kpis.map((kpi: any, j: number) => (
                                                        <div key={j} className="text-center">
                                                            <p className="text-xs font-bold text-slate-400 mb-1 leading-tight">{safeText(kpi.metric)}</p>
                                                            <p className="text-slate-500 text-xs line-through mb-0.5">{safeText(kpi.current)}</p>
                                                            <p className="text-emerald-400 font-black mb-0.5">{safeText(kpi.target30d)} <span className="text-[10px] text-slate-400 font-normal">30d</span></p>
                                                            <p className="text-emerald-500 font-black">{safeText(kpi.target90d)} <span className="text-[10px] text-slate-400 font-normal">90d</span></p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CollapsibleSection>
                )}

                {/* 6. Ad Strategy */}
                {result.adStrategy && (
                    <CollapsibleSection title="🎯 Estrategia Publicitaria (Ads)" icon={<Megaphone size={20} className="text-emerald-600" />}>
                        <div className="space-y-4 text-slate-700 leading-relaxed text-base">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl">
                                    <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Inversión Actual / Competencia</span>
                                    <p className="text-sm text-slate-700 mb-2"><strong>Actual:</strong> {safeText(result.adStrategy.currentAdSpend)}</p>
                                    <p className="text-sm text-slate-700"><strong>Competencia:</strong> {safeText(result.adStrategy.competitorAdActivity)}</p>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl">
                                    <span className="text-xs font-bold text-emerald-600 uppercase block mb-1">Recomendación General</span>
                                    <p className="text-sm text-emerald-900 mb-2"><strong>Presupuesto:</strong> {safeText(result.adStrategy.recommendedBudget)}</p>
                                    <p className="text-sm text-emerald-900"><strong>Plataformas:</strong> {(result.adStrategy.recommendedPlatforms || []).map(safeText).join(', ')}</p>
                                </div>
                            </div>
                            
                            {Array.isArray(result.adStrategy.adTypes) && result.adStrategy.adTypes.length > 0 && (
                                <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden mt-4">
                                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                                        <h4 className="font-bold text-slate-900">Estructura de Campañas (Playbook)</h4>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {result.adStrategy.adTypes.map((ad: any, i: number) => (
                                            <div key={i} className="p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center hover:bg-slate-50">
                                                <div className="flex-1">
                                                    <p className="font-bold text-indigo-700">{safeText(ad.type)}</p>
                                                    <p className="text-sm text-slate-600">{safeText(ad.why)}</p>
                                                </div>
                                                <div className="whitespace-nowrap px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 shadow-sm">
                                                    Presupuesto: {safeText(ad.budget)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                )}

                {/* 7. Influencer Strategy */}
                {result.influencerStrategy && (
                    <CollapsibleSection title="🤝 Marketing con Creadores (Influencers)" icon={<UsersRound size={20} className="text-emerald-600" />}>
                        <div className="space-y-4 text-slate-700 leading-relaxed text-base">
                            <div className="flex flex-col md:flex-row gap-4 mb-4">
                                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex-1 text-center">
                                    <span className="text-xs font-bold text-indigo-600 uppercase block mb-1">Tier Recomendado</span>
                                    <p className="font-bold text-lg text-indigo-900">{safeText(result.influencerStrategy.recommendedTier)}</p>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex-1 text-center">
                                    <span className="text-xs font-bold text-emerald-600 uppercase block mb-1">Costo Estimado</span>
                                    <p className="font-bold text-lg text-emerald-900">{safeText(result.influencerStrategy.estimatedCost)}</p>
                                </div>
                            </div>

                            {Array.isArray(result.influencerStrategy.suggestedProfiles) && result.influencerStrategy.suggestedProfiles.length > 0 && (
                                <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                                        <h4 className="font-bold text-slate-900">Perfiles Estructurales Ideales (Ejemplos)</h4>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="bg-white text-slate-500 uppercase text-xs border-b border-slate-100">
                                                    <th className="px-4 py-3 font-bold">Tipo/Nombre</th>
                                                    <th className="px-4 py-3 font-bold">Plataforma/Fol.</th>
                                                    <th className="px-4 py-3 font-bold">Nicho</th>
                                                    <th className="px-4 py-3 font-bold">Por qué sumaría</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {result.influencerStrategy.suggestedProfiles.map((prof: any, j: number) => (
                                                    <tr key={j} className="hover:bg-slate-50">
                                                        <td className="px-4 py-3 font-bold text-slate-900">{safeText(prof.name)}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-col"><span className="font-medium">{safeText(prof.platform)}</span><span className="text-xs text-slate-500">{safeText(prof.followers)}</span></div>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-600">{safeText(prof.niche)}</td>
                                                        <td className="px-4 py-3 text-slate-600">{safeText(prof.whyRelevant)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {Array.isArray(result.influencerStrategy.collaborationIdeas) && result.influencerStrategy.collaborationIdeas.length > 0 && (
                                <div className="p-5 bg-violet-50 rounded-xl border border-violet-200">
                                    <span className="text-xs font-bold text-violet-600 uppercase block mb-3">🎬 Ideas Clave de Colaboración</span>
                                    <ul className="space-y-2">
                                        {result.influencerStrategy.collaborationIdeas.map((idea: string, i: number) => (
                                            <li key={i} className="flex gap-2"><span className="text-violet-500">▸</span><p className="text-violet-900">{safeText(idea)}</p></li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                )}

                {/* 8. Marketplace Analysis */}
                {result.marketplaceAnalysis && (
                    <CollapsibleSection title="🛒 Análisis de Marketplace (MercadoLibre)" icon={<ShoppingCart size={20} className="text-emerald-600" />}>
                        <div className="space-y-4 text-slate-700 leading-relaxed text-base">
                            <div className="bg-yellow-50 border border-yellow-200 p-5 rounded-xl">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-black text-yellow-800 text-lg">{safeText(result.marketplaceAnalysis.platform)}</span>
                                </div>
                                <p className="text-yellow-900 font-medium">{safeText(result.marketplaceAnalysis.currentPresence)}</p>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Pricing Competitivo</span>
                                <p className="text-slate-700">{safeText(result.marketplaceAnalysis.competitorPricing)}</p>
                            </div>

                            {Array.isArray(result.marketplaceAnalysis.topProducts) && result.marketplaceAnalysis.topProducts.length > 0 && (
                                <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                                        <h4 className="font-bold text-slate-900">Productos/Ofertas Destacados</h4>
                                    </div>
                                    <ul className="divide-y divide-slate-100">
                                        {result.marketplaceAnalysis.topProducts.map((prod: any, i: number) => (
                                            <li key={i} className="p-4 flex justify-between items-center hover:bg-slate-50">
                                                <span className="font-medium text-slate-800">{safeText(prod.title)}</span>
                                                <div className="text-right ml-4 flex-shrink-0">
                                                    <p className="font-black text-emerald-600">{safeText(prod.price)}</p>
                                                    <p className="text-xs text-slate-500">Vendidos: {safeText(prod.soldQty)}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {Array.isArray(result.marketplaceAnalysis.recommendations) && result.marketplaceAnalysis.recommendations.length > 0 && (
                                <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-200 mt-4">
                                    <span className="text-xs font-bold text-emerald-600 uppercase block mb-3">💡 Optimización de Marketplace</span>
                                    {result.marketplaceAnalysis.recommendations.map((r: string, i: number) => (
                                        <div key={i} className="flex gap-2 mb-2"><span className="text-emerald-500">▸</span><p className="text-emerald-900">{safeText(r)}</p></div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                )}

                {/* Opportunities */}
                <CollapsibleSection title="🚀 Plan de Acción Priorizado" icon={<Zap size={20} className="text-emerald-600" />} defaultOpen>
                    <div className="space-y-3">
                        {result.opportunities.map((opp: any, i: number) => {
                            const catColors: Record<string, string> = {
                                'Victoria Rápida': 'bg-green-100 text-green-700 border-green-200',
                                'Quick Win': 'bg-green-100 text-green-700 border-green-200',
                                'Inversión Estratégica': 'bg-blue-100 text-blue-700 border-blue-200',
                                'Strategic Investment': 'bg-blue-100 text-blue-700 border-blue-200',
                                'Corrección Urgente': 'bg-red-100 text-red-700 border-red-200',
                                'Critical Fix': 'bg-red-100 text-red-700 border-red-200',
                            };
                            return (
                                <div key={i} className="p-5 bg-white rounded-xl border-2 border-slate-200 hover:shadow-md transition">
                                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                                        <h4 className="font-bold text-lg text-slate-900">{safeText(opp.title)}</h4>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${catColors[safeText(opp.category)] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{safeText(opp.category)}</span>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${opp.impact === 'high' ? 'bg-emerald-100 text-emerald-700' : opp.impact === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                            Impacto: {safeText(opp.impact)}
                                        </span>
                                    </div>
                                    <p className="text-base text-slate-700 mb-3 leading-relaxed">{safeText(opp.description)}</p>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><span className="text-xs text-slate-400 block mb-1">Esfuerzo</span><p className="font-bold text-slate-700">{safeText(opp.effort)}</p></div>
                                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><span className="text-xs text-slate-400 block mb-1">ROI Estimado</span><p className="font-bold text-emerald-600">{safeText(opp.estimatedRoi)}</p></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CollapsibleSection>

                {/* Risks */}
                <CollapsibleSection title="⚠️ Riesgos y Desafíos" icon={<Shield size={20} className="text-emerald-600" />}>
                    <div className="space-y-3">
                        {result.risks.map((risk: any, i: number) => (
                            <div key={i} className="p-5 bg-white rounded-xl border-2 border-slate-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`px-2.5 py-1 rounded text-xs font-bold ${risk.severity === 'high' ? 'bg-red-100 text-red-700' : risk.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{safeText(risk.severity)}</span>
                                    <h4 className="font-bold text-lg text-slate-900">{safeText(risk.risk)}</h4>
                                </div>
                                <p className="text-base text-slate-700 mb-3 leading-relaxed">{safeText(risk.detail)}</p>
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                    <span className="text-xs font-bold text-emerald-600 block mb-2">🛡️ Mitigación</span>
                                    <p className="text-base text-emerald-900">{safeText(risk.mitigation)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>

                {/* Roadmap */}
                <CollapsibleSection title="📅 Roadmap 30/60/90 Días" icon={<Clock size={20} className="text-emerald-600" />} defaultOpen>
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
                            const phaseColors = ['from-emerald-500 to-teal-500', 'from-blue-500 to-indigo-500', 'from-violet-500 to-purple-500'];
                            const phaseLabels = ['30 días', '60 días', '90 días'];
                            return (
                                <div key={i} className="p-6 bg-white rounded-2xl border-2 border-slate-200 hover:shadow-md transition">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${phaseColors[i] || phaseColors[0]} text-white text-base font-bold shadow-sm`}>{phaseLabels[i] || safeText(phase.phase)}</div>
                                        <h4 className="font-bold text-lg text-slate-900">{safeText(phase.focus)}</h4>
                                    </div>
                                    <ul className="space-y-2 mb-4">
                                        {(phase.actions || []).map((action: any, j: number) => <li key={j} className="flex items-start gap-2 text-base text-slate-700"><CheckCircle2 size={16} className="text-emerald-500 mt-1 flex-shrink-0" />{safeText(action)}</li>)}
                                    </ul>
                                    {(phase.kpis || []).length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {(phase.kpis || []).map((kpi: any, k: number) => <span key={k} className="px-3 py-1.5 bg-slate-50 rounded-lg text-sm font-bold text-slate-600 border border-slate-200">📊 {safeText(kpi)}</span>)}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CollapsibleSection>

                {/* Feedback */}
                <div className="mt-8 print:hidden">
                    <FeedbackModal deepDiveId={reportId} reportType="digital_audit" userId={user!.id} lang={lang} />
                </div>

                <GlossaryModal lang={lang as any} />
            </main>
        </div>
    );
}
