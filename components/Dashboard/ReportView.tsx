import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { Dashboard } from '../Dashboard';
import AnalysisLoader from '../AnalysisLoader';
import { analyzeBusinessGrowth } from '../../services/geminiService';
import { Language, StrategicAnalysis } from '../../types';
import { ArrowLeft, Loader2, Download, AlertCircle, Heart, CreditCard } from 'lucide-react';

interface ReportViewProps {
    lang: Language;
}

export default function ReportView({ lang }: ReportViewProps) {
    const { reportId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        fetchReport();
    }, [reportId]);

    const fetchReport = async () => {
        if (!reportId || !user) return;

        try {
            const { data, error: fetchError } = await supabase
                .from('business_reports')
                .select('*')
                .eq('id', reportId)
                .single();

            if (fetchError) throw fetchError;
            setReport(data);
        } catch (err: any) {
            console.error('Error fetching report:', err);
            setError('No se pudo cargar el reporte.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (report && report.is_paid && (report.status === 'draft' || report.status === 'failed')) {
            runAnalysis(report);
        }
    }, [report]);

    const [analyzing, setAnalyzing] = useState(false);

    const runAnalysis = async (currentReport: any) => {
        if (analyzing) return;
        setAnalyzing(true);
        setError(null);

        try {
            // Update status to analyzing
            await supabase
                .from('business_reports')
                .update({ status: 'analyzing' })
                .eq('id', currentReport.id);

            // Run AI analysis
            const onboardingData = currentReport.onboarding_data;
            const result = await analyzeBusinessGrowth(onboardingData, lang);

            // Save analysis result
            await supabase
                .from('business_reports')
                .update({
                    analysis_result: result,
                    status: 'completed'
                })
                .eq('id', currentReport.id);

            // Update local state
            setReport({ ...currentReport, status: 'completed', analysis_result: result });

        } catch (err: any) {
            console.error('Analysis failed:', err);
            setError(err.message || 'Error al generar el análisis de IA.');

            await supabase
                .from('business_reports')
                .update({ status: 'failed' })
                .eq('id', currentReport.id);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleDownloadPDF = () => {
        setDownloading(true);
        setTimeout(() => {
            window.print();
            setDownloading(false);
        }, 300);
    };

    const handleVoluntaryPayment = async () => {
        if (!user || !report) return;

        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;

            if (!token) {
                throw new Error("Su sesión ha expirado. Por favor recargue la página.");
            }

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
                        report_id: report.id,
                        success_url: `${window.location.origin}/dashboard/payment/success?report_id=${report.id}`,
                        failure_url: `${window.location.origin}/dashboard/payment/failure?report_id=${report.id}`,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al iniciar pago voluntario');
            }

            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const checkoutUrl = isLocal ? (data.sandbox_init_point || data.init_point) : (data.init_point || data.sandbox_init_point);

            window.location.href = checkoutUrl;

        } catch (err: any) {
            console.error('Voluntary Payment error:', err);
            setError(err.message || 'Error al procesar. Intentalo de nuevo más tarde.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 min-h-[50vh]">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    if (analyzing || report?.status === 'analyzing') {
        return <AnalysisLoader lang={lang} />;
    }

    if (error || !report) {
        return (
            <div className="flex flex-col items-center justify-center py-20 min-h-[50vh] px-4">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <p className="text-slate-800 font-semibold mb-2">{error || 'Reporte no encontrado'}</p>
                <p className="text-slate-500 text-sm mb-6 text-center max-w-md">Si acabás de pagar, el reporte podría demorar unos segundos en procesarse. Intentá recargar la página.</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition"
                >
                    Volver al panel
                </button>
            </div>
        );
    }

    if (report.status === 'completed' && report.analysis_result) {
        return (
            <div>
                {/* Back button bar - hidden when printing */}
                <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-[57px] z-40 print:hidden">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition"
                        >
                            <ArrowLeft size={16} />
                            Volver a Mis Reportes
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500 hidden sm:inline">
                                {report.business_name}
                            </span>
                            <button
                                onClick={handleDownloadPDF}
                                disabled={downloading}
                                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition disabled:opacity-50"
                            >
                                {downloading ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Download size={14} />
                                )}
                                {downloading ? 'Generando...' : 'Descargar PDF'}
                            </button>
                        </div>
                    </div>
                </div>

                <Dashboard
                    data={((report.analysis_result as any)?.result || report.analysis_result) as StrategicAnalysis}
                    lang={lang}
                    onReset={() => navigate('/dashboard')}
                />

                {/* --- NUEVO BLOQUE: Solo visible si es un pago voluntario --- */}
                {report.is_voluntary_payment && (
                    <div className="max-w-4xl mx-auto my-16 print:hidden">
                        <div className="relative bg-gradient-to-br from-indigo-900 via-violet-900 to-fuchsia-900 rounded-[2.5rem] p-10 sm:p-14 text-center shadow-2xl overflow-hidden isolation-auto">
                            {/* Decorative background elements */}
                            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20"></div>
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
                            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

                            <div className="mx-auto w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl shadow-inner border border-white/20 flex items-center justify-center mb-8 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                                <Heart size={40} className="text-pink-400 fill-pink-400 animate-pulse" />
                            </div>

                            <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-6 tracking-tight">
                                ¿Buyersona aportó valor a tu negocio?
                            </h3>

                            <p className="text-indigo-100/90 mb-10 max-w-2xl mx-auto text-lg sm:text-xl leading-relaxed font-light">
                                Desarrollar y mantener esta inteligencia artificial tiene costos operativos altos.
                                Si este análisis estratégico te pareció útil y querés ayudarnos a mantener la plataforma viva,
                                <strong className="text-white font-bold block mt-2"> podés aportar pagando de forma voluntaria el costo del informe.</strong>
                            </p>

                            <button
                                onClick={handleVoluntaryPayment}
                                className="group relative inline-flex items-center justify-center gap-3 bg-white text-indigo-900 px-10 py-5 rounded-2xl font-black text-xl hover:bg-indigo-50 transition-all transform hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] w-full sm:w-auto overflow-hidden"
                            >
                                <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
                                <CreditCard size={24} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                                <span className="relative">Aportar y apoyar el proyecto</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="text-center py-20">
            <p className="text-slate-500">Este reporte aún no tiene resultados.</p>
            <button
                onClick={() => navigate('/dashboard')}
                className="text-indigo-600 font-semibold hover:underline mt-4 inline-block"
            >
                Volver al panel
            </button>
        </div>
    );
}
