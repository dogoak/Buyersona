import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { profundizarSection } from '../services/profundizarService';
import { Language } from '../types';
import { X, Send, Loader2, Sparkles, MessageCircle, Lock, ChevronRight, HelpCircle, Clock, ArrowLeft } from 'lucide-react';

interface ProfundizarPanelProps {
    isOpen: boolean;
    onClose: () => void;
    sectionTitle: string;
    sectionContent: string;
    reportContext: string; // compressed summary
    reportId: string;
    reportType: 'business' | 'product';
    lang: Language;
}

const MONTHLY_LIMIT = 10;

const quickActions = {
    es: [
        { label: 'Dame más detalle', prompt: 'Quiero más detalle sobre esto, con ejemplos concretos y pasos a seguir.' },
        { label: 'Dame alternativas', prompt: 'Dame alternativas o enfoques diferentes para esto.' },
        { label: 'Explicame simple', prompt: 'Explicame esto en lenguaje simple como si no supiera nada de marketing.' },
        { label: '¿Cómo empiezo?', prompt: '¿Cuál es el primer paso concreto que tengo que hacer mañana para implementar esto?' },
    ],
    en: [
        { label: 'Give me more detail', prompt: 'I want more detail on this, with concrete examples and steps to follow.' },
        { label: 'Give me alternatives', prompt: 'Give me alternative approaches or different strategies for this.' },
        { label: 'Explain simply', prompt: 'Explain this in simple language as if I knew nothing about marketing.' },
        { label: 'How do I start?', prompt: 'What is the first concrete step I need to take tomorrow to implement this?' },
    ],
};

