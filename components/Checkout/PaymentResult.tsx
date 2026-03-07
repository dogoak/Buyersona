import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { CheckCircle, XCircle, Clock, Loader2, ArrowRight, RotateCcw } from 'lucide-react';

interface PaymentResultProps {
    status: 'success' | 'failure' | 'pending';
}

export default function PaymentResult({ status }: PaymentResultProps) {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const reportId = searchParams.get('report_id');
    const analysisId = searchParams.get('analysis_id');
    const paymentId = searchParams.get('payment_id') || `manual_${Date.now()}`;
    const [checking, setChecking] = useState(status === 'success');

    // If success, verify payment and trigger analysis
    useEffect(() => {
        if (status === 'success' && (reportId || analysisId)) {
            verifyAndProceed();
        }
    }, [status, reportId, analysisId]);

    const verifyAndProceed = async () => {
        setChecking(true);

        // Give webhook a moment to process
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if report is marked as paid
        if (analysisId) {
            const { data: analysis } = await supabase
                .from('product_analyses')
                .select('is_paid, status')
                .eq('id', analysisId)
                .single();

            if (analysis?.is_paid || status === 'success') {
                if (!analysis?.is_paid && user) {
                    await supabase
                        .from('product_analyses')
                        .update({ is_paid: true })
                        .eq('id', analysisId);
                }
                setChecking(false);
            } else {
                setChecking(false);
            }
        } else if (reportId) {
            const { data: report } = await supabase
                .from('business_reports')
                .select('is_paid, status, is_voluntary_payment')
                .eq('id', reportId)
                .single();

            if (report?.is_paid || status === 'success') {
                if (!report?.is_paid && user) {
                    // If the report was a voluntary/beta report, keep the flag so we can track
                    // that it was originally free and then paid voluntarily
                    const wasVoluntary = report?.is_voluntary_payment || false;
                    await supabase
                        .from('business_reports')
                        .update({ is_paid: true, payment_status: 'paid', is_voluntary_payment: wasVoluntary })
                        .eq('id', reportId);

                    // Fetch current price to log it properly if missing
                    const { data: settings } = await supabase.from('system_settings').select('report_price_ars').eq('id', 1).single();
                    const priceArs = settings?.report_price_ars || 5000;

                    // Update ALL pending payment rows for this report to succeeded
                    const { error: paymentError } = await supabase
                        .from('payments')
                        .update({
                            status: 'succeeded',
                            external_payment_id: paymentId,
                        })
                        .eq('business_report_id', reportId)
                        .eq('user_id', user.id)
                        .eq('status', 'pending');

                    if (paymentError) console.log('Payment update error', paymentError);

                    // Fallback: if no pending row existed, insert one
                    const { data: existingPayments } = await supabase
                        .from('payments')
                        .select('id')
                        .eq('business_report_id', reportId)
                        .eq('status', 'succeeded')
                        .limit(1);

                    if (!existingPayments || existingPayments.length === 0) {
                        await supabase.from('payments').insert({
                            business_report_id: reportId,
                            user_id: user.id,
                            status: 'succeeded',
                            amount: priceArs,
                            external_payment_id: paymentId,
                            currency: 'ARS',
                            payment_provider: 'mercadopago',
                        });
                    }
                }

                setChecking(false);
            } else {
                setChecking(false);
            }
        } else {
            setChecking(false);
        }
    };

    if (checking) {
        return (
            <div className="min-h-[calc(100vh-57px)] flex flex-col items-center justify-center bg-slate-50 p-8">
                <Loader2 size={40} className="animate-spin text-indigo-600 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Verificando tu pago...</h2>
                <p className="text-slate-500">Esto toma unos segundos</p>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-[calc(100vh-57px)] flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-50 p-8">
                <div className="bg-white rounded-3xl border border-emerald-200 p-10 max-w-md text-center shadow-lg">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} className="text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 mb-2">¡Pago exitoso!</h2>
                    <p className="text-slate-500 mb-8">
                        Tu pago fue procesado correctamente. Ya podés generar tu informe estratégico.
                    </p>
                    <button
                        onClick={() => {
                            if (analysisId) {
                                navigate(`/dashboard`);
                            } else {
                                navigate(`/dashboard/report/${reportId}`);
                            }
                        }}
                        className="group inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-xl hover:shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
                    >
                        {analysisId ? 'Volver al panel' : 'Ver mi informe'}
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'pending') {
        return (
            <div className="min-h-[calc(100vh-57px)] flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-slate-50 p-8">
                <div className="bg-white rounded-3xl border border-amber-200 p-10 max-w-md text-center shadow-lg">
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock size={40} className="text-amber-600" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Pago pendiente</h2>
                    <p className="text-slate-500 mb-8">
                        Tu pago está siendo procesado. Te notificaremos cuando se confirme y podrás acceder a tu informe.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center gap-2 bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-900 transition"
                    >
                        Ir al panel
                    </button>
                </div>
            </div>
        );
    }

    // Failure
    return (
        <div className="min-h-[calc(100vh-57px)] flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-slate-50 p-8">
            <div className="bg-white rounded-3xl border border-red-200 p-10 max-w-md text-center shadow-lg">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle size={40} className="text-red-600" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Pago no realizado</h2>
                <p className="text-slate-500 mb-8">
                    No pudimos procesar tu pago. Podés intentar nuevamente o volver más tarde.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center gap-2 px-6 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition"
                    >
                        Ir al panel
                    </button>
                    <button
                        onClick={() => {
                            if (analysisId) {
                                navigate(`/deep-dive/checkout/${analysisId}`);
                            } else if (reportId) {
                                navigate(`/checkout/${reportId}`);
                            } else {
                                navigate('/dashboard');
                            }
                        }}
                        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition"
                    >
                        <RotateCcw size={16} />
                        Reintentar
                    </button>
                </div>
            </div>
        </div>
    );
}
