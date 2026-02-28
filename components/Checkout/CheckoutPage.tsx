import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';
import {
    CreditCard, Shield, CheckCircle, Loader2, ArrowLeft,
    FileText, Target, BarChart3, Lightbulb, Rocket, Zap, Sparkles
} from 'lucide-react';

interface CheckoutPageProps {
    reportId: string;
    businessName: string;
    onBack: () => void;
    onSuccess: () => void;
}

export default function CheckoutPage({ reportId, businessName, onBack, onSuccess }: CheckoutPageProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePayment = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;

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
                        report_id: reportId,
                        success_url: `${window.location.origin}/dashboard/payment/success?report_id=${reportId}`,
                        failure_url: `${window.location.origin}/dashboard/payment/failure?report_id=${reportId}`,
                    }),
                }
            );

            const data = await response.json();
            console.log('Payment response:', response.status, data);

            if (!response.ok) {
                throw new Error(data.details ? `${data.error}: ${JSON.stringify(data.details)}` : data.error || 'Error al crear el pago');
            }

            // Redirect to MercadoPago checkout
            // Use sandbox_init_point for testing, init_point for production
            const checkoutUrl = data.sandbox_init_point || data.init_point;
            window.location.href = checkoutUrl;

        } catch (err: any) {
            console.error('Payment error:', err);
            setError(err.message || 'Error al procesar el pago. Intentá de nuevo.');
            setLoading(false);
        }
    };

    const features = [
        { icon: Target, label: 'Buyer Personas detallados' },
        { icon: BarChart3, label: 'Análisis competitivo completo' },
        { icon: Lightbulb, label: 'Oportunidades de océano azul' },
        { icon: Rocket, label: 'Plan de acción personalizado' },
        { icon: Zap, label: 'Canales de adquisición optimizados' },
        { icon: FileText, label: 'Informe descargable en PDF' },
    ];

    return (
        <div className="min-h-[calc(100vh-57px)] bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">

                {/* Back button */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition mb-6"
                >
                    <ArrowLeft size={16} />
                    Volver
                </button>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FileText size={32} />
                        </div>
                        <h1 className="text-2xl font-extrabold mb-1">Análisis Estratégico</h1>
                        <p className="text-indigo-100">Para: <strong>{businessName}</strong></p>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        {/* What's included */}
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                            ¿Qué incluye tu informe?
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                            {features.map((feature, i) => {
                                const Icon = feature.icon;
                                return (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                        <Icon size={18} className="text-indigo-600 flex-shrink-0" />
                                        <span className="text-sm font-medium text-slate-700">{feature.label}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Price */}
                        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl p-6 text-center mb-6 border border-indigo-100">
                            <div className="flex items-baseline justify-center gap-1 mb-1">
                                <span className="text-4xl font-extrabold text-slate-900">$5</span>
                                <span className="text-lg font-bold text-slate-500">USD</span>
                            </div>
                            <p className="text-sm text-slate-500">Pago único · Sin suscripción</p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-4 text-sm border border-red-200">
                                {error}
                            </div>
                        )}

                        {/* Pay button */}
                        <button
                            onClick={handlePayment}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-indigo-200 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <CreditCard size={20} />
                                    Pagar con MercadoPago
                                </>
                            )}
                        </button>

                        {/* Free trial button (testing/beta) */}
                        {import.meta.env.VITE_FREE_TRIAL === 'true' && (
                            <button
                                onClick={async () => {
                                    // Mark as paid and skip payment
                                    await supabase
                                        .from('business_reports')
                                        .update({ is_paid: true, payment_status: 'paid' })
                                        .eq('id', reportId);
                                    onSuccess();
                                }}
                                disabled={loading}
                                className="w-full mt-3 flex items-center justify-center gap-2 border-2 border-dashed border-emerald-300 text-emerald-700 py-3 rounded-2xl font-semibold text-sm hover:bg-emerald-50 transition disabled:opacity-50"
                            >
                                <Sparkles size={16} />
                                Obtener análisis gratuito (beta)
                            </button>
                        )}

                        {/* Trust badges */}
                        <div className="flex items-center justify-center gap-4 mt-6 text-xs text-slate-400">
                            <div className="flex items-center gap-1">
                                <Shield size={14} />
                                <span>Pago seguro</span>
                            </div>
                            <span>·</span>
                            <span>Powered by MercadoPago</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
