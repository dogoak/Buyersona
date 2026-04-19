import React, { useState } from 'react';
import { StrategicAnalysis, PersonaType, Language, Persona } from '../types';
import { translations } from '../utils/translations';
import {
    AlertTriangle, CheckCircle, ShieldAlert, Award, Star,
    Briefcase, Brain, Users, DollarSign, TrendingUp, Lock, ChevronDown, ChevronUp,
    Building, User, Rocket, XCircle, Check, Target, Megaphone, Zap, BarChart, Crosshair, ArrowRight, MessageCircle, FileText, GitBranch, Waves, ArrowDown, Sparkles
} from 'lucide-react';

import { FullLogo, Isotype } from './BrandAssets';

interface DashboardProps {
    data: StrategicAnalysis;
    lang: Language;
    onReset: () => void;
    onProfundizar?: (title: string, content: string) => void;
}

const getPersonaColor = (type: PersonaType) => {
    switch (type) {
        case PersonaType.PRIMARY: return 'bg-indigo-100 text-indigo-700 border-indigo-200 ring-2 ring-indigo-50';
        case PersonaType.CASH_COW: return 'bg-emerald-100 text-emerald-700 border-emerald-200 ring-2 ring-emerald-50';
        case PersonaType.SCALABLE: return 'bg-blue-100 text-blue-700 border-blue-200 ring-2 ring-blue-50';
        case PersonaType.LONG_TERM: return 'bg-amber-100 text-amber-700 border-amber-200 ring-2 ring-amber-50';
        default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
};

const PersonaDetailCard = ({ persona, lang }: { persona: Persona, lang: Language }) => {
    const [expanded, setExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'strategy'>('strategy'); // Default to Strategy for immediate value
    const t = translations[lang].dashboard;

    return (
        <div className={`bg-white rounded-3xl shadow-lg shadow-slate-200/40 border border-slate-100 overflow-hidden transition-all duration-300 ${expanded ? 'ring-2 ring-indigo-500/20' : 'hover:-translate-y-1 hover:shadow-xl'}`}>

            {/* Header */}
            <div
                className="p-6 sm:p-8 cursor-pointer relative"
                onClick={() => setExpanded(!expanded)}
            >
                <div className={`absolute top-0 left-0 w-full h-1.5 ${persona.type === PersonaType.PRIMARY ? 'bg-indigo-500' :
                    persona.type === PersonaType.CASH_COW ? 'bg-emerald-500' :
                        'bg-slate-300'
                    }`}></div>

                <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border ${getPersonaColor(persona.type)}`}>
                        {persona.type}
                    </span>
                    <div className="flex items-center text-slate-900 font-black text-lg">
                        <span className="text-indigo-600 mr-1">{persona.suitabilityScore}</span>
                        <span className="text-xs text-slate-400 font-bold self-end mb-1">/100</span>
                    </div>
                </div>

                <h3 className="text-2xl font-black text-slate-900 mb-2">{persona.name}</h3>
                <p className="text-slate-600 font-medium mb-4 leading-relaxed">{persona.oneLiner}</p>

                <div className="flex items-center justify-between mt-6 print:hidden">
                    <div className="flex items-center text-xs font-bold text-indigo-600 uppercase tracking-wider">
                        {expanded ? 'Collapse' : 'View Battle Card'}
                    </div>
                    {expanded ? <ChevronUp className="text-indigo-600" /> : <ChevronDown className="text-slate-400" />}
                </div>
            </div>

            {/* Expanded Content - Tabs */}
            <div className={`overflow-hidden transition-all duration-300 print:max-h-none print:opacity-100 ${expanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="border-t border-slate-100 bg-slate-50/50">
                    {/* Tabs Header */}
                    <div className="flex border-b border-slate-200 print:hidden">
                        <button
                            onClick={() => setActiveTab('strategy')}
                            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'strategy' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-indigo-400/70 hover:text-indigo-600 hover:bg-indigo-50/50'
                                }`}
                        >
                            {t.tab_strategy}
                        </button>
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'profile' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-indigo-400/70 hover:text-indigo-600 hover:bg-indigo-50/50'
                                }`}
                        >
                            {t.tab_profile}
                            {activeTab !== 'profile' && (
                                <span className="ml-1.5 inline-block w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse align-middle" />
                            )}
                        </button>
                    </div>

                    <div className="p-6 sm:p-8 animate-fade-in-up">

                        {/* STRATEGY TAB */}
                        <div className={`grid grid-cols-1 gap-6 print:block ${activeTab === 'strategy' ? 'block' : 'hidden print:block mb-8'}`}>

                            {/* Why This Persona & Budget */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                                    <div className="flex items-center mb-3 text-indigo-600">
                                        <Target size={20} className="mr-2" />
                                        <h4 className="font-bold text-xs uppercase tracking-widest">Why Target Them?</h4>
                                    </div>
                                    <p className="text-slate-800 font-medium leading-relaxed">{persona.strategy.whyThisPersona}</p>
                                </div>
                                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex flex-col justify-center">
                                    <div className="flex items-center mb-2 text-emerald-600">
                                        <DollarSign size={20} className="mr-2" />
                                        <h4 className="font-bold text-xs uppercase tracking-widest">Min. Budget</h4>
                                    </div>
                                    <p className="text-2xl font-black text-emerald-700">{persona.strategy.minBudget}</p>
                                    <p className="text-xs text-emerald-600 mt-1">to see results</p>
                                </div>
                            </div>

                            {/* Hook & Offer */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg shadow-indigo-200">
                                    <div className="flex items-center mb-4 text-indigo-200">
                                        <Megaphone size={20} className="mr-2" />
                                        <h4 className="font-bold text-xs uppercase tracking-widest">{t.strat_hook}</h4>
                                    </div>
                                    <p className="text-lg font-bold leading-relaxed">"{persona.strategy.marketingHook}"</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center mb-4 text-emerald-600">
                                        <Award size={20} className="mr-2" />
                                        <h4 className="font-bold text-xs uppercase tracking-widest">{t.strat_offer}</h4>
                                    </div>
                                    <p className="text-slate-700 font-medium">{persona.strategy.offerAngle}</p>
                                </div>
                            </div>

                            {/* Channels & Content */}
                            <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl shadow-md">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <div className="flex items-center mb-3 text-indigo-400">
                                            <Crosshair size={20} className="mr-2" />
                                            <h4 className="font-bold text-xs uppercase tracking-widest">{t.strat_channel}</h4>
                                        </div>
                                        <p className="text-white text-xl font-bold">{persona.strategy.bestChannel}</p>
                                        <p className="text-xs mt-1 text-slate-500">Secondary: {persona.strategy.secondaryChannel}</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center mb-3 text-purple-400">
                                            <Zap size={20} className="mr-2" />
                                            <h4 className="font-bold text-xs uppercase tracking-widest">{t.strat_content}</h4>
                                        </div>
                                        <ul className="space-y-2">
                                            {persona.strategy.contentIdeas.map((idea, i) => (
                                                <li key={i} className="flex items-start text-sm text-white font-medium">
                                                    <span className="mr-2 text-purple-500">•</span>
                                                    {idea}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PROFILE TAB (The 6 Grids) */}
                    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid ${activeTab === 'profile' ? 'grid' : 'hidden print:grid'}`}>
                        {/* 1. Demographic */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex items-center space-x-2 mb-4 text-blue-600">
                                <Briefcase size={20} />
                                <h4 className="font-bold text-sm uppercase">{t.p_demographic}</h4>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div><span className="text-slate-400 font-semibold text-xs uppercase block">{t.lbl_role}</span> <span className="font-medium text-slate-800">{persona.demographic?.role || 'N/A'}</span></div>
                                <div><span className="text-slate-400 font-semibold text-xs uppercase block">{t.lbl_industry}</span> <span className="font-medium text-slate-800">{persona.demographic?.industry || 'N/A'} ({persona.demographic?.marketType || 'N/A'})</span></div>
                                <div><span className="text-slate-400 font-semibold text-xs uppercase block">Company</span> <span className="font-medium text-slate-800">{persona.demographic?.companyType || 'N/A'} ({persona.demographic?.companySize || 'N/A'})</span></div>
                            </div>
                        </div>

                        {/* 2. Psychological */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex items-center space-x-2 mb-4 text-purple-600">
                                <Brain size={20} />
                                <h4 className="font-bold text-sm uppercase">{t.p_psychological}</h4>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-slate-400 font-semibold text-xs uppercase block mb-1">{t.lbl_motivations}</span>
                                    <div className="flex flex-wrap gap-1">{persona.psychological.motivations.slice(0, 3).map((m, i) => <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium">{m}</span>)}</div>
                                </div>
                                <div className="pt-2 border-t border-slate-100 mt-2">
                                    <span className="text-slate-400 font-semibold text-xs uppercase block">{t.lbl_hates}</span>
                                    <span className="text-slate-800 font-medium italic">"{persona.psychological.hates}"</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Social */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex items-center space-x-2 mb-4 text-pink-600">
                                <Users size={20} />
                                <h4 className="font-bold text-sm uppercase">{t.p_social}</h4>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div><span className="text-slate-400 font-semibold text-xs uppercase block">{t.lbl_reports}</span> <span className="font-medium text-slate-800">{persona.social.reportsTo}</span></div>
                                <div><span className="text-slate-400 font-semibold text-xs uppercase block">Image</span> <span className="font-medium text-slate-800">{persona.social.desiredImage}</span></div>
                            </div>
                        </div>

                        {/* 4. Economic */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex items-center space-x-2 mb-4 text-emerald-600">
                                <DollarSign size={20} />
                                <h4 className="font-bold text-sm uppercase">{t.p_economic}</h4>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-slate-400 font-semibold text-xs uppercase block mb-1">{t.lbl_kpis}</span>
                                    <div className="flex flex-wrap gap-1">{persona.economic.keyMetrics.slice(0, 3).map((m, i) => <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-medium">{m}</span>)}</div>
                                </div>
                                <div className="bg-emerald-50 p-2 rounded mt-2">
                                    <span className="text-xs font-bold text-emerald-800 block mb-1">GOOD DEAL</span>
                                    <span className="text-xs leading-tight block text-emerald-700">{persona.economic.goodPurchaseDefinition}</span>
                                </div>
                            </div>
                        </div>

                        {/* 5. Maturity */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex items-center space-x-2 mb-4 text-amber-600">
                                <TrendingUp size={20} />
                                <h4 className="font-bold text-sm uppercase">{t.p_maturity}</h4>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div><span className="text-slate-400 font-semibold text-xs uppercase block">{t.lbl_stage}</span> <span className="font-bold text-slate-900 bg-amber-50 px-2 py-0.5 rounded inline-block">{persona.maturity.stage}</span></div>
                                <div><span className="text-slate-400 font-semibold text-xs uppercase block">Decision Speed</span> <span className="font-medium text-slate-800">{persona.maturity.decisionSpeed}</span></div>
                            </div>
                        </div>

                        {/* 6. Friction */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex items-center space-x-2 mb-4 text-slate-600">
                                <Lock size={20} />
                                <h4 className="font-bold text-sm uppercase">{t.p_friction}</h4>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-slate-400 font-semibold text-xs uppercase block mb-1">{t.lbl_barriers}</span>
                                    <div className="flex flex-wrap gap-1">{persona.friction.barriers.slice(0, 2).map((m, i) => <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">{m}</span>)}</div>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-semibold text-xs uppercase block mb-1">{t.lbl_objections}</span>
                                    <ul className="list-disc pl-4 text-slate-700 text-xs">
                                        {persona.friction.keyObjections.slice(0, 2).map((obj, i) => (
                                            <li key={i}>{obj}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ data, lang, onReset, onProfundizar }) => {
    const t = translations[lang].dashboard;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20 font-sans overflow-x-hidden">
            {/* Cleaned up redundant inner header */}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

                {/* Market Pulse (NEW) */}
                {data.marketInsights && (
                    <section className="bg-slate-900 rounded-[2rem] p-6 sm:p-8 text-white shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>

                        <div className="flex items-center mb-6 relative z-10">
                            <div className="p-2 bg-indigo-500/20 rounded-lg mr-3">
                                <BarChart size={20} className="text-indigo-400" />
                            </div>
                            <h2 className="text-lg font-bold tracking-tight">{t.market_pulse}: <span className="text-indigo-400">{data.marketInsights.industry}</span></h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
                            {/* Benchmarks */}
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">{lang === 'es' ? 'CAC Objetivo' : 'Target CAC'}</p>
                                <p className="text-2xl font-bold text-emerald-400">{data.marketInsights.benchmarkCAC}</p>
                                <p className="text-[10px] text-slate-500 mt-1">{lang === 'es' ? 'Cuánto cuesta conseguir un cliente' : 'Cost to acquire one customer'}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">{lang === 'es' ? 'Tasa de Conversión' : 'Conv. Rate'}</p>
                                <p className="text-2xl font-bold text-blue-400">{data.marketInsights.benchmarkConversion}</p>
                                <p className="text-[10px] text-slate-500 mt-1">{lang === 'es' ? 'De 100 visitas, cuántas compran' : 'Of 100 visitors, how many buy'}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">{lang === 'es' ? 'Ciclo de Venta' : 'Sales Cycle'}</p>
                                <p className="text-2xl font-bold text-indigo-400">{data.marketInsights.typicalSalesCycle}</p>
                                <p className="text-[10px] text-slate-500 mt-1">{lang === 'es' ? 'Tiempo hasta que alguien te compra' : 'Time until someone buys'}</p>
                            </div>

                            {/* Trends */}
                            <div className="md:col-span-1 bg-gradient-to-br from-indigo-600 to-violet-700 p-4 rounded-xl border border-white/10 flex flex-col justify-center">
                                <p className="text-xs text-indigo-200 uppercase font-bold tracking-wider mb-2">{t.market_trends}</p>
                                <div className="text-sm font-medium leading-snug">
                                    {data.marketInsights.trends[0]}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Executive Summary */}
                <section className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-white/60 p-8 sm:p-10 relative overflow-hidden group">
                    <h2 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-4 flex items-center">
                        <Star size={14} className="mr-2" />
                        {t.exec_summary}
                    </h2>
                    <p className="text-2xl sm:text-3xl font-medium text-slate-800 leading-relaxed relative z-10">
                        {data.summary}
                    </p>
                </section>

                {/* NEW: Competitor & Social Intel Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Competitor Radar */}
                    <section className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8">
                        <div className="flex items-center mb-6">
                            <div className="p-2 bg-rose-50 rounded-lg mr-3 text-rose-600">
                                <Crosshair size={24} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">{lang === 'es' ? 'Radar de Competencia' : 'Competitor Radar'}</h2>
                        </div>
                        <div className="space-y-4">
                            {data.competitors?.map((comp, idx) => (
                                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition group">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-900">{comp.name}</h3>
                                        <a
                                            href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-indigo-600 hover:underline flex items-center opacity-0 group-hover:opacity-100 transition"
                                        >
                                            Visit <ArrowRight size={10} className="ml-1" />
                                        </a>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{lang === 'es' ? 'Solapamiento' : 'Overlap'}</span>
                                            <p className="text-rose-600 font-medium leading-tight">{comp.overlap}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{lang === 'es' ? 'Tu Ventaja' : 'Your Edge'}</span>
                                            <p className="text-emerald-600 font-medium leading-tight">{comp.differentiation}</p>
                                        </div>
                                    </div>
                                    {onProfundizar && (
                                        <button
                                            onClick={() => onProfundizar(
                                                `Competidor: ${comp.name}`,
                                                `${comp.name} (${comp.website}). Solapamiento: ${comp.overlap}. Ventaja: ${comp.differentiation}`
                                            )}
                                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-violet-600 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition"
                                        >
                                            <Sparkles size={12} />
                                            {lang === 'es' ? `Profundizar sobre ${comp.name}` : `Deep dive on ${comp.name}`}
                                        </button>
                                    )}
                                </div>
                            ))}
                            {(!data.competitors || data.competitors.length === 0) && (
                                <p className="text-slate-400 text-sm italic">No competitors identified yet.</p>
                            )}
                        </div>
                    </section>

                    {/* Social Wire */}
                    <section className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8">
                        <div className="flex items-center mb-6">
                            <div className="p-2 bg-blue-50 rounded-lg mr-3 text-blue-600">
                                <MessageCircle size={24} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">{lang === 'es' ? 'Escucha Social' : 'Social Wire'}</h2>
                        </div>
                        <div className="space-y-4">
                            {data.socialListening?.map((item, idx) => (
                                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="px-2 py-1 rounded bg-white border border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                            {item.platform}
                                        </span>
                                        <span className={`text-xs font-bold ${item.sentiment === 'Positive' ? 'text-emerald-500' :
                                            item.sentiment === 'Negative' ? 'text-rose-500' : 'text-amber-500'
                                            }`}>
                                            {item.sentiment}
                                        </span>
                                    </div>
                                    <p className="text-slate-800 font-medium text-sm mb-2">"{item.insight}"</p>
                                    <div className="flex items-center text-xs text-slate-400">
                                        <span className="font-semibold text-indigo-500 mr-2">{lang === 'es' ? 'Tema:' : 'Topic:'}</span> {item.topic}
                                    </div>
                                </div>
                            ))}
                            {(!data.socialListening || data.socialListening.length === 0) && (
                                <p className="text-slate-400 text-sm italic">No social signals detected yet.</p>
                            )}
                        </div>
                    </section>
                </div>

                {/* Demand Map Grid (Personas with embedded strategy) */}
                <section>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{t.demand_map}</h2>
                            <p className="text-slate-500 font-medium">{t.demand_sub}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        {/* Persona Cards - NOW WITH DEEP PROFILE DETAILS */}
                        <div className="flex flex-col gap-6">
                            {data.demandMap?.map((persona, idx) => (
                                <React.Fragment key={idx}>
                                    <PersonaDetailCard persona={persona} lang={lang} />
                                    {onProfundizar && (
                                        <div className="mt-3 flex justify-end">
                                            <button
                                                onClick={() => onProfundizar(
                                                    `Persona: ${persona.name}`,
                                                    `${persona.name} (${persona.type}). ${persona.oneLiner}. Score: ${persona.suitabilityScore}/100. Edad: ${persona.demographic?.ageRange}. Estrategia: ${persona.strategy?.approach}`
                                                )}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-violet-600 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition"
                                            >
                                                <Sparkles size={12} />
                                                {lang === 'es' ? `Profundizar sobre ${persona.name}` : `Deep dive on ${persona.name}`}
                                            </button>
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Operational Reality Check */}
                {data.operationalCheck && (
                    <section className={`rounded-3xl p-8 sm:p-10 border shadow-lg relative overflow-hidden ${data.operationalCheck.status === 'Danger' ? 'bg-rose-50/80 border-rose-200' :
                        data.operationalCheck.status === 'Caution' ? 'bg-amber-50/80 border-amber-200' :
                            'bg-emerald-50/80 border-emerald-200'
                        }`}>
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-8 relative z-10">
                            <div className={`p-5 rounded-2xl shadow-sm ${data.operationalCheck.status === 'Danger' ? 'bg-white text-rose-600' :
                                data.operationalCheck.status === 'Caution' ? 'bg-white text-amber-600' :
                                    'bg-white text-emerald-600'
                                }`}>
                                {data.operationalCheck.status === 'Danger' ? <ShieldAlert size={40} /> :
                                    data.operationalCheck.status === 'Caution' ? <AlertTriangle size={40} /> :
                                        <CheckCircle size={40} />}
                            </div>
                            <div className="flex-1">
                                <h3 className={`text-2xl font-black mb-2 ${data.operationalCheck.status === 'Danger' ? 'text-rose-900' :
                                    data.operationalCheck.status === 'Caution' ? 'text-amber-900' :
                                        'text-emerald-900'
                                    }`}>
                                    {t.operational_check}: {data.operationalCheck.status}
                                </h3>
                                <p className="text-slate-800 font-bold text-lg mb-2">{data.operationalCheck.capacityWarning}</p>
                                <p className="text-slate-600 font-medium">{data.operationalCheck.advice}</p>
                            </div>
                            <div className="text-center bg-white p-6 rounded-2xl shadow-sm min-w-[160px] w-full md:w-auto">
                                <span className="block text-4xl font-black text-slate-900 tracking-tighter">{data.operationalCheck.maxLeadsPerMonth}</span>
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{t.max_leads}</span>
                            </div>
                        </div>
                    </section>
                )}

                {/* Blue Ocean Strategy (NEW) */}
                {data.blueOcean && (
                    <section className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-3xl p-8 text-white shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full mix-blend-overlay filter blur-3xl"></div>

                        <div className="flex items-center mb-8 relative z-10">
                            <div className="p-3 bg-white/20 rounded-xl mr-4 backdrop-blur-sm shadow-lg">
                                <Waves size={28} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight leading-none">{lang === 'es' ? 'Estrategia de Diferenciación' : 'Differentiation Strategy'}</h2>
                                <p className="text-blue-100 text-sm font-medium mt-1 opacity-80">{lang === 'es' ? 'Cómo destacarte en tu mercado' : 'How to stand out in your market'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                            {/* Status & Path */}
                            <div className="lg:col-span-1 flex flex-col gap-6">
                                <div className="bg-white/10 p-6 rounded-2xl border border-white/20 backdrop-blur-sm">
                                    <span className="text-xs font-bold uppercase tracking-wider opacity-70 block mb-2">{lang === 'es' ? 'Estado Actual' : 'Current State'}</span>
                                    <div className={`text-3xl font-black mb-3 tracking-tight ${data.blueOcean.status === 'Red Ocean' ? 'text-rose-200' : 'text-cyan-100'}`}>
                                        {data.blueOcean.status === 'Red Ocean' ? (lang === 'es' ? '🔴 Mercado Saturado' : '🔴 Saturated Market') : (lang === 'es' ? '🔵 Mercado Abierto' : '🔵 Open Market')}
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed opacity-90 border-t border-white/10 pt-3">
                                        {data.blueOcean.diagnosis}
                                    </p>
                                </div>

                                <div className="bg-white text-blue-900 p-6 rounded-2xl shadow-lg flex-grow flex flex-col justify-center">
                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block mb-2">{lang === 'es' ? 'Cómo Diferenciarte' : 'How to Differentiate'}</span>
                                    <p className="text-lg font-bold leading-snug">
                                        "{data.blueOcean.blueOceanPath}"
                                    </p>
                                </div>
                            </div>

                            {/* ERRC Grid */}
                            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Eliminate */}
                                <div className="bg-rose-500/20 border border-rose-200/30 p-5 rounded-2xl backdrop-blur-sm hover:bg-rose-500/30 transition">
                                    <div className="flex items-center mb-3 text-rose-200">
                                        <XCircle size={18} className="mr-2" />
                                        <h4 className="font-bold text-xs uppercase tracking-widest">{lang === 'es' ? 'Eliminar' : 'Eliminate'}</h4>
                                    </div>
                                    <ul className="space-y-2">
                                        {data.blueOcean.errcGrid?.eliminate?.map((item, i) => (
                                            <li key={i} className="text-sm font-medium text-white/90 leading-tight">• {item}</li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Raise */}
                                <div className="bg-emerald-500/20 border border-emerald-200/30 p-5 rounded-2xl backdrop-blur-sm hover:bg-emerald-500/30 transition">
                                    <div className="flex items-center mb-3 text-emerald-200">
                                        <TrendingUp size={18} className="mr-2" />
                                        <h4 className="font-bold text-xs uppercase tracking-widest">{lang === 'es' ? 'Potenciar' : 'Raise'}</h4>
                                    </div>
                                    <ul className="space-y-2">
                                        {data.blueOcean.errcGrid?.raise?.map((item, i) => (
                                            <li key={i} className="text-sm font-medium text-white/90 leading-tight">• {item}</li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Reduce */}
                                <div className="bg-amber-500/20 border border-amber-200/30 p-5 rounded-2xl backdrop-blur-sm hover:bg-amber-500/30 transition">
                                    <div className="flex items-center mb-3 text-amber-200">
                                        <ArrowDown size={18} className="mr-2" />
                                        <h4 className="font-bold text-xs uppercase tracking-widest">{lang === 'es' ? 'Reducir' : 'Reduce'}</h4>
                                    </div>
                                    <ul className="space-y-2">
                                        {data.blueOcean.errcGrid?.reduce?.map((item, i) => (
                                            <li key={i} className="text-sm font-medium text-white/90 leading-tight">• {item}</li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Create */}
                                <div className="bg-indigo-500/40 border border-indigo-200/40 p-5 rounded-2xl backdrop-blur-sm hover:bg-indigo-500/50 transition shadow-lg shadow-indigo-900/20">
                                    <div className="flex items-center mb-3 text-indigo-200">
                                        <Zap size={18} className="mr-2" />
                                        <h4 className="font-bold text-xs uppercase tracking-widest">{lang === 'es' ? 'Crear' : 'Create'}</h4>
                                    </div>
                                    <ul className="space-y-2">
                                        {data.blueOcean.errcGrid?.create?.map((item, i) => (
                                            <li key={i} className="text-sm font-medium text-white/90 leading-tight">• {item}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Growth Opportunities (NEW) */}
                {data.growthOpportunities && data.growthOpportunities.length > 0 && (
                    <section className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8">
                        <div className="flex items-center mb-6">
                            <div className="p-2 bg-purple-50 rounded-lg mr-3 text-purple-600">
                                <GitBranch size={24} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">{t.growth_opps}</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {data.growthOpportunities.map((opp, idx) => (
                                <div key={idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-lg text-slate-900">{opp.title}</h3>
                                        <span className="px-2 py-1 rounded bg-white border border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                            {opp.type}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 text-sm mb-4 leading-relaxed">{opp.description}</p>

                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div>
                                            <span className="font-bold text-emerald-600 uppercase tracking-wider block mb-1">{lang === 'es' ? 'A Favor' : 'Pros'}</span>
                                            <ul className="space-y-1">
                                                {opp.pros.map((p, i) => (
                                                    <li key={i} className="flex items-start text-slate-700">
                                                        <Check size={12} className="mr-1 mt-0.5 text-emerald-500 flex-shrink-0" />
                                                        {p}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <span className="font-bold text-rose-600 uppercase tracking-wider block mb-1">{lang === 'es' ? 'En Contra' : 'Cons'}</span>
                                            <ul className="space-y-1">
                                                {opp.cons.map((c, i) => (
                                                    <li key={i} className="flex items-start text-slate-700">
                                                        <XCircle size={12} className="mr-1 mt-0.5 text-rose-500 flex-shrink-0" />
                                                        {c}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Action Plan */}
                <section className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-[2.5rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
                    {/* Abstract lines */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

                    <div className="flex items-center space-x-4 mb-10 relative z-10">
                        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                            <Award className="text-yellow-300" size={32} />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight">{t.action_plan}</h2>
                    </div>

                    <div className="space-y-6 relative z-10">
                        {data.actionPlan?.map((step, idx) => (
                            <div key={idx} className="flex gap-6 group">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-900/50 group-hover:scale-110 transition-transform">
                                    {idx + 1}
                                </div>
                                <p className="text-indigo-100 text-lg pt-1.5 leading-relaxed font-medium">{step}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-12 pt-8 border-t border-white/10 text-center relative z-10">
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">{t.generated_by}</p>
                    </div>
                </section>




            </main>
        </div>
    );
};