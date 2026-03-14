import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    X, TrendingUp, Globe, ArrowRight, Search, Shield,
    BarChart3, Sparkles, Zap, Loader2
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface ServicesModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportId: string;
    lang?: string;
}

interface ServiceDef {
    id: string;
    icon: any;
    gradient: string;
    bgLight: string;
    borderLight: string;
    textColor: string;
    iconBg: string;
    title_es: string;
    title_en: string;
    desc_es: string;
    desc_en: string;
    priceKey: string;          // key in system_settings
    defaultPrice: number;      // fallback
    route: (id: string) => string;
    badge_es: string;
    badge_en: string;
}

const serviceDefs: ServiceDef[] = [
    {
        id: 'deep-dive',
        icon: TrendingUp,
        gradient: 'from-violet-600 to-fuchsia-600',
        bgLight: 'bg-violet-50',
        borderLight: 'border-violet-200',
        textColor: 'text-violet-700',
        iconBg: 'bg-violet-100',
        title_es: 'Deep Dive de Producto',
        title_en: 'Product Deep Dive',
        desc_es: 'Análisis táctico completo: buyer personas, pricing, competencia, kit de ventas, calendario de contenido y plan de acción a 90 días.',
        desc_en: 'Full tactical analysis: buyer personas, pricing, competitors, sales kit, content calendar and 90-day action plan.',
        priceKey: 'deep_dive_price_ars',
        defaultPrice: 12500,
        route: (id: string) => `/deep-dive/new/${id}`,
        badge_es: 'Más popular',
        badge_en: 'Most popular',
    },
    {
        id: 'digital-audit',
        icon: Globe,
        gradient: 'from-emerald-600 to-teal-600',
        bgLight: 'bg-emerald-50',
        borderLight: 'border-emerald-200',
        textColor: 'text-emerald-700',
        iconBg: 'bg-emerald-100',
        title_es: 'Auditoría de Presencia Digital',
        title_en: 'Digital Presence Audit',
        desc_es: 'Diagnóstico completo de tu huella digital: web, SEO, redes, reputación, AI-readiness (AEO), referentes del rubro y roadmap 30/60/90.',
        desc_en: 'Full digital footprint diagnosis: web, SEO, social, reputation, AI-readiness (AEO), industry leaders and 30/60/90 roadmap.',
        priceKey: 'digital_audit_price_ars',
        defaultPrice: 18000,
        route: (id: string) => `/digital-audit/new/${id}`,
        badge_es: 'Nuevo',
        badge_en: 'New',
    },
];

export default function ServicesModal({ isOpen, onClose, reportId, lang = 'es' }: ServicesModalProps) {
    const navigate = useNavigate();
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [loadingPrices, setLoadingPrices] = useState(true);

    useEffect(() => {
        if (!isOpen) return;
        const fetchPrices = async () => {
            setLoadingPrices(true);
            try {
                const { data } = await supabase
                    .from('system_settings')
                    .select('deep_dive_price_ars, digital_audit_price_ars')
                    .eq('id', 1)
                    .single();
                if (data) {
                    setPrices({
                        deep_dive_price_ars: data.deep_dive_price_ars || 12500,
                        digital_audit_price_ars: (data as any).digital_audit_price_ars || 18000,
                    });
                }
            } catch (err) {
                console.error('Failed to fetch prices', err);
            } finally {
                setLoadingPrices(false);
            }
        };
        fetchPrices();
    }, [isOpen]);

    if (!isOpen) return null;

    const formatPrice = (amount: number) => `$${amount.toLocaleString('es-AR')} ARS`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white/80 backdrop-blur-xl z-10 px-6 sm:px-8 pt-6 pb-4 border-b border-slate-100 rounded-t-3xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                                <Sparkles size={22} className="text-indigo-500" />
                                {lang === 'es' ? 'Análisis Avanzados' : 'Advanced Analyses'}
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">
                                {lang === 'es'
                                    ? 'Elegí el tipo de análisis que necesitás para tu negocio'
                                    : 'Choose the type of analysis you need for your business'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Services */}
                <div className="p-6 sm:p-8 space-y-4">
                    {serviceDefs.map(service => {
                        const Icon = service.icon;
                        const price = prices[service.priceKey] || service.defaultPrice;
                        return (
                            <div
                                key={service.id}
                                className={`relative ${service.bgLight} rounded-2xl border ${service.borderLight} p-6 hover:shadow-lg transition-all group`}
                            >
                                {/* Badge */}
                                {(service.badge_es || service.badge_en) && (
                                    <span className={`absolute -top-2.5 right-4 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r ${service.gradient} shadow-md`}>
                                        {lang === 'es' ? service.badge_es : service.badge_en}
                                    </span>
                                )}

                                <div className="flex items-start gap-4">
                                    <div className={`w-14 h-14 rounded-2xl ${service.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                        <Icon size={28} className={service.textColor} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-slate-900 mb-1">
                                            {lang === 'es' ? service.title_es : service.title_en}
                                        </h3>
                                        <p className="text-sm text-slate-600 leading-relaxed mb-4">
                                            {lang === 'es' ? service.desc_es : service.desc_en}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-black text-slate-900">
                                                {loadingPrices ? (
                                                    <Loader2 size={16} className="animate-spin text-slate-400 inline" />
                                                ) : (
                                                    formatPrice(price)
                                                )}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    onClose();
                                                    navigate(service.route(reportId));
                                                }}
                                                className={`inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${service.gradient} text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all transform hover:-translate-y-0.5`}
                                            >
                                                {lang === 'es' ? 'Iniciar' : 'Start'}
                                                <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Coming Soon teaser */}
                    <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-5 text-center">
                        <p className="text-sm text-slate-400 font-medium">
                            {lang === 'es'
                                ? '🚀 Próximamente: Auditoría de Funnel de Ventas, Análisis de Mercado Internacional...'
                                : '🚀 Coming soon: Sales Funnel Audit, International Market Analysis...'}
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                .animate-in {
                    animation: modalIn 0.25s ease-out;
                }
                @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );
}
