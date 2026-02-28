import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { CreditCard, Receipt, Clock, Loader2, FileText } from 'lucide-react';

interface Payment {
    id: string;
    amount: number;
    currency: string;
    status: string;
    payment_provider: string;
    created_at: string;
    business_report_id: string;
}

export default function BillingPage() {
    const { user } = useAuth();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPayments();
    }, [user]);

    const fetchPayments = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('payments')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPayments(data || []);
        } catch (err) {
            console.error('Error fetching payments:', err);
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
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currency
        }).format(amount / 100);
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            succeeded: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            pending: 'bg-amber-50 text-amber-700 border-amber-200',
            processing: 'bg-blue-50 text-blue-700 border-blue-200',
            failed: 'bg-red-50 text-red-700 border-red-200',
            refunded: 'bg-slate-50 text-slate-600 border-slate-200'
        };
        const labels: Record<string, string> = {
            succeeded: 'Pagado',
            pending: 'Pendiente',
            processing: 'Procesando',
            failed: 'Fallido',
            refunded: 'Reembolsado'
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status] || styles.pending}`}>
                {labels[status] || status}
            </span>
        );
    };

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
                <p className="text-slate-500 mt-1">Historial de pagos y facturas</p>
            </div>

            {/* Pricing Info */}
            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 p-6 mb-8">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <CreditCard size={24} className="text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 mb-1">Precios</h3>
                        <div className="space-y-1 text-sm text-slate-600">
                            <p><span className="font-semibold text-indigo-700">$5 USD</span> por análisis estratégico de empresa</p>
                            <p><span className="font-semibold text-indigo-700">$5 USD</span> por análisis de producto <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold ml-1">Próximamente</span></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payments List */}
            {payments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Receipt size={28} className="text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Sin pagos registrados</h3>
                    <p className="text-slate-500 text-sm">
                        Tus pagos aparecerán aquí una vez que adquieras un informe.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Concepto</th>
                                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Monto</th>
                                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Medio</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {payments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4 text-sm text-slate-600">{formatDate(payment.created_at)}</td>
                                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">Análisis Estratégico</td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{formatAmount(payment.amount, payment.currency)}</td>
                                    <td className="px-6 py-4">{getStatusBadge(payment.status)}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500 capitalize">{payment.payment_provider}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
