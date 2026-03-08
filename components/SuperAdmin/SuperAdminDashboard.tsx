import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import {
    Users, DollarSign, FileText, Activity, AlertCircle,
    CheckCircle, XCircle, Loader2, ArrowLeft, Calendar, Settings,
    ArrowUpRight, Search, Filter, Download, BarChart3, RefreshCw, Trash2, Cpu, Eye, X, UserCheck, MessageSquareHeart
} from 'lucide-react';
import { Dashboard } from '../Dashboard';
import { StrategicAnalysis } from '../../types';
import GlossaryModal from '../GlossaryModal';
import ProfundizarPanel from '../ProfundizarPanel';

const DEFAULT_EXCHANGE_RATE = 1050;

export default function SuperAdminDashboard() {
    const [isLoading, setIsLoading] = useState(true); // Changed from 'loading' to 'isLoading'
    const [rawProfiles, setRawProfiles] = useState<any[]>([]);
    const [rawReports, setRawReports] = useState<any[]>([]);
    const [rawPayments, setRawPayments] = useState<any[]>([]);
    const [rawLogs, setRawLogs] = useState<any[]>([]);
    const [rawSettings, setRawSettings] = useState<any>(null);
    const [rawDeepDives, setRawDeepDives] = useState<any[]>([]);
    const [rawFeedback, setRawFeedback] = useState<any[]>([]);

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'kpis' | 'usuarios' | 'logs' | 'settings' | 'finanzas' | 'feedback'>('kpis');
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [priceInput, setPriceInput] = useState<string>('');
    const [deepDivePriceInput, setDeepDivePriceInput] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOnboardingData, setSelectedOnboardingData] = useState<any | null>(null);
    const [exchangeRateInput, setExchangeRateInput] = useState<string>(DEFAULT_EXCHANGE_RATE.toString());
    // View as user state
    const [previewReport, setPreviewReport] = useState<any | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [profundizarOpen, setProfundizarOpen] = useState(false);
    const [profundizarSection, setProfundizarSection] = useState<{ title: string; content: string } | null>(null);

    // Quick Filters
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
    // Financial filters
    const [finTypeFilter, setFinTypeFilter] = useState<'all' | 'business' | 'deepdive'>('all');
    const [finStatusFilter, setFinStatusFilter] = useState<'all' | 'paid' | 'free' | 'voluntary' | 'failed' | 'draft'>('all');
    const [finDateFrom, setFinDateFrom] = useState<string>('');
    const [finDateTo, setFinDateTo] = useState<string>('');

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setIsLoading(true); // Changed from 'setLoading' to 'setIsLoading'
        setErrorMsg(null);
        try {
            // Optimized queries to avoid massive JSON payloads (analysis_result) which causes timeouts
            const [profilesRes, reportsRes, paymentsRes, logsRes, settingsRes, deepDiveRes, feedbackRes] = await Promise.all([
                supabase.from('profiles').select('id, email, full_name, created_at, role'),
                supabase.from('business_reports').select('id, user_id, created_at, business_name, status, is_paid, is_voluntary_payment, payment_status, current_step, api_cost_usd, onboarding_data, error_details, product_analyses!product_analyses_business_report_id_fkey(id)'),
                supabase.from('payments').select('*'),
                supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(500),
                supabase.from('system_settings').select('*').eq('id', 1).single(),
                supabase.from('product_analyses').select('id, business_report_id, product_name, status, is_paid, created_at, product_input_data, business_reports!product_analyses_business_report_id_fkey(user_id, business_name)'),
                supabase.from('report_feedback').select('*').order('created_at', { ascending: false })
            ]);

            if (profilesRes.error) throw new Error("Fallo al cargar usuarios: " + profilesRes.error.message);
            if (reportsRes.error) throw new Error("Falta política RLS para reportes: " + reportsRes.error.message);
            if (paymentsRes.error) throw new Error("Fallo al cargar pagos: " + paymentsRes.error.message);
            if (logsRes.error) throw new Error("Fallo al cargar logs: " + logsRes.error.message);

            setRawProfiles(profilesRes.data || []);
            setRawReports(reportsRes.data || []);
            setRawPayments(paymentsRes.data || []);
            setRawLogs(logsRes.data || []);
            setRawSettings(settingsRes.data || null);
            setRawDeepDives(deepDiveRes.data || []);
            setRawFeedback(feedbackRes.data || []);
            if (settingsRes.data?.report_price_ars) setPriceInput(settingsRes.data.report_price_ars.toString());
            if (settingsRes.data?.deep_dive_price_ars) setDeepDivePriceInput(settingsRes.data.deep_dive_price_ars.toString());
            if (settingsRes.data?.exchange_rate_usd) setExchangeRateInput(settingsRes.data.exchange_rate_usd.toString());

        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message);
        } finally {
            setIsLoading(false); // Changed from 'setLoading' to 'setIsLoading'
        }
    };

    // View as User: Fetch full report with analysis_result
    const loadReportPreview = async (reportId: string) => {
        setPreviewLoading(true);
        try {
            const { data, error } = await supabase
                .from('business_reports')
                .select('*')
                .eq('id', reportId)
                .single();
            if (error) throw error;
            setPreviewReport(data);
        } catch (err: any) {
            alert('Error cargando el reporte: ' + err.message);
        } finally {
            setPreviewLoading(false);
        }
    };

    // Derived State (Filtered by Date)
    // Build unified financial ledger (ALL reports + deep dives)
    const financialLedger = useMemo(() => {
        const entries: any[] = [];

        // Business Reports
        rawReports.forEach(r => {
            if (r.status === 'draft' && !r.is_paid) {
                // Include drafts only if they have some data
                if (r.current_step <= 1) return;
            }
            const profile = rawProfiles.find(p => p.id === r.user_id);
            const payment = rawPayments.find(p => p.business_report_id === r.id && p.status === 'succeeded');
            const apiCostUsd = Number(r.api_cost_usd) || 0;

            let paymentLabel = 'Gratuito (Beta)';
            let revenue = 0;
            if (r.is_paid && r.is_voluntary_payment && r.payment_status === 'paid') {
                paymentLabel = 'Voluntario (pagó)';
                revenue = payment?.amount || 0;
            } else if (r.is_paid && r.is_voluntary_payment) {
                paymentLabel = 'Voluntario (pendiente)';
            } else if (r.is_paid && !r.is_voluntary_payment) {
                paymentLabel = 'Pagado';
                revenue = payment?.amount || 0;
            }
            if (r.status === 'failed') paymentLabel = 'Fallo IA';
            if (r.status === 'draft') paymentLabel = 'Abandonado';

            const exchangeRate = Number(exchangeRateInput) || DEFAULT_EXCHANGE_RATE;

            entries.push({
                id: r.id,
                date: r.created_at,
                type: 'business' as const,
                typeBadge: 'Análisis de Negocio',
                name: r.business_name || 'Sin nombre',
                userEmail: profile?.email || 'Desconocido',
                userName: profile?.full_name || '',
                status: r.status,
                paymentLabel,
                revenue,
                apiCostUsd,
                apiCostArs: apiCostUsd * exchangeRate,
                profit: revenue - (apiCostUsd * exchangeRate),
                isPaid: r.is_paid,
                isVoluntary: r.is_voluntary_payment,
            });
        });

        // Deep Dives (Product Analyses)
        rawDeepDives.forEach(dd => {
            const parentReport = rawReports.find(r => r.id === dd.business_report_id);
            const userId = (dd.business_reports as any)?.user_id || parentReport?.user_id;
            const profile = rawProfiles.find(p => p.id === userId);
            const payment = rawPayments.find(p => p.product_analysis_id === dd.id && p.status === 'succeeded');
            const productName = dd.product_name || (dd.product_input_data as any)?.productName || 'Deep Dive';

            let paymentLabel = 'Gratuito';
            let revenue = 0;
            if (dd.is_paid && payment) {
                paymentLabel = 'Pagado';
                revenue = payment?.amount || 0;
            } else if (dd.is_paid) {
                paymentLabel = 'Pagado';
            }
            if (dd.status === 'failed') paymentLabel = 'Fallo IA';

            entries.push({
                id: dd.id,
                date: dd.created_at,
                type: 'deepdive' as const,
                typeBadge: 'Deep Dive',
                name: `${productName} (${(dd.business_reports as any)?.business_name || parentReport?.business_name || ''})`,
                userEmail: profile?.email || 'Desconocido',
                userName: profile?.full_name || '',
                status: dd.status,
                paymentLabel,
                revenue,
                apiCostUsd: 0, // Deep dives don't track API cost yet
                apiCostArs: 0,
                profit: revenue,
                isPaid: dd.is_paid,
                isVoluntary: false,
            });
        });

        return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [rawReports, rawDeepDives, rawPayments, rawProfiles, exchangeRateInput]);

    // Apply financial filters
    const filteredLedger = useMemo(() => {
        let entries = financialLedger;

        if (finTypeFilter !== 'all') entries = entries.filter(e => e.type === finTypeFilter);

        if (finStatusFilter === 'paid') entries = entries.filter(e => e.isPaid && !e.isVoluntary);
        else if (finStatusFilter === 'free') entries = entries.filter(e => !e.isPaid && e.status === 'completed');
        else if (finStatusFilter === 'voluntary') entries = entries.filter(e => e.isVoluntary);
        else if (finStatusFilter === 'failed') entries = entries.filter(e => e.status === 'failed');
        else if (finStatusFilter === 'draft') entries = entries.filter(e => e.status === 'draft');

        if (finDateFrom) entries = entries.filter(e => new Date(e.date) >= new Date(finDateFrom));
        if (finDateTo) {
            const to = new Date(finDateTo);
            to.setHours(23, 59, 59, 999);
            entries = entries.filter(e => new Date(e.date) <= to);
        }

        return entries;
    }, [financialLedger, finTypeFilter, finStatusFilter, finDateFrom, finDateTo]);

    // Financial summary totals
    const finTotals = useMemo(() => {
        const totalRevenue = filteredLedger.reduce((sum, e) => sum + e.revenue, 0);
        const totalApiCostUsd = filteredLedger.reduce((sum, e) => sum + e.apiCostUsd, 0);
        const totalApiCostArs = totalApiCostUsd * (Number(exchangeRateInput) || DEFAULT_EXCHANGE_RATE);
        const totalProfit = totalRevenue - totalApiCostArs;
        const totalGenerated = filteredLedger.filter(e => e.status === 'completed').length;
        const totalPaid = filteredLedger.filter(e => e.isPaid && !e.isVoluntary).length;
        const totalFree = filteredLedger.filter(e => !e.isPaid && e.status === 'completed').length;
        const totalVoluntary = filteredLedger.filter(e => e.isVoluntary).length;
        return { totalRevenue, totalApiCostUsd, totalApiCostArs, totalProfit, totalGenerated, totalPaid, totalFree, totalVoluntary };
    }, [filteredLedger]);

    const filteredData = useMemo(() => {
        let start = new Date(0);
        let end = new Date();
        const now = new Date();

        if (dateFilter === 'today') {
            start = new Date(now.setHours(0, 0, 0, 0));
        } else if (dateFilter === 'week') {
            start = new Date(now.setDate(now.getDate() - 7));
        } else if (dateFilter === 'month') {
            start = new Date(now.setMonth(now.getMonth() - 1));
        }

        const byDate = (item: any) => new Date(item.created_at) >= start && new Date(item.created_at) <= end;

        const profiles = rawProfiles.filter(byDate);
        const reports = rawReports.filter(byDate);
        const payments = rawPayments.filter((p) => new Date(p.created_at) >= start && new Date(p.created_at) <= end && p.status === 'succeeded');
        const logs = rawLogs.filter(byDate);

        // Compute User Aggregations internally
        const usersMap = rawProfiles.map(u => {
            const userReports = rawReports.filter(r => r.user_id === u.id);
            const userPayments = rawPayments.filter(p => p.user_id === u.id && p.status === 'succeeded');
            const totalRevenue = userPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

            // Deep Dives: match via the joined business_reports.user_id or via parent report
            const userDeepDives = rawDeepDives.filter(dd => {
                const ddUserId = (dd.business_reports as any)?.user_id;
                if (ddUserId) return ddUserId === u.id;
                const parentReport = rawReports.find(r => r.id === dd.business_report_id);
                return parentReport?.user_id === u.id;
            });

            return {
                ...u,
                reports: userReports,
                deepDives: userDeepDives,
                payments: userPayments,
                totalRevenue
            };
        });

        return {
            profiles,
            reports,
            payments,
            logs,
            usersAggregated: usersMap.filter(byDate),
            allUsersAggregated: usersMap // We always keep the list ready regardless of join date for the table
        };
    }, [rawProfiles, rawReports, rawPayments, rawLogs, rawDeepDives, dateFilter]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-AR', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (isLoading) { // Changed from 'loading' to 'isLoading'
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="max-w-3xl mx-auto mt-10 bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <AlertCircle size={24} />
                    <h3 className="font-bold text-lg">Se requiere actualizar RLS en Supabase</h3>
                </div>
                <p className="mb-4">Para poder recolectar toda esta información directamente, debés correr el siguiente código en el <b>SQL Editor</b> de tu panel de Supabase:</p>
                <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre">
                    {`CREATE POLICY "Admins can view all reports" ON business_reports FOR SELECT USING(is_admin());
CREATE POLICY "Admins can view all analyses" ON product_analyses FOR SELECT USING(is_admin());
CREATE POLICY "Admins can view all logs" ON system_logs FOR SELECT USING(is_admin()); `}
                </div>
                <p className="mt-4 text-sm text-red-700 italic">Error original: {errorMsg}</p>
                <button
                    onClick={fetchAllData}
                    className="mt-6 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-xl transition shadow-lg"
                >
                    Ya lo ejecuté, Reintentar
                </button>
            </div>
        );
    }

    const { reports, payments, profiles, logs, allUsersAggregated } = filteredData;

    const paidReports = reports.filter(r => r.is_paid || r.status === 'completed');

    // Use the same revenue source as Centro Financiero (per-report, no duplicates)
    const totalRevenue = finTotals.totalRevenue;
    const prodDeepDives = reports.reduce((sum, r) => sum + (r.product_analyses?.length || 0), 0);
    const conversionRate = reports.length > 0 ? Math.round((paidReports.length / reports.length) * 100) : 0;

    // Fix: Using Number() to safely parse api_cost_usd and ensure we handle 0
    const totalApiCost = reports.reduce((sum, r) => sum + (Number(r.api_cost_usd) || 0), 0);

    const updatePrice = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase.from('system_settings').update({
                report_price_ars: parseInt(priceInput),
                deep_dive_price_ars: parseInt(deepDivePriceInput),
                exchange_rate_usd: parseFloat(exchangeRateInput)
            }).eq('id', 1);
            if (error) throw error;
            alert('Configuración actualizada correctamente.');
            fetchAllData();
        } catch (e: any) {
            alert('Error al guardar: ' + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    // USER DETAIL VIEW
    if (selectedUser) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
                <button
                    onClick={() => setSelectedUser(null)}
                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition mb-6 font-medium"
                >
                    <ArrowLeft size={16} /> Volver al panel general
                </button>

                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-2xl">
                            {(selectedUser.full_name || selectedUser.email || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">{selectedUser.full_name || 'Sin nombre'}</h2>
                            <p className="text-slate-500">{selectedUser.email}</p>
                            <p className="text-sm text-slate-400 mt-1">Registrado el {formatDate(selectedUser.created_at)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">PAGOS TOTALES</p>
                            <p className="text-xl font-bold text-emerald-600">{formatCurrency(selectedUser.totalRevenue)}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">REPORTES INICIADOS</p>
                            <p className="text-xl font-bold text-slate-900">{selectedUser.reports.length}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">REPORTES PAGADOS</p>
                            <p className="text-xl font-bold text-slate-900">{selectedUser.reports.filter((r: any) => r.is_paid).length}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                            <p className="text-xs text-purple-600 uppercase font-bold tracking-wider">DEEP DIVES</p>
                            <p className="text-xl font-bold text-purple-700">{selectedUser.deepDives?.length || 0}</p>
                            <p className="text-xs text-purple-400 mt-1">{selectedUser.deepDives?.filter((dd: any) => dd.is_paid).length || 0} pagos</p>
                        </div>
                    </div>

                    <h3 className="font-bold text-lg mb-4 text-slate-800">Historial de Reportes / Actividad</h3>
                    {selectedUser.reports.length === 0 ? (
                        <p className="text-slate-500 italic">Este usuario no inició ningún reporte onboarding aún.</p>
                    ) : (
                        <div className="space-y-4">
                            {selectedUser.reports.map((r: any) => (
                                <div key={r.id} className="border border-slate-200 rounded-xl p-5 hover:border-indigo-300 transition bg-slate-50/50">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-lg">{r.business_name || 'Sin negocio'}</h4>
                                            <p className="text-xs text-slate-500">{formatDate(r.created_at)}</p>
                                        </div>
                                        <div>
                                            {r.status === 'draft' && <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded font-bold">ABANDONÓ ONBOARDING (PASO {r.current_step || 1})</span>}
                                            {r.status === 'completed' && <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded font-bold">COMPLETADO {r.is_paid ? '(PAGO)' : '(GRATIS/ADMIN)'}</span>}
                                            {r.status === 'failed' && <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-bold">FALLÓ IA</span>}
                                            {r.status === 'analyzing' && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold">ANALIZANDO</span>}
                                        </div>
                                    </div>
                                    {r.onboarding_data ? (
                                        <div className="mt-4 bg-white border border-slate-100 rounded-lg p-3 text-sm">
                                            <p className="text-slate-600"><span className="font-semibold">Tipo:</span> {r.onboarding_data.distributionModel}</p>
                                            <p className="text-slate-600 truncate"><span className="font-semibold">Desc:</span> {r.onboarding_data.description}</p>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 mt-2">No se guardaron datos de onboarding.</p>
                                    )}
                                    <div className="flex gap-2 mt-4">
                                        {r.status === 'completed' && (
                                            <button
                                                onClick={() => loadReportPreview(r.id)}
                                                disabled={previewLoading}
                                                className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg hover:bg-indigo-100 transition"
                                            >
                                                <UserCheck size={14} /> {previewLoading ? 'Cargando...' : 'Ver como usuario'}
                                            </button>
                                        )}
                                        {r.onboarding_data && (
                                            <button onClick={() => setSelectedOnboardingData(r.onboarding_data)} className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-lg hover:bg-slate-200 transition">
                                                <Eye size={14} /> Ver Onboarding
                                            </button>
                                        )}
                                    </div>
                                    {(r.api_cost_usd > 0) && (
                                        <p className="text-xs text-slate-500 mt-3">Costo API estimado: <span className="font-mono text-xs font-bold">${r.api_cost_usd} USD</span></p>
                                    )}
                                    {r.error_details && (
                                        <div className="mt-2 text-xs bg-red-50 text-red-700 p-2 rounded border border-red-100 font-mono">
                                            Razón del fallo: {r.error_details}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Deep Dives Section */}
                    {selectedUser.deepDives && selectedUser.deepDives.length > 0 && (
                        <>
                            <h3 className="font-bold text-lg mb-4 mt-8 text-purple-800 flex items-center gap-2">
                                <Cpu size={20} /> Deep Dives ({selectedUser.deepDives.length})
                            </h3>
                            <div className="space-y-4">
                                {selectedUser.deepDives.map((dd: any) => {
                                    const productName = dd.product_name || (dd.product_input_data as any)?.productName || 'Deep Dive';
                                    const parentBusiness = (dd.business_reports as any)?.business_name || rawReports.find((r: any) => r.id === dd.business_report_id)?.business_name || '';
                                    return (
                                        <div key={dd.id} className="border border-purple-200 rounded-xl p-5 hover:border-purple-400 transition bg-purple-50/30">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-lg">{productName}</h4>
                                                    {parentBusiness && <p className="text-sm text-slate-500">Negocio: {parentBusiness}</p>}
                                                    <p className="text-xs text-slate-500">{formatDate(dd.created_at)}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-purple-100 text-purple-700 text-[10px] uppercase font-bold px-2 py-1 rounded">Deep Dive</span>
                                                    {dd.status === 'completed' && <span className={`text-xs px-2 py-1 rounded font-bold ${dd.is_paid ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{dd.is_paid ? 'PAGO' : 'GRATIS'}</span>}
                                                    {dd.status === 'failed' && <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-bold">FALLÓ IA</span>}
                                                    {dd.status === 'analyzing' && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold">ANALIZANDO</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
                {/* Modal for Onboarding Data */}
                {selectedOnboardingData && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => {
                        if (e.target === e.currentTarget) setSelectedOnboardingData(null);
                    }}>
                        <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
                            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">Datos Completos de Onboarding</h3>
                                    <p className="text-xs text-slate-500">Respuestas sin procesar enviadas por el usuario</p>
                                </div>
                                <button onClick={() => setSelectedOnboardingData(null)} className="text-slate-400 hover:text-slate-600 transition bg-slate-200 hover:bg-slate-300 p-1.5 rounded-full">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto bg-slate-900">
                                <pre className="text-sm font-mono text-emerald-400 whitespace-pre-wrap">
                                    {JSON.stringify(selectedOnboardingData, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}
                {/* View as User Modal - Fullscreen */}
                {previewReport && previewReport.analysis_result && (
                    <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden">
                        {/* Header bar */}
                        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 flex items-center justify-between shadow-lg flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <UserCheck size={20} className="text-white" />
                                <div>
                                    <p className="text-white font-bold text-sm">Vista de usuario: {previewReport.business_name || 'Sin nombre'}</p>
                                    <p className="text-indigo-200 text-xs">Modo solo lectura — Las acciones del usuario están habilitadas para interactuar</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setPreviewReport(null); setProfundizarOpen(false); }}
                                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2"
                            >
                                <X size={16} /> Cerrar vista
                            </button>
                        </div>
                        {/* Report content */}
                        <div className="flex-1 overflow-y-auto bg-slate-50">
                            <Dashboard
                                data={((previewReport.analysis_result as any)?.result || previewReport.analysis_result) as StrategicAnalysis}
                                lang={'es'}
                                onReset={() => { setPreviewReport(null); setProfundizarOpen(false); }}
                                onProfundizar={(title, content) => {
                                    setProfundizarSection({ title, content });
                                    setProfundizarOpen(true);
                                }}
                            />
                            <GlossaryModal lang={'es'} />
                        </div>
                        {/* Profundizar panel for the preview */}
                        <ProfundizarPanel
                            isOpen={profundizarOpen}
                            onClose={() => setProfundizarOpen(false)}
                            sectionTitle={profundizarSection?.title || 'Informe de Negocio Completo'}
                            sectionContent={profundizarSection?.content || (() => {
                                const d = ((previewReport.analysis_result as any)?.result || previewReport.analysis_result) as StrategicAnalysis;
                                return `Market: ${d.marketInsights?.industry || ''}. Personas: ${d.demandMap?.map(p => p.name).join(', ') || ''}`;
                            })()}
                            reportContext={`Negocio: ${previewReport.business_name || ''}. Industria: ${((previewReport.analysis_result as any)?.result || previewReport.analysis_result)?.marketInsights?.industry || ''}`}
                            reportId={previewReport.id}
                            reportType="business"
                            lang={'es'}
                        />
                    </div>
                )}
            </div>
        );
    }

    // MAIN DASHBOARD
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Panel de Control General</h1>
                    <p className="text-slate-500 mt-1">Información dinámica en tiempo real</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                        <Calendar size={16} className="text-slate-400 ml-2 mr-1" />
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value as any)}
                            className="bg-transparent border-none text-sm font-medium focus:ring-0 py-1 pr-8 text-slate-700 cursor-pointer"
                        >
                            <option value="all">Historico Total</option>
                            <option value="today">Hoy</option>
                            <option value="week">Últimos 7 días</option>
                            <option value="month">Último mes</option>
                        </select>
                    </div>
                    <button
                        onClick={fetchAllData}
                        className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition"
                    >
                        <Activity size={16} /> Actualizar
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl w-fit mb-8">
                <button
                    onClick={() => setActiveTab('kpis')}
                    className={`px - 4 py - 2 rounded - lg text - sm font - semibold transition ${activeTab === 'kpis' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'} `}
                >
                    Métricas
                </button>
                <button
                    onClick={() => setActiveTab('usuarios')}
                    className={`px - 4 py - 2 rounded - lg text - sm font - semibold transition ${activeTab === 'usuarios' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'} `}
                >
                    Usuarios & Actividad
                </button>
                <button
                    onClick={() => setActiveTab('finanzas')}
                    className={`px - 4 py - 2 rounded - lg text - sm font - semibold transition ${activeTab === 'finanzas' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'} `}
                >
                    Centro Financiero
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`px - 4 py - 2 rounded - lg text - sm font - semibold transition ${activeTab === 'logs' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'} `}
                >
                    Log de Errores ({logs.filter(l => l.severity === 'error').length})
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`px - 4 py - 2 rounded - lg text - sm font - semibold transition flex items - center gap - 1 ${activeTab === 'settings' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'} `}
                >
                    <Settings size={16} /> Configuración
                </button>
                <button
                    onClick={() => setActiveTab('feedback')}
                    className={`px - 4 py - 2 rounded - lg text - sm font - semibold transition flex items - center gap - 1 ${activeTab === 'feedback' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'} `}
                >
                    <MessageSquareHeart size={16} /> Feedback ({rawFeedback.length})
                </button>
            </div>

            {/* METRICS TAB */}
            {activeTab === 'kpis' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-slate-500 text-sm font-bold mb-1 uppercase">Nuevos Usuarios</h3>
                            <p className="text-3xl font-bold text-blue-600">{profiles.length}</p>
                            <p className="text-xs text-slate-400 mt-2">Registrados ({dateFilter})</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-slate-500 text-sm font-bold mb-1 uppercase">Ingresos</h3>
                            <p className="text-3xl font-bold text-emerald-600">{formatCurrency(totalRevenue)}</p>
                            <p className="text-xs text-slate-400 mt-2">Todos los pagos exitosos</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-slate-500 text-sm font-bold mb-1 uppercase">Reportes Creados</h3>
                            <p className="text-3xl font-bold text-slate-900">{reports.length}</p>
                            <p className="text-xs text-amber-600 font-medium mt-2">{reports.length - paidReports.length} abandonados / {paidReports.length} pagos</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-slate-500 text-sm font-bold mb-1 uppercase">Conversión a Venta</h3>
                            <p className="text-3xl font-bold text-indigo-600">{conversionRate}%</p>
                            <p className="text-xs text-slate-400 mt-2">Visita dashboard vs Pagó</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-slate-500 text-sm font-bold mb-1 uppercase">Costo IA Total</h3>
                            <p className="text-3xl font-bold text-rose-600">${totalApiCost.toFixed(3)}</p>
                            <p className="text-xs text-slate-400 mt-2">Consumido en USD en Gemini</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-slate-500 text-sm font-bold mb-1 uppercase">Deep Dives (Extras)</h3>
                            <p className="text-3xl font-bold text-purple-600">{prodDeepDives}</p>
                            <p className="text-xs text-slate-400 mt-2">Análisis de productos extras</p>
                        </div>
                    </div>
                </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'usuarios' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <p className="text-sm font-medium text-slate-600">Hacé clic en cualquier usuario para ver el detalle exacto de su recorrido y reportes.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Usuario</th>
                                    <th className="px-6 py-4">Fecha Alta</th>
                                    <th className="px-6 py-4 text-center">Status Onboarding</th>
                                    <th className="px-6 py-4 text-center">Reportes Pagos</th>
                                    <th className="px-6 py-4 text-center">Deep Dives</th>
                                    <th className="px-6 py-4 text-right">LTV (Ingresos)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {allUsersAggregated.map((u) => {
                                    const createdReports = u.reports.length;
                                    const paidReps = u.reports.filter((r: any) => r.is_paid || r.status === 'completed').length;

                                    let statusBadge = <span className="text-xs text-slate-400">Sin comenzar</span>;
                                    if (createdReports > 0 && paidReps === 0) statusBadge = <span className="bg-amber-100 text-amber-800 text-[10px] uppercase font-bold px-2 py-1 rounded">Abandonó (Draft)</span>;
                                    if (paidReps > 0) statusBadge = <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold px-2 py-1 rounded">Comprador activo</span>;

                                    return (
                                        <tr key={u.id} onClick={() => setSelectedUser(u)} className="hover:bg-slate-50 transition cursor-pointer group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                                        {(u.full_name || u.email || 'U')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900 text-sm group-hover:text-indigo-600 transition">{u.full_name || 'Sin nombre'}</p>
                                                        <p className="text-xs text-slate-500">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">{formatDate(u.created_at).split(',')[0]}</td>
                                            <td className="px-6 py-4 text-center">{statusBadge}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-700 text-center">{paidReps} <span className="text-slate-400 font-normal">/ {createdReports}</span></td>
                                            <td className="px-6 py-4 text-sm font-bold text-purple-600 text-center">{u.deepDives?.length || 0}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">{formatCurrency(u.totalRevenue)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* CENTRO FINANCIERO TAB */}
            {activeTab === 'finanzas' && (
                <div className="space-y-6">
                    {/* Inline Exchange Rate Bar */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <DollarSign size={16} className="text-indigo-600" />
                            <span className="text-sm font-semibold text-slate-700">Cotización USD → ARS:</span>
                        </div>
                        <input
                            type="number"
                            value={exchangeRateInput}
                            onChange={(e) => setExchangeRateInput(e.target.value)}
                            className="w-28 text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-900 font-bold focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 outline-none"
                        />
                        <span className="text-xs text-slate-400">Los cálculos se actualizan en tiempo real al cambiar el valor.</span>
                        {exchangeRateInput !== (rawSettings?.exchange_rate_usd?.toString() || DEFAULT_EXCHANGE_RATE.toString()) && (
                            <button
                                onClick={async () => {
                                    try {
                                        await supabase.from('system_settings').update({ exchange_rate_usd: parseFloat(exchangeRateInput) }).eq('id', 1);
                                        fetchAllData();
                                    } catch (e: any) { alert('Error: ' + e.message); }
                                }}
                                className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-700 transition"
                            >
                                Guardar cotización
                            </button>
                        )}
                    </div>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Ingresos Totales</p>
                            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(finTotals.totalRevenue)}</p>
                            <p className="text-xs text-slate-400 mt-1">{finTotals.totalPaid} pagados + {finTotals.totalVoluntary} voluntarios</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Costo IA Total</p>
                            <p className="text-2xl font-bold text-red-500">${finTotals.totalApiCostUsd.toFixed(3)} USD</p>
                            <p className="text-xs text-slate-400 mt-1">≈ {formatCurrency(finTotals.totalApiCostArs)} ARS</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Ganancia Neta</p>
                            <p className={`text-2xl font-bold ${finTotals.totalProfit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>{formatCurrency(finTotals.totalProfit)}</p>
                            <p className="text-xs text-slate-400 mt-1">Ingresos - Costo IA (1 USD = {Number(exchangeRateInput) || DEFAULT_EXCHANGE_RATE} ARS)</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Informes Generados</p>
                            <p className="text-2xl font-bold text-slate-900">{finTotals.totalGenerated}</p>
                            <p className="text-xs text-slate-400 mt-1">{finTotals.totalFree} gratuitos / {finTotals.totalPaid} pagados</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Filter size={16} className="text-slate-400" />
                                <span className="text-sm font-semibold text-slate-600">Filtros:</span>
                            </div>
                            <select
                                value={finTypeFilter}
                                onChange={e => setFinTypeFilter(e.target.value as any)}
                                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 outline-none"
                            >
                                <option value="all">Todos los tipos</option>
                                <option value="business">Análisis de Negocio</option>
                                <option value="deepdive">Deep Dives</option>
                            </select>
                            <select
                                value={finStatusFilter}
                                onChange={e => setFinStatusFilter(e.target.value as any)}
                                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 outline-none"
                            >
                                <option value="all">Todos los estados</option>
                                <option value="paid">Pagados</option>
                                <option value="free">Gratuitos (completados)</option>
                                <option value="voluntary">Pago voluntario</option>
                                <option value="failed">Fallo IA</option>
                                <option value="draft">Abandonados</option>
                            </select>
                            <div className="flex items-center gap-2 ml-auto">
                                <label className="text-xs text-slate-500">Desde:</label>
                                <input
                                    type="date"
                                    value={finDateFrom}
                                    onChange={e => setFinDateFrom(e.target.value)}
                                    className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:border-indigo-400 outline-none"
                                />
                                <label className="text-xs text-slate-500">Hasta:</label>
                                <input
                                    type="date"
                                    value={finDateTo}
                                    onChange={e => setFinDateTo(e.target.value)}
                                    className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:border-indigo-400 outline-none"
                                />
                                {(finTypeFilter !== 'all' || finStatusFilter !== 'all' || finDateFrom || finDateTo) && (
                                    <button
                                        onClick={() => { setFinTypeFilter('all'); setFinStatusFilter('all'); setFinDateFrom(''); setFinDateTo(''); }}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition"
                                    >
                                        Limpiar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Ledger Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        {filteredLedger.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">
                                <FileText size={32} className="mx-auto text-slate-300 mb-3" />
                                <p>No hay movimientos con los filtros seleccionados.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3">Fecha</th>
                                            <th className="px-4 py-3">Tipo</th>
                                            <th className="px-4 py-3">Usuario</th>
                                            <th className="px-4 py-3">Informe / Producto</th>
                                            <th className="px-4 py-3 text-center">Estado</th>
                                            <th className="px-4 py-3 text-right">Ingreso (ARS)</th>
                                            <th className="px-4 py-3 text-right">Costo IA (USD)</th>
                                            <th className="px-4 py-3 text-right">Ganancia (ARS)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredLedger.map(entry => {
                                            const statusColors: Record<string, string> = {
                                                'Pagado': 'bg-emerald-100 text-emerald-800',
                                                'Voluntario (pagó)': 'bg-purple-100 text-purple-800',
                                                'Voluntario (pendiente)': 'bg-purple-50 text-purple-600',
                                                'Gratuito (Beta)': 'bg-blue-100 text-blue-800',
                                                'Gratuito': 'bg-blue-100 text-blue-800',
                                                'Fallo IA': 'bg-red-100 text-red-800',
                                                'Abandonado': 'bg-amber-100 text-amber-800',
                                            };
                                            return (
                                                <tr key={entry.id} className="hover:bg-slate-50 transition">
                                                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(entry.date)}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${entry.type === 'business' ? 'bg-indigo-100 text-indigo-800' : 'bg-violet-100 text-violet-800'}`}>
                                                            {entry.typeBadge}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm font-medium text-slate-900 truncate max-w-[150px]">{entry.userName || entry.userEmail}</p>
                                                        {entry.userName && <p className="text-xs text-slate-400 truncate max-w-[150px]">{entry.userEmail}</p>}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-slate-700 max-w-[200px] truncate" title={entry.name}>{entry.name}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${statusColors[entry.paymentLabel] || 'bg-slate-100 text-slate-600'}`}>
                                                            {entry.paymentLabel}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-bold text-right">
                                                        {entry.revenue > 0 ? (
                                                            <span className="text-emerald-600">+{formatCurrency(entry.revenue)}</span>
                                                        ) : (
                                                            <span className="text-slate-300">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-bold text-right">
                                                        {entry.apiCostUsd > 0 ? (
                                                            <span className="text-red-500">-${entry.apiCostUsd.toFixed(4)}</span>
                                                        ) : (
                                                            <span className="text-slate-300">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-bold text-right">
                                                        {entry.status === 'completed' || entry.revenue > 0 ? (
                                                            <span className={entry.profit >= 0 ? 'text-indigo-600' : 'text-red-600'}>
                                                                {entry.profit >= 0 ? '+' : ''}{formatCurrency(entry.profit)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-300">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-slate-50 border-t-2 border-slate-300">
                                        <tr className="font-bold">
                                            <td colSpan={5} className="px-4 py-3 text-sm text-slate-700 uppercase">Totales ({filteredLedger.length} movimientos)</td>
                                            <td className="px-4 py-3 text-sm text-emerald-600 text-right">+{formatCurrency(finTotals.totalRevenue)}</td>
                                            <td className="px-4 py-3 text-sm text-red-500 text-right">-${finTotals.totalApiCostUsd.toFixed(3)}</td>
                                            <td className={`px-4 py-3 text-sm text-right ${finTotals.totalProfit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                                                {finTotals.totalProfit >= 0 ? '+' : ''}{formatCurrency(finTotals.totalProfit)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* LOGS TAB */}
            {activeTab === 'logs' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    {logs.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <CheckCircle size={32} className="mx-auto text-emerald-400 mb-3" />
                            <p>No hay logs ni errores en este período.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">S</th>
                                        <th className="px-6 py-4">Fecha</th>
                                        <th className="px-6 py-4">Evento / Error</th>
                                        <th className="px-6 py-4 w-1/2">Detalles Técnicos</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4">
                                                {log.severity === 'error' || log.severity === 'critical' ? (
                                                    <XCircle size={18} className="text-red-500" />
                                                ) : log.severity === 'warning' ? (
                                                    <AlertCircle size={18} className="text-amber-500" />
                                                ) : (
                                                    <CheckCircle size={18} className="text-emerald-500" />
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">{formatDate(log.created_at)}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-900 whitespace-nowrap">{log.event_type}</td>
                                            <td className="px-6 py-4 text-xs text-slate-600 font-mono bg-slate-50/50 rounded p-3 break-all">
                                                {JSON.stringify(log.event_data)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm max-w-xl">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Configuración Global de la Plataforma</h2>
                    <p className="text-slate-500 mb-8 text-sm">Cambiar estos valores impactará a los usuarios finales de forma inmediata en la Landing Page y en el Checkout de MercadoPago.</p>

                    <div className="mb-6">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Precio del Informe (ARS)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <DollarSign size={16} className="text-slate-400" />
                            </div>
                            <input
                                type="number"
                                value={priceInput}
                                onChange={(e) => setPriceInput(e.target.value)}
                                className="pl-10 w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none text-slate-900 font-bold"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Este monto será cobrado por Mercado Pago en pesos argentinos.</p>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Precio del Deep Dive (ARS)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <DollarSign size={16} className="text-slate-400" />
                            </div>
                            <input
                                type="number"
                                value={deepDivePriceInput}
                                onChange={(e) => setDeepDivePriceInput(e.target.value)}
                                className="pl-10 w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 outline-none text-slate-900 font-bold"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Análisis táctico profundo de producto/servicio. Se cobra por separado.</p>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Cotización USD → ARS (tipo de cambio)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-slate-400 text-sm font-bold">U$D</span>
                            </div>
                            <input
                                type="number"
                                value={exchangeRateInput}
                                onChange={(e) => setExchangeRateInput(e.target.value)}
                                className="pl-12 w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none text-slate-900 font-bold"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Usado para calcular rentabilidad en el Centro Financiero: Costo IA (USD) × esta cotización = Costo IA (ARS).</p>
                    </div>

                    <button
                        onClick={updatePrice}
                        disabled={isSaving || (priceInput === rawSettings?.report_price_ars?.toString() && deepDivePriceInput === rawSettings?.deep_dive_price_ars?.toString() && exchangeRateInput === rawSettings?.exchange_rate_usd?.toString())}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-xl transition flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                        Guardar Cambios
                    </button>
                </div>
            )}

            {/* FEEDBACK TAB */}
            {activeTab === 'feedback' && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    {(() => {
                        const total = rawFeedback.length;
                        const avgGeneral = total > 0 ? (rawFeedback.reduce((s, f) => s + f.rating_general, 0) / total).toFixed(1) : '—';
                        const avgOnboarding = total > 0 ? (rawFeedback.reduce((s, f) => s + f.rating_onboarding, 0) / total).toFixed(1) : '—';
                        const avgQuality = total > 0 ? (rawFeedback.reduce((s, f) => s + f.rating_quality, 0) / total).toFixed(1) : '—';
                        const emojis = ['😡', '😕', '😐', '🙂', '🤩'];
                        const emojiForAvg = (avg: string) => avg === '—' ? '—' : emojis[Math.min(Math.round(Number(avg)) - 1, 4)];

                        return (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Total Feedbacks</p>
                                    <p className="text-2xl font-bold text-slate-900">{total}</p>
                                </div>
                                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Rating General</p>
                                    <p className="text-2xl font-bold text-indigo-600">{emojiForAvg(avgGeneral as string)} {avgGeneral}</p>
                                </div>
                                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Onboarding</p>
                                    <p className="text-2xl font-bold text-blue-600">{emojiForAvg(avgOnboarding as string)} {avgOnboarding}</p>
                                </div>
                                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Calidad</p>
                                    <p className="text-2xl font-bold text-emerald-600">{emojiForAvg(avgQuality as string)} {avgQuality}</p>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Feedback Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        {rawFeedback.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">
                                <MessageSquareHeart size={32} className="mx-auto text-slate-300 mb-3" />
                                <p>Todavía no hay feedbacks.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3">Fecha</th>
                                            <th className="px-4 py-3">Usuario</th>
                                            <th className="px-4 py-3">Tipo</th>
                                            <th className="px-4 py-3 text-center">General</th>
                                            <th className="px-4 py-3 text-center">Onboarding</th>
                                            <th className="px-4 py-3 text-center">Calidad</th>
                                            <th className="px-4 py-3">Comentario</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {rawFeedback.map((fb: any) => {
                                            const profile = rawProfiles.find(p => p.id === fb.user_id);
                                            const emojis = ['😡', '😕', '😐', '🙂', '🤩'];
                                            return (
                                                <tr key={fb.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(fb.created_at)}</td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm font-medium text-slate-900">{profile?.full_name || 'Sin nombre'}</p>
                                                        <p className="text-xs text-slate-400">{profile?.email || fb.user_id.slice(0, 8)}</p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-xs font-bold px-2 py-1 rounded ${fb.report_type === 'business' ? 'bg-indigo-50 text-indigo-700' : 'bg-purple-50 text-purple-700'}`}>
                                                            {fb.report_type === 'business' ? 'Análisis' : 'Deep Dive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-2xl">{emojis[fb.rating_general - 1]}</td>
                                                    <td className="px-4 py-3 text-center text-2xl">{emojis[fb.rating_onboarding - 1]}</td>
                                                    <td className="px-4 py-3 text-center text-2xl">{emojis[fb.rating_quality - 1]}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{fb.comment || <span className="text-slate-300 italic">—</span>}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
