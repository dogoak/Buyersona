import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { Dashboard } from '../Dashboard';
import { Language, StrategicAnalysis } from '../../types';
import { ArrowLeft, Loader2, Download } from 'lucide-react';

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
                .eq('user_id', user.id)
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

    const handleDownloadPDF = () => {
        setDownloading(true);
        setTimeout(() => {
            window.print();
            setDownloading(false);
        }, 300);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="text-center py-20">
                <p className="text-red-600 mb-4">{error || 'Reporte no encontrado'}</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="text-indigo-600 font-semibold hover:underline"
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
                    data={report.analysis_result as StrategicAnalysis}
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
