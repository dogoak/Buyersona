import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import {
    Users, DollarSign, FileText, Activity, AlertCircle,
    CheckCircle, XCircle, Loader2, ArrowLeft, Calendar, Settings,
    ArrowUpRight, Search, Filter, Download, BarChart3, RefreshCw, Trash2, Cpu
} from 'lucide-react';

const EXCHANGE_RATE_ARS_USD = 1050; // Tipo de cambio quemado para cálculos de rentabilidad

export default function SuperAdminDashboard() {
    const [isLoading, setIsLoading] = useState(true); // Changed from 'loading' to 'isLoading'
    const [rawProfiles, setRawProfiles] = useState<any[]>([]);
    const [rawReports, setRawReports] = useState<any[]>([]);
    const [rawPayments, setRawPayments] = useState<any[]>([]);
    const [rawLogs, setRawLogs] = useState<any[]>([]);
    const [rawSettings, setRawSettings] = useState<any>(null);

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'kpis' | 'usuarios' | 'logs' | 'settings' | 'pagos'>('kpis'); // Updated activeTab types and initial value
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [priceInput, setPriceInput] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Quick Filters
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setIsLoading(true); // Changed from 'setLoading' to 'setIsLoading'
        setErrorMsg(null);
        try {
            // Because of Row Level Security, these requires "Admins can view all" policies
            const [profilesRes, reportsRes, paymentsRes, logsRes, settingsRes] = await Promise.all([
                supabase.from('profiles').select('*'),
                supabase.from('business_reports').select('*, product_analyses(*)'),
                supabase.from('payments').select('*'),
                supabase.from('system_logs').select('*').order('created_at', { ascending: false }),
                supabase.from('system_settings').select('*').eq('id', 1).single()
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
            if (settingsRes.data?.report_price_ars) setPriceInput(settingsRes.data.report_price_ars.toString());

        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message);
        } finally {
            setIsLoading(false); // Changed from 'setLoading' to 'setIsLoading'
        }
    };

    // Derived State (Filtered by Date)
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

            return {
                ...u,
                reports: userReports,
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
    }, [rawProfiles, rawReports, rawPayments, rawLogs, dateFilter]);

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

    // Fix: We sum `payments` that are succeeded, we shouldn't use reduce off `reports` for `revenue`. Let's ensure this matches correctly.
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const prodDeepDives = reports.reduce((sum, r) => sum + (r.product_analyses?.length || 0), 0);
    const conversionRate = reports.length > 0 ? Math.round((paidReports.length / reports.length) * 100) : 0;

    // Fix: Using Number() to safely parse api_cost_usd and ensure we handle 0
    const totalApiCost = reports.reduce((sum, r) => sum + (Number(r.api_cost_usd) || 0), 0);

    // Map Payment History for the Pagos tab
    const paymentHistory = payments.map(payment => {
        const report = reports.find(r => r.id === payment.business_report_id);
        const profile = profiles.find(p => p.id === payment.user_id);

        const apiCostUsd = Number(report?.api_cost_usd) || 0;
        const apiCostArs = apiCostUsd * EXCHANGE_RATE_ARS_USD;
        // Rentabilidad: Ingreso - Costo IA convertido
        const rentabilidadArs = payment.amount - apiCostArs;

        return {
            ...payment,
            reportId: report?.id,
            businessName: report?.business_name || 'Desconocido',
            userEmail: profile?.email || 'Desconocido',
            apiCostUsd: apiCostUsd,
            apiCostArs: apiCostArs,
            rentabilidadArs: rentabilidadArs
        };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const updatePrice = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase.from('system_settings').update({ report_price_ars: parseInt(priceInput) }).eq('id', 1);
            if (error) throw error;
            alert('Precio actualizado correctamente. Impacta en Landing Page y MercadoPago en tiempo real.');
            fetchAllData();
        } catch (e: any) {
            alert('Error al guardar el precio: ' + e.message);
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

                    <div className="grid grid-cols-3 gap-6 mb-8">
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
                                    {(r.api_cost_usd > 0) && (
                                        <p className="text-xs text-slate-500 mt-2">Costo API estimado: <span className="font-mono text-xs font-bold">${r.api_cost_usd} USD</span></p>
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
                </div>
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
                    onClick={() => setActiveTab('pagos')}
                    className={`px - 4 py - 2 rounded - lg text - sm font - semibold transition ${activeTab === 'pagos' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'} `}
                >
                    Historial de Pagos
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
                                            <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">{formatCurrency(u.totalRevenue)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* PAGOS TAB */}
            {activeTab === 'pagos' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Historial detallado de reportes pagados y su rentabilidad contra el costo de IA.</p>
                            <p className="text-xs text-slate-400 mt-1">Tasa de cambio actual utilizada para rentabilidad: <strong>1 USD = {EXCHANGE_RATE_ARS_USD} ARS</strong></p>
                        </div>
                    </div>

                    {paymentHistory.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <CheckCircle size={32} className="mx-auto text-emerald-400 mb-3" />
                            <p>Aún no hay compras completadas en este período.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Fecha</th>
                                        <th className="px-6 py-4">Usuario</th>
                                        <th className="px-6 py-4">Proyecto (Informe)</th>
                                        <th className="px-6 py-4 text-right">Ingreso Neto (ARS)</th>
                                        <th className="px-6 py-4 text-right">Costo IA (USD)</th>
                                        <th className="px-6 py-4 text-right">Rentabilidad (ARS)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paymentHistory.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">{formatDate(payment.created_at)}</td>
                                            <td className="px-6 py-4 text-sm text-slate-900 font-medium">{payment.userEmail}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{payment.businessName}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">{formatCurrency(payment.amount)}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-red-500 text-right">${payment.apiCostUsd.toFixed(4)}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-indigo-600 text-right">{formatCurrency(payment.rentabilidadArs)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
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

                    <button
                        onClick={updatePrice}
                        disabled={isSaving || priceInput === rawSettings?.report_price_ars?.toString()}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-xl transition flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                        Guardar Cambios
                    </button>
                </div>
            )}
        </div>
    );
}