export default function ProfundizarPanel({
    isOpen, onClose, sectionTitle, sectionContent, reportContext,
    reportId, reportType, lang,
}: ProfundizarPanelProps) {
    const { user } = useAuth();
    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const [pendingQuestion, setPendingQuestion] = useState('');
    const [usedThisMonth, setUsedThisMonth] = useState(0);
    const [checkingLimit, setCheckingLimit] = useState(true);
    const [previousFollowups, setPreviousFollowups] = useState<Array<{ user_question: string, ai_response: string }>>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [allFollowups, setAllFollowups] = useState<Array<{ section_context: string, user_question: string, ai_response: string, created_at: string }>>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const panelRef = useRef<HTMLDivElement>(null);

    const toggleExpand = (key: string) => {
        setExpandedItems(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    // Check monthly usage on open
    useEffect(() => {
        if (!isOpen || !user) return;
        const checkUsage = async () => {
            setCheckingLimit(true);
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { count } = await supabase
                .from('report_followups')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('created_at', startOfMonth.toISOString());

            setUsedThisMonth(count || 0);

            // Also fetch previous followups for this section
            const { data: prev } = await supabase
                .from('report_followups')
                .select('user_question, ai_response')
                .eq('report_id', reportId)
                .eq('report_type', reportType)
                .eq('section_context', sectionTitle)
                .order('created_at', { ascending: true });

            setPreviousFollowups(prev || []);
            setCheckingLimit(false);
        };
        checkUsage();
        setPendingQuestion('');
        setQuestion('');
        setShowHistory(false);
    }, [isOpen, user, reportId, reportType, sectionTitle]);

    // Fetch all followups for history view
    const loadHistory = async () => {
        if (!user || allFollowups.length > 0) {
            setShowHistory(true);
            return;
        }
        setLoadingHistory(true);
        const { data } = await supabase
            .from('report_followups')
            .select('section_context, user_question, ai_response, created_at')
            .eq('report_id', reportId)
            .eq('report_type', reportType)
            .order('created_at', { ascending: true });
        setAllFollowups(data || []);
        setLoadingHistory(false);
        setShowHistory(true);
    };

    const remaining = MONTHLY_LIMIT - usedThisMonth;
    const isLimited = remaining <= 0;

    const handleSubmit = async (customQuestion?: string) => {
        const q = customQuestion || question;
        if (!q.trim() || loading || isLimited || !user) return;

        setLoading(true);
        setPendingQuestion(q);
        try {
            const result = await profundizarSection({
                sectionTitle,
                sectionContent: sectionContent.slice(0, 2000), // Compress: max 2000 chars
                userQuestion: q,
                reportContext: reportContext.slice(0, 1000), // Compress: max 1000 chars
                lang,
            });

            // Save to DB
            await supabase.from('report_followups').insert({
                user_id: user.id,
                report_id: reportId,
                report_type: reportType,
                section_context: sectionTitle,
                user_question: q,
                ai_response: result.answer,
                model_used: 'gemini-2.5-flash',
                tokens_used: result.tokensUsed,
                cost_usd: result.costUsd,
            });

            setUsedThisMonth(prev => prev + 1);
            setPreviousFollowups(prev => [...prev, { user_question: q, ai_response: result.answer }]);
            // Also add to allFollowups if loaded so history stays in sync
            setAllFollowups(prev => [...prev, { section_context: sectionTitle, user_question: q, ai_response: result.answer, created_at: new Date().toISOString() }]);
            setQuestion('');
            setPendingQuestion('');
        } catch (err) {
            console.error('Profundizar error:', err);
            setPreviousFollowups(prev => [...prev, {
                user_question: q,
                ai_response: lang === 'es' ? 'Hubo un error al procesar tu consulta. Intentá de nuevo.' : 'There was an error processing your query. Please try again.'
            }]);
            setPendingQuestion('');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={onClose} />

            {/* Panel */}
            <div
                ref={panelRef}
                className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-5 text-white flex-shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Sparkles size={20} className="text-yellow-300" />
                            <h3 className="font-black text-lg">
                                {lang === 'es' ? 'Profundizar' : 'Deep Dive'}
                            </h3>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition">
                            <X size={20} />
                        </button>
                    </div>
                    <p className="text-violet-200 text-sm font-medium leading-snug line-clamp-2">
                        {sectionTitle}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                        <div className={`text-xs font-bold px-2.5 py-1 rounded-lg ${remaining > 3 ? 'bg-white/20 text-white' :
                            remaining > 0 ? 'bg-amber-400/30 text-amber-100' :
                                'bg-red-400/30 text-red-100'
                            }`}>
                            {remaining} / {MONTHLY_LIMIT} {lang === 'es' ? 'consultas restantes este mes' : 'queries remaining this month'}
                        </div>
                    </div>
                </div>

                {/* Tab toggle: Chat / Historial */}
                <div className="flex border-b border-slate-200 px-2 bg-white flex-shrink-0">
                    <button
                        onClick={() => setShowHistory(false)}
                        className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition border-b-2 ${!showHistory ? 'text-violet-600 border-violet-600' : 'text-slate-400 border-transparent hover:text-slate-600'
                            }`}
                    >
                        <span className="flex items-center justify-center gap-1.5">
                            <MessageCircle size={13} />
                            {lang === 'es' ? 'Chat' : 'Chat'}
                        </span>
                    </button>
                    <button
                        onClick={loadHistory}
                        className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition border-b-2 ${showHistory ? 'text-violet-600 border-violet-600' : 'text-slate-400 border-transparent hover:text-slate-600'
                            }`}
                    >
                        <span className="flex items-center justify-center gap-1.5">
                            <Clock size={13} />
                            {lang === 'es' ? 'Historial' : 'History'}
                            {allFollowups.length > 0 && (
                                <span className="bg-violet-100 text-violet-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{allFollowups.length}</span>
                            )}
                        </span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {checkingLimit || loadingHistory ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-violet-500" size={24} />
                        </div>
                    ) : showHistory ? (
                        /* ─── HISTORY VIEW ─── */
                        allFollowups.length === 0 ? (
                            <div className="text-center py-12">
                                <Clock size={40} className="text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 text-sm">
                                    {lang === 'es' ? 'Todavía no hiciste ninguna consulta en este reporte.' : 'No queries yet for this report.'}
                                </p>
                            </div>
                        ) : (() => {
                            // Group followups by section_context
                            const grouped: Record<string, typeof allFollowups> = {};
                            allFollowups.forEach(fu => {
                                const key = fu.section_context || 'General';
                                if (!grouped[key]) grouped[key] = [];
                                grouped[key].push(fu);
                            });
                            return (
                                <div className="space-y-6">
                                    {Object.entries(grouped).map(([section, items]) => (
                                        <div key={section}>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Sparkles size={14} className="text-violet-500 flex-shrink-0" />
                                                    <h4 className="text-xs font-bold text-violet-600 uppercase tracking-wider truncate">{section}</h4>
                                                    <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0">{items.length}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2 pl-2 border-l-2 border-violet-100">
                                                {items.map((fu, i) => {
                                                    const itemKey = `${section}-${i}`;
                                                    const isExpanded = expandedItems.has(itemKey);
                                                    return (
                                                        <button
                                                            key={i}
                                                            onClick={() => toggleExpand(itemKey)}
                                                            className="pl-3 text-left w-full hover:bg-violet-50/50 rounded-lg py-2 px-2 transition-colors group"
                                                        >
                                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                                <span className="text-[10px] text-slate-400">
                                                                    {new Date(fu.created_at).toLocaleDateString(lang === 'es' ? 'es-AR' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                <ChevronRight size={12} className={`text-slate-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                            </div>
                                                            <p className="text-xs font-semibold text-violet-700 mb-1">{fu.user_question}</p>
                                                            <p className={`text-xs text-slate-600 leading-relaxed whitespace-pre-wrap ${isExpanded ? '' : 'line-clamp-3'}`}>
                                                                {fu.ai_response}
                                                            </p>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()
                    ) : isLimited ? (
                        <div className="text-center py-12 px-4">
                            <Lock size={48} className="text-slate-300 mx-auto mb-4" />
                            <h4 className="font-bold text-slate-800 text-lg mb-2">
                                {lang === 'es' ? 'Llegaste al límite mensual' : 'Monthly limit reached'}
                            </h4>
                            <p className="text-slate-500 text-sm mb-6">
                                {lang === 'es'
                                    ? `Usaste tus ${MONTHLY_LIMIT} consultas de este mes. Se renuevan el 1ro del próximo mes.`
                                    : `You've used your ${MONTHLY_LIMIT} queries this month. They renew on the 1st of next month.`}
                            </p>
                            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                                <p className="text-sm text-violet-700 font-medium">
                                    {lang === 'es'
                                        ? '🚀 Próximamente: Plan Pro con consultas ilimitadas y asistente IA personalizado.'
                                        : '🚀 Coming soon: Pro Plan with unlimited queries and AI assistant.'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Previous followups for this section */}
                            {previousFollowups.map((fu, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-end">
                                        <div className="bg-violet-100 text-violet-800 rounded-2xl rounded-br-sm px-4 py-3 max-w-[85%] text-sm font-medium">
                                            {fu.user_question}
                                        </div>
                                    </div>
                                    <div className="flex justify-start">
                                        <div className="bg-slate-100 text-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%] text-sm leading-relaxed whitespace-pre-wrap">
                                            {fu.ai_response}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Loading state with pending question */}
                            {loading && (
                                <>
                                    <div className="flex justify-end">
                                        <div className="bg-violet-100 text-violet-800 rounded-2xl rounded-br-sm px-4 py-3 max-w-[85%] text-sm font-medium">
                                            {pendingQuestion}
                                        </div>
                                    </div>
                                    <div className="flex justify-start">
                                        <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 text-slate-500 text-sm">
                                            <Loader2 size={14} className="animate-spin" />
                                            {lang === 'es' ? 'Analizando...' : 'Analyzing...'}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Quick actions */}
                            {previousFollowups.length === 0 && !loading && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                        {lang === 'es' ? 'Consultas rápidas' : 'Quick actions'}
                                    </p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {quickActions[lang].map((action, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSubmit(action.prompt)}
                                                className="flex items-center gap-3 px-4 py-3 bg-violet-50 border border-violet-100 rounded-xl text-sm font-medium text-violet-700 hover:bg-violet-100 transition text-left group"
                                            >
                                                <ChevronRight size={14} className="text-violet-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Input — hide when viewing history */}
                {!isLimited && !checkingLimit && !showHistory && (
                    <div className="border-t border-slate-200 p-4 flex-shrink-0 bg-white">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                placeholder={lang === 'es' ? '¿Qué querés saber sobre esta sección?' : 'What do you want to know about this section?'}
                                className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                disabled={loading}
                            />
                            <button
                                onClick={() => handleSubmit()}
                                disabled={loading || !question.trim()}
                                className="p-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right {
                    animation: slideInRight 0.3s ease-out;
                }
            `}</style>
        </>
    );
}
