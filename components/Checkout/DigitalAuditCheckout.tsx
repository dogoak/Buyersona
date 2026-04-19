import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';
import {
    Shield, CheckCircle, ArrowLeft,
    Globe, Search, Zap, Sparkles,
    BarChart3, TrendingUp, Bot, Star
} from 'lucide-react';

export default function DigitalAuditCheckout() {
    const { auditId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [lang] = useState('es');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reportPrice, setReportPrice] = useState<number | null>(null);
    const [auditName, setAuditName] = useState<string>('Auditoría Digital');

    useEffect(() => {
        if (!user || !auditId) return;

        const fetchData = async () => {
            try {
                // Fetch pricing
                const { data: settings } = await supabase
                    .from('system_settings')
                    .select('digital_audit_price_ars')
                    .eq('id', 1)
                    .single();

                if (settings) setReportPrice((settings as any).digital_audit_price_ars || 18000);

                // Fetch audit info for display
                const { data: audit } = await supabase
                    .from('digital_audits')
                    .select('audit_name, business_reports!digital_audits_business_report_id_fkey(business_name)')
                    .eq('id', auditId)
                    .single();

                if (audit) {
                    const bName = (audit as any).business_reports?.business_name;
                    setAuditName(bName ? `Auditoría Digital — ${bName}` : 'Auditoría Digital');
                }
            } catch (err) {
                console.error('Initial fetch failed:', err);
            }
        };

        fetchData();
    }, [user, auditId]);

    const handlePayment = async () => {
        if (!user || !auditId) return;

        setLoading(true);
        setError(null);

        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;

            if (!token) throw new Error("Su sesión ha expirado.");

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                    },
                    body: JSON.stringify({
                        audit_id: auditId,
                        success_url: `${window.location.origin}/dashboard/payment/success?audit_id=${auditId}`,
                        failure_url: `${window.location.origin}/dashboard/payment/failure?audit_id=${auditId}`,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.details ? `${data.error}: ${JSON.stringify(data.details)}` : data.error || 'Error al crear el pago');
            }

            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const checkoutUrl = isLocal
                ? (data.sandbox_init_point || data.init_point)
                : (data.init_point || data.sandbox_init_point);

            window.location.href = checkoutUrl;

        } catch (err: any) {
            console.error('Payment error:', err);
            setError(err.message || 'Error al procesar el pago. Intentá de nuevo.');
            setLoading(false);
        }
    };

    const features = [
        { icon: Globe, label: lang === 'es' ? 'Auditoría Web Técnica (SSL, speed, mobile)' : 'Technical Web Audit' },
        { icon: Search, label: lang === 'es' ? 'SEO + Keywords Gap Analysis' : 'SEO + Keywords Gap Analysis' },
        { icon: Bot, label: lang === 'es' ? 'AI-Readiness (AEO — vanguardia)' : 'AI-Readiness (AEO — cutting edge)' },
        { icon: TrendingUp, label: lang === 'es' ? 'Benchmark vs Competidores' : 'Competitor Benchmark' },
        { icon: Star, label: lang === 'es' ? 'Referentes del Rubro + Posts Virales' : 'Industry Leaders + Viral Posts' },
        { icon: BarChart3, label: lang === 'es' ? 'Roadmap 30/60/90 con KPIs' : '30/60/90 Roadmap with KPIs' },
    ];

    if (!user) {
        navigate('/login');
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition mb-6"
                    >
                        <ArrowLeft size={16} />
                        {lang === 'es' ? 'Cancelar y volver al Dashboard' : 'Cancel and return'}
                    </button>

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white text-center">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Globe size={32} />
                            </div>
                            <h1 className="text-2xl font-extrabold mb-1">Auditoría de Presencia Digital</h1>
                            <p className="text-emerald-100">{auditName}</p>
                        </div>

                        <div className="p-8">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                                {lang === 'es' ? 'Incluye en tu diagnóstico' : 'Included in your diagnosis'}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                                {features.map((feature, i) => {
                                    const Icon = feature.icon;
                                    return (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                            <Icon size={18} className="text-emerald-600 flex-shrink-0" />
                                            <span className="text-sm font-medium text-slate-700">{feature.label}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 text-center mb-6 border border-emerald-100">
                                <div className="flex items-baseline justify-center gap-1 mb-1">
                                    <span className="text-4xl font-extrabold text-slate-900">
                                        {reportPrice ? `$${reportPrice.toLocaleString('es-AR')}` : '...'}
                                    </span>
                                    <span className="text-lg font-bold text-slate-500">ARS</span>
                                </div>
                                <p className="text-sm text-slate-500 font-medium">Pago único, diagnóstico completo.</p>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handlePayment}
                                disabled={loading || !reportPrice}
                                className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${(loading || !reportPrice)
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl hover:shadow-emerald-600/30'
                                    }`}
                            >
                                {loading && <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white mr-2"></div>}
                                {lang === 'es' ? 'Abonar con MercadoPago' : 'Pay with MercadoPago'}
                            </button>

                            <div className="mt-6 flex items-center justify-center gap-6 opacity-60 flex-wrap">
                                <div className="flex items-center gap-1 text-slate-500 text-xs font-semibold">
                                    <Shield size={14} /> Pago 100% Seguro
                                </div>
                            </div>

                            {/* Beta skip button */}
                            {import.meta.env.VITE_FREE_TRIAL === 'true' && (
                                <button
                                    onClick={async () => {
                                        try {
                                            await supabase
                                                .from('digital_audits')
                                                .update({
                                                    is_paid: false,
                                                    payment_status: 'unpaid',
                                                    status: 'pending'
                                                })
                                                .eq('id', auditId);
                                            navigate(`/digital-audit/report/${auditId}`);
                                        } catch (err) {
                                            console.error(err);
                                        }
                                    }}
                                    disabled={loading}
                                    className="w-full mt-3 flex items-center justify-center gap-2 border-2 border-dashed border-emerald-300 text-emerald-700 py-3 rounded-2xl font-semibold text-sm hover:bg-emerald-50 transition disabled:opacity-50"
                                >
                                    <Sparkles size={16} />
                                    Obtener Auditoría gratuita (beta)
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
