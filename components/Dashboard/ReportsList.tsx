import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import {
    FileText, Plus, Clock, CheckCircle, Loader2,
    Eye, Trash2, Share2, Download, BarChart3, ArrowRight, XCircle,
    Rocket, Target, TrendingUp, Sparkles, Building2, CreditCard
} from 'lucide-react';

interface Report {
    id: string;
    business_name: string;
    status: string;
    is_paid: boolean;
    created_at: string;
    updated_at: string;
    onboarding_data: any;
    analysis_result: any;
}

export default function ReportsList() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Usuario';
    const firstName = userName.split(' ')[0];

    useEffect(() => {
        fetchReports();
    }, [user]);

    const fetchReports = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('business_reports')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReports(data || []);
        } catch (err) {
            console.error('Error fetching reports:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (reportId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('¿Estás seguro de que querés eliminar este reporte?')) return;

        setDeleting(reportId);
        try {
            const { error } = await supabase
                .from('business_reports')
                .delete()
                .eq('id', reportId);

            if (error) throw error;
            setReports(prev => prev.filter(r => r.id !== reportId));
        } catch (err) {
            console.error('Error deleting report:', err);
        } finally {
            setDeleting(null);
        }
    };

    const getStatusConfig = (status: string, isPaid: boolean) => {
        if (status === 'completed') {
            return { label: 'Completo', icon: CheckCircle, colors: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        }
        if (status === 'analyzing') {
            return { label: 'Analizando...', icon: Loader2, colors: 'bg-blue-50 text-blue-700 border-blue-200', spin: true };
        }
        if (status === 'failed') {
            return { label: 'Error', icon: XCircle, colors: 'bg-red-50 text-red-700 border-red-200' };
        }
        if (status === 'draft') {
            return { label: 'Pendiente de pago', icon: CreditCard, colors: 'bg-amber-50 text-amber-700 border-amber-200' };
        }
        return { label: 'Borrador', icon: FileText, colors: 'bg-slate-50 text-slate-600 border-slate-200' };
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Hace un momento';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;

        return date.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return '¡Buenos días';
        if (hour < 18) return '¡Buenas tardes';
        return '¡Buenas noches';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-indigo-200 animate-ping opacity-20"></div>
                        <Loader2 className="animate-spin text-indigo-600 relative" size={36} />
                    </div>
                    <p className="text-slate-500 font-medium mt-4">Cargando tu panel...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Welcome Section */}
            <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                    {getGreeting()}, {firstName}! 👋
                </h1>
                <p className="text-slate-500 mt-2 text-lg">
                    {reports.length === 0
                        ? 'Estás a un paso de conocer a tu cliente ideal.'
                        : `Tenés ${reports.length} análisis estratégico${reports.length !== 1 ? 's' : ''} en tu cuenta.`
                    }
                </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                <button
                    onClick={() => navigate('/onboarding')}
                    className="group relative bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl p-6 text-left hover:shadow-xl hover:shadow-indigo-200 transition-all transform hover:-translate-y-1 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Rocket size={24} />
                        </div>
                        <h3 className="font-bold text-lg mb-1">Nuevo Análisis</h3>
                        <p className="text-indigo-100 text-sm">Generá un informe estratégico completo para tu negocio</p>
                    </div>
                </button>

                <button
                    onClick={() => navigate('/onboarding')}
                    className="group bg-white rounded-2xl p-6 border border-slate-200 text-left hover:border-indigo-200 hover:shadow-md transition-all transform hover:-translate-y-0.5"
                >
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                        <Target size={24} className="text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">Buyer Personas</h3>
                    <p className="text-slate-500 text-sm">Incluido en cada análisis: perfiles detallados de tus compradores ideales</p>
                </button>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 text-left relative overflow-hidden opacity-75">
                    <div className="absolute top-3 right-3 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">PRONTO</div>
                    <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center mb-4">
                        <TrendingUp size={24} className="text-violet-600" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">Product Deep Dive</h3>
                    <p className="text-slate-500 text-sm">Análisis profundo de un producto, basado en el contexto de tu empresa</p>
                </div>
            </div>

            {/* Empty State */}
            {reports.length === 0 && (
                <div className="bg-gradient-to-br from-white to-indigo-50/30 rounded-3xl border border-indigo-100 p-10 sm:p-16 text-center relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-violet-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/2 translate-y-1/2"></div>

                    <div className="relative">
                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
                            <Sparkles size={40} className="text-indigo-500" />
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
                            Tu primer análisis estratégico te espera
                        </h3>
                        <p className="text-slate-500 max-w-lg mx-auto mb-10 text-lg leading-relaxed">
                            Respondé unas preguntas sobre tu negocio y nuestra IA generará un informe
                            con <strong className="text-slate-700">buyer personas</strong>, <strong className="text-slate-700">canales de adquisición</strong>, <strong className="text-slate-700">análisis competitivo</strong> y un <strong className="text-slate-700">plan de acción</strong> personalizado.
                        </p>
                        <button
                            onClick={() => navigate('/onboarding')}
                            className="group inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-indigo-200 transition-all transform hover:-translate-y-1"
                        >
                            Crear mi primer análisis
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <p className="text-sm text-slate-400 mt-4">⏱ Toma aproximadamente 10 minutos</p>
                    </div>
                </div>
            )}

            {/* Reports List */}
            {reports.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Building2 size={20} className="text-indigo-600" />
                            Mis Análisis
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {reports.map((report) => {
                            const statusConfig = getStatusConfig(report.status, report.is_paid);
                            const StatusIcon = statusConfig.icon;
                            const isClickable = report.status === 'completed' || report.status === 'draft';

                            return (
                                <div
                                    key={report.id}
                                    onClick={() => {
                                        if (report.status === 'completed') navigate(`/dashboard/report/${report.id}`);
                                        if (report.status === 'draft') navigate(`/checkout/${report.id}`);
                                    }}
                                    className={`bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 transition-all group ${isClickable
                                        ? 'hover:shadow-lg hover:border-indigo-200 cursor-pointer hover:-translate-y-0.5 transform'
                                        : ''
                                        }`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        {/* Report Info */}
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                                                <BarChart3 size={22} className="text-indigo-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                                                    {report.business_name || 'Sin nombre'}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConfig.colors}`}>
                                                        <StatusIcon size={11} className={statusConfig.spin ? 'animate-spin' : ''} />
                                                        {statusConfig.label}
                                                    </span>
                                                    <span className="text-xs text-slate-400">{formatDate(report.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            {isClickable && (
                                                <>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/report/${report.id}`); }}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition"
                                                    >
                                                        <Eye size={14} /> Ver
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); /* TODO: navigate to deep dive */ }}
                                                        title="Product Deep Dive (Próximamente)"
                                                        className="relative flex items-center gap-1.5 px-3 py-2 bg-violet-50 text-violet-600 rounded-lg text-sm font-semibold hover:bg-violet-100 transition"
                                                    >
                                                        <TrendingUp size={14} /> Deep Dive
                                                        <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-[8px] font-bold text-white px-1.5 py-0.5 rounded-full leading-none">PRONTO</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => e.stopPropagation()}
                                                        title="Compartir"
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                    >
                                                        <Share2 size={15} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => e.stopPropagation()}
                                                        title="Descargar PDF"
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                    >
                                                        <Download size={15} />
                                                    </button>
                                                </>
                                            )}
                                            {report.status === 'draft' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/checkout/${report.id}`); }}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg text-sm font-bold hover:shadow-lg transition"
                                                >
                                                    <CreditCard size={14} /> Pagar
                                                </button>
                                            )}
                                            {report.status === 'failed' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate('/onboarding'); }}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-semibold hover:bg-amber-100 transition"
                                                >
                                                    Reintentar
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => handleDelete(report.id, e)}
                                                disabled={deleting === report.id}
                                                title="Eliminar"
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                            >
                                                {deleting === report.id ? (
                                                    <Loader2 size={15} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={15} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
