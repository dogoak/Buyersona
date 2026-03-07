import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import {
    FileText, Plus, Clock, CheckCircle, Loader2,
    Eye, Trash2, Share2, Download, BarChart3, ArrowRight, XCircle,
    Rocket, Target, TrendingUp, Sparkles, Building2, CreditCard, Search, Heart
} from 'lucide-react';
import { analyzeProductDeepDive } from '../../services/geminiDeepDiveService';
import { StrategicAnalysis, DeepDiveInput } from '../../types';

interface Report {
    id: string;
    business_name: string;
    status: string;
    is_paid: boolean;
    is_voluntary_payment?: boolean;
    payment_status?: string;
    created_at: string;
    updated_at: string;
    onboarding_data: any;
    analysis_result?: any;
    current_step: number;
    type?: 'business' | 'product';
    parent_report_id?: string;
    parent_analysis_result?: any;
}

export default function ReportsList() {
    const { user, lang } = useAuth();
    const navigate = useNavigate();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [payingVoluntary, setPayingVoluntary] = useState<string | null>(null);

    const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Usuario';
    const firstName = userName.split(' ')[0];

    useEffect(() => {
        fetchReports();
    }, [user]);

    const fetchReports = async () => {
        if (!user) return;

        try {
            const { data: businessData, error: businessError } = await supabase
                .from('business_reports')
                .select('id, user_id, created_at, updated_at, business_name, status, is_paid, is_voluntary_payment, payment_status, onboarding_data, current_step, api_cost_usd')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (businessError) throw businessError;

            const { data: productData, error: productError } = await supabase
                .from('product_analyses')
                .select('id, status, is_paid, created_at, updated_at, product_input_data, analysis_result, business_report_id, business_reports!product_analyses_business_report_id_fkey!inner(business_name)')
                .eq('business_reports.user_id', user.id)
                .order('created_at', { ascending: false });

            if (productError) throw productError;

            const unifiedReports: Report[] = [
                ...(businessData || []).map(r => ({ ...r, type: 'business' as const })),
                ...(productData || []).map((p: any) => ({
                    id: p.id,
                    business_name: `${p.business_reports.business_name} | ${(p.product_input_data as any)?.productName || 'Producto'}`,
                    status: p.status,
                    is_paid: p.is_paid,
                    created_at: p.created_at,
                    updated_at: p.updated_at,
                    onboarding_data: p.product_input_data,
                    analysis_result: p.analysis_result,
                    current_step: 7,
                    type: 'product' as const,
                    parent_report_id: p.business_report_id,
                    // Note: analysis_result is null here to keep payload small, 
                    // report view will fetch its own full data.
                    parent_analysis_result: null
                }))
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setReports(unifiedReports);
        } catch (err) {
            console.error('Error fetching reports:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const pendingProduct = reports.find(r => r.type === 'product' && r.is_paid && r.status === 'draft');
        if (pendingProduct) {
            generateDeepDive(pendingProduct);
        }
    }, [reports]);

    const generateDeepDive = async (report: Report) => {
        setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'analyzing' } : r));
        await supabase.from('product_analyses').update({ status: 'analyzing' }).eq('id', report.id);

        try {
            // Fetch parent analysis result AND onboarding data on-demand
            const { data: parentData, error: pError } = await supabase
                .from('business_reports')
                .select('analysis_result, onboarding_data')
                .eq('id', report.parent_report_id)
                .single();

            if (pError || !parentData?.analysis_result) throw new Error('Parent analysis result not found');

            const parentResult = parentData.analysis_result as StrategicAnalysis;
            const inputData = report.onboarding_data as DeepDiveInput;

            // Strip heavy base64 fields from onboarding data
            let parentOnboarding: Record<string, any> | null = null;
            if (parentData.onboarding_data) {
                const { productImages, documents, ...light } = parentData.onboarding_data as any;
                parentOnboarding = light;
            }

            const { result } = await analyzeProductDeepDive(parentResult, parentOnboarding, inputData, lang);

            await supabase
                .from('product_analyses')
                .update({ status: 'completed', analysis_result: result })
                .eq('id', report.id);

            setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'completed', analysis_result: result } : r));
        } catch (err) {
            console.error('Failed deep dive gen:', err);
            await supabase.from('product_analyses').update({ status: 'failed' }).eq('id', report.id);
            setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'failed' } : r));
        }
    };

    const handleDelete = async (reportId: string, type: 'business' | 'product', e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('¿Estás seguro de que querés eliminar este reporte?')) return;

        setDeleting(reportId);
        try {
            const table = type === 'business' ? 'business_reports' : 'product_analyses';
            const { error } = await supabase
                .from(table)
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

    const getStatusConfig = (report: Report) => {
        const { status, is_paid, is_voluntary_payment, payment_status } = report;
        if (status === 'completed') {
            if (is_paid && !is_voluntary_payment) {
                return { label: 'Pagado', icon: CheckCircle, colors: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
            }
            if (is_voluntary_payment && payment_status === 'paid') {
                return { label: 'Voluntario ✓', icon: Heart, colors: 'bg-purple-50 text-purple-700 border-purple-200' };
            }
            if (is_voluntary_payment && payment_status !== 'paid') {
                return { label: 'Gratuito (Beta)', icon: Sparkles, colors: 'bg-blue-50 text-blue-700 border-blue-200' };
            }
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

                <div className="bg-white rounded-2xl p-6 border border-slate-200 text-left relative overflow-hidden">
                    <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center mb-4">
                        <TrendingUp size={24} className="text-violet-600" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">Product Deep Dive</h3>
                    <p className="text-slate-500 text-sm">Crealo desde la vista de cualquier análisis de negocio que ya tengas listo.</p>
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
                            const statusConfig = getStatusConfig(report);
                            const StatusIcon = statusConfig.icon;
                            const isClickable = report.status === 'completed' || report.status === 'draft';

                            return (
                                <div
                                    key={report.id}
                                    onClick={() => {
                                        if (report.status === 'completed') {
                                            if (report.type === 'product') navigate(`/deep-dive/report/${report.id}`);
                                            else navigate(`/dashboard/report/${report.id}`);
                                        }
                                        if (report.status === 'draft') {
                                            if (report.type === 'product') navigate(`/deep-dive/checkout/${report.id}`);
                                            else if (report.current_step >= 6) navigate(`/checkout/${report.id}`);
                                            else navigate(`/onboarding/${report.id}`);
                                        }
                                    }}
                                    className={`bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 transition-all group ${isClickable
                                        ? 'hover:shadow-lg hover:border-indigo-200 cursor-pointer hover:-translate-y-0.5 transform'
                                        : ''
                                        }`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        {/* Report Info */}
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                                                {report.type === 'product' ? <Search size={22} className="text-violet-600" /> : <BarChart3 size={22} className="text-indigo-600" />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${report.type === 'product' ? 'bg-violet-100 text-violet-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                        {report.type === 'product' ? 'Product Deep Dive' : 'Análisis Estratégico'}
                                                    </span>
                                                </div>
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
                                        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                                            {isClickable && (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (report.type === 'product') navigate(`/deep-dive/report/${report.id}`);
                                                            else navigate(`/dashboard/report/${report.id}`);
                                                        }}
                                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${report.type === 'product'
                                                            ? 'bg-violet-50 text-violet-700 hover:bg-violet-100'
                                                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                                            }`}
                                                    >
                                                        <Eye size={14} /> Ver
                                                    </button>
                                                    {report.type === 'business' && report.status === 'completed' && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/deep-dive/new/${report.id}`); }}
                                                            title="Product Deep Dive"
                                                            className="relative flex items-center gap-1.5 px-3 py-2 bg-violet-50 text-violet-600 rounded-lg text-sm font-semibold hover:bg-violet-100 transition"
                                                        >
                                                            <TrendingUp size={14} /> Deep Dive
                                                        </button>
                                                    )}
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
                                                (report.current_step >= 6 || report.current_step === null || report.current_step === undefined) ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (report.type === 'product') navigate(`/deep-dive/checkout/${report.id}`);
                                                            else navigate(`/checkout/${report.id}`);
                                                        }}
                                                        className={`flex items-center gap-1.5 px-4 py-2 text-white rounded-lg text-sm font-bold hover:shadow-lg transition ${report.type === 'product' ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600' : 'bg-gradient-to-r from-indigo-600 to-violet-600'
                                                            }`}
                                                    >
                                                        <CreditCard size={14} /> Pagar
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/onboarding/${report.id}`); }}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-bold hover:shadow-lg transition border border-amber-200"
                                                    >
                                                        <FileText size={14} /> Retomar
                                                    </button>
                                                )
                                            )}
                                            {/* Voluntary payment button for completed Beta reports */}
                                            {report.status === 'completed' && report.is_voluntary_payment && report.payment_status !== 'paid' && (
                                                <button
                                                    disabled={payingVoluntary === report.id}
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        setPayingVoluntary(report.id);
                                                        try {
                                                            const session = await supabase.auth.getSession();
                                                            const token = session.data.session?.access_token;
                                                            if (!token) throw new Error('Sesión expirada');
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
                                                            if (!response.ok) throw new Error(data.error || 'Error');
                                                            const isLocal = window.location.hostname === 'localhost';
                                                            window.location.href = isLocal ? (data.sandbox_init_point || data.init_point) : (data.init_point || data.sandbox_init_point);
                                                        } catch (err: any) {
                                                            alert('Error al iniciar pago: ' + err.message);
                                                            setPayingVoluntary(null);
                                                        }
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg text-xs font-bold hover:shadow-lg transition disabled:opacity-70"
                                                >
                                                    {payingVoluntary === report.id ? (
                                                        <><Loader2 size={12} className="animate-spin" /> Procesando...</>
                                                    ) : (
                                                        <><Heart size={12} className="hover:animate-pulse" /> Apoyar</>
                                                    )}
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
                                                onClick={(e) => handleDelete(report.id, report.type || 'business', e)}
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
