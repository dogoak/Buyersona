import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { CreditCard, Receipt, Loader2, FileText, Search, Globe, BarChart3, Sparkles, Heart, Target } from 'lucide-react';

interface Payment {
    id: string;
    amount: number;
    currency: string;
    status: string;
    payment_provider: string;
    created_at: string;
    business_report_id: string | null;
    product_analysis_id: string | null;
    business_reports?: {
        business_name: string;
    } | null;
    product_analyses?: {
        product_input_data: any;
        business_reports: {
            business_name: string;
        } | null;
    } | null;
}

// We also show reports that were free (voluntary/beta) that never generated a payment record
interface BillingItem {
    id: string;
    date: string;
    type: 'business' | 'product' | 'digital_audit' | 'prospector' | 'unknown';
    typeLabel: string;
    name: string;
    amount: number;
    currency: string;
    status: 'paid' | 'free_beta' | 'voluntary_paid' | 'pending' | 'failed' | 'refunded';
    statusLabel: string;
    provider: string;
}

export default function BillingPage() {
    const { user } = useAuth();
    const [items, setItems] = useState<BillingItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBillingData();
    }, [user]);

    const fetchBillingData = async () => {
        if (!user) return;
        try {
            const billingItems: BillingItem[] = [];

            // 1. Fetch actual payments (from payments table)
            const { data: payments, error: payError } = await supabase
                .from('payments')
                .select('*, business_reports(business_name), product_analyses(product_input_data, business_reports(business_name))')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (payError) console.warn('Payments fetch:', payError.message);

            for (const p of (payments || [])) {
                let type: BillingItem['type'] = 'unknown';
                let typeLabel = 'Pago';
                let name = 'Sin nombre';

                if (p.product_analysis_id && p.product_analyses) {
                    type = 'product';
                    typeLabel = 'Product Deep Dive';
                    const productName = p.product_analyses.product_input_data?.productName || 'Producto';
                    const bizName = p.product_analyses.business_reports?.business_name || '';
                    name = bizName ? `${bizName} → ${productName}` : productName;
                } else if (p.business_report_id && p.business_reports) {
                    type = 'business';
                    typeLabel = 'Análisis Estratégico';
                    name = p.business_reports.business_name || 'Sin nombre';
                } else {
                    // Try to infer type from amount
                    if (p.amount === 12500) {
                        type = 'product';
                        typeLabel = 'Product Deep Dive';
                    } else if (p.amount === 18000) {
                        type = 'digital_audit';
                        typeLabel = 'Auditoría Digital';
                    } else if (p.amount === 35000) {
                        type = 'prospector';
                        typeLabel = 'Prospector B2B';
                    } else {
                        type = 'business';
                        typeLabel = 'Análisis Estratégico';
                    }
                    name = 'Informe';
                }

                let status: BillingItem['status'] = 'pending';
                let statusLabel = 'Pendiente';
                if (p.status === 'succeeded') { status = 'paid'; statusLabel = 'Pagado'; }
                else if (p.status === 'failed') { status = 'failed'; statusLabel = 'Fallido'; }
                else if (p.status === 'refunded') { status = 'refunded'; statusLabel = 'Reembolsado'; }
                else if (p.status === 'processing') { status = 'pending'; statusLabel = 'Procesando'; }

                billingItems.push({
                    id: p.id,
                    date: p.created_at,
                    type,
                    typeLabel,
                    name,
                    amount: p.amount,
                    currency: p.currency || 'ARS',
                    status,
                    statusLabel,
                    provider: p.payment_provider || 'mercadopago',
                });
            }

            // 2. Fetch completed free/beta reports that don't have payment records
            const paymentReportIds = new Set((payments || []).filter(p => p.business_report_id).map(p => p.business_report_id));
            const paymentProductIds = new Set((payments || []).filter(p => p.product_analysis_id).map(p => p.product_analysis_id));

            // Free business reports
            const { data: freeReports } = await supabase
                .from('business_reports')
                .select('id, business_name, is_voluntary_payment, payment_status, is_paid, created_at')
                .eq('user_id', user.id)
                .eq('status', 'completed')
                .order('created_at', { ascending: false });

            for (const r of (freeReports || [])) {
                if (paymentReportIds.has(r.id)) continue; // Already has a payment record
                if (!r.is_voluntary_payment && r.is_paid) continue; // Paid through another mechanism

                let status: BillingItem['status'] = 'free_beta';
                let statusLabel = 'Gratuito (Beta)';
                if (r.is_voluntary_payment && r.payment_status === 'paid') {
                    status = 'voluntary_paid';
                    statusLabel = 'Voluntario ✓';
                }

                billingItems.push({
                    id: `free-biz-${r.id}`,
                    date: r.created_at,
                    type: 'business',
                    typeLabel: 'Análisis Estratégico',
                    name: r.business_name || 'Sin nombre',
                    amount: 0,
                    currency: 'ARS',
                    status,
                    statusLabel,
                    provider: 'gratuito',
                });
            }

            // Free digital audits
            const { data: freeAudits } = await supabase
                .from('digital_audits')
                .select('id, audit_name, is_voluntary_payment, payment_status, is_paid, created_at, business_reports!digital_audits_business_report_id_fkey(business_name)')
                .eq('user_id', user.id)
                .eq('status', 'completed')
                .order('created_at', { ascending: false });

            for (const a of (freeAudits || []) as any[]) {
                let status: BillingItem['status'] = 'free_beta';
                let statusLabel = 'Gratuito (Beta)';
                if (a.is_voluntary_payment && a.payment_status === 'paid') {
                    status = 'voluntary_paid';
                    statusLabel = 'Voluntario ✓';
                }

                const bizName = a.business_reports?.business_name || '';
                billingItems.push({
                    id: `free-audit-${a.id}`,
                    date: a.created_at,
                    type: 'digital_audit',
                    typeLabel: 'Auditoría Digital',
                    name: bizName ? `${bizName} → Auditoría` : (a.audit_name || 'Auditoría'),
                    amount: 0,
                    currency: 'ARS',
                    status,
                    statusLabel,
                    provider: 'gratuito',
                });
            }

            // Sort by date (newest first)
            billingItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setItems(billingItems);
        } catch (err) {
            console.error('Error fetching billing data:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatAmount = (amount: number, currency: string) => {
        if (amount === 0) return 'Gratis';
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getTypeIcon = (type: BillingItem['type']) => {
        switch (type) {
            case 'business': return <BarChart3 size={16} className="text-indigo-600" />;
            case 'product': return <Search size={16} className="text-violet-600" />;
            case 'digital_audit': return <Globe size={16} className="text-emerald-600" />;
            case 'prospector': return <Target size={16} className="text-blue-600" />;
            default: return <FileText size={16} className="text-slate-500" />;
        }
    };

    const getTypeBadgeColors = (type: BillingItem['type']) => {
        switch (type) {
            case 'business': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            case 'product': return 'bg-violet-50 text-violet-700 border-violet-200';
            case 'digital_audit': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'prospector': return 'bg-blue-50 text-blue-700 border-blue-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    const getStatusConfig = (status: BillingItem['status']) => {
        switch (status) {
            case 'paid':
                return { colors: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CreditCard size={11} /> };
            case 'free_beta':
                return { colors: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Sparkles size={11} /> };
            case 'voluntary_paid':
                return { colors: 'bg-purple-50 text-purple-700 border-purple-200', icon: <Heart size={11} /> };
            case 'pending':
                return { colors: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Receipt size={11} /> };
            case 'failed':
                return { colors: 'bg-red-50 text-red-700 border-red-200', icon: <Receipt size={11} /> };
            case 'refunded':
                return { colors: 'bg-slate-50 text-slate-600 border-slate-200', icon: <Receipt size={11} /> };
            default:
                return { colors: 'bg-slate-50 text-slate-600 border-slate-200', icon: <Receipt size={11} /> };
        }
    };

    // Stats
    const totalPaid = items.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
    const totalFree = items.filter(i => i.status === 'free_beta' || (i.status === 'voluntary_paid')).length;
    const totalPending = items.filter(i => i.status === 'pending').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Facturación</h1>
                <p className="text-slate-500 mt-1">Historial completo de pagos e informes generados</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Facturado</p>
                    <p className="text-2xl font-extrabold text-slate-900">
                        {totalPaid > 0 ? formatAmount(totalPaid, 'ARS') : '$0'}
                    </p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Informes Gratuitos</p>
                    <p className="text-2xl font-extrabold text-blue-600">{totalFree}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pagos Pendientes</p>
                    <p className="text-2xl font-extrabold text-amber-600">{totalPending}</p>
                </div>
            </div>

            {/* Items List */}
            {items.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Receipt size={28} className="text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Sin movimientos registrados</h3>
                    <p className="text-slate-500 text-sm">
                        Tus pagos e informes aparecerán aquí.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {/* Desktop Table */}
                    <div className="hidden sm:block">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Concepto</th>
                                    <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Monto</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Medio</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((item) => {
                                    const sc = getStatusConfig(item.status);
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{formatDate(item.date)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getTypeBadgeColors(item.type)}`}>
                                                    {getTypeIcon(item.type)}
                                                    {item.typeLabel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-900 font-medium max-w-[250px] truncate">{item.name}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right whitespace-nowrap">
                                                {item.amount === 0
                                                    ? <span className="text-blue-600">Gratis</span>
                                                    : formatAmount(item.amount, item.currency)
                                                }
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${sc.colors}`}>
                                                    {sc.icon}
                                                    {item.statusLabel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 capitalize">{item.provider}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card List */}
                    <div className="sm:hidden divide-y divide-slate-100">
                        {items.map((item) => {
                            const sc = getStatusConfig(item.status);
                            return (
                                <div key={item.id} className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {getTypeIcon(item.type)}
                                            <span className="text-xs font-bold text-slate-500 uppercase">{item.typeLabel}</span>
                                        </div>
                                        <span className="text-xs text-slate-400">{formatDate(item.date)}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900 mb-2 truncate">{item.name}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-slate-900">
                                            {item.amount === 0
                                                ? <span className="text-blue-600">Gratis</span>
                                                : formatAmount(item.amount, item.currency)
                                            }
                                        </span>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${sc.colors}`}>
                                            {sc.icon}
                                            {item.statusLabel}
                                        </span>
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
