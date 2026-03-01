import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { Dashboard } from '../Dashboard';
import AnalysisLoader from '../AnalysisLoader';
import { analyzeBusinessGrowth } from '../../services/geminiService';
import { Language, StrategicAnalysis } from '../../types';
import { ArrowLeft, Loader2, Download, AlertCircle } from 'lucide-react';

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
