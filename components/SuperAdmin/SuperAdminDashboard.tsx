import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { AdminDashboardStats } from '../../types';
import {
    Users, DollarSign, FileText, Activity, AlertCircle,
    Clock, CheckCircle2, XCircle, Loader2, ArrowUpRight
} from 'lucide-react';

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState<AdminDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'logs'>('overview');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
            if (error) throw error;
            setStats(data as AdminDashboardStats);
        } catch (err: any) {
            console.error('Error fetching admin stats:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0
        }).format(amount / 100);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-AR', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl max-w-2xl mx-auto mt-8">
                <div className="flex items-center gap-3 mb-2">
                    <AlertCircle size={24} />
                    <h3 className="font-bold text-lg">Error loading dashboard</h3>
                </div>
                <p>{error || 'No data returned'}</p>
                <button
                    onClick={fetchStats}
                    className="mt-4 bg-red-100 hover:bg-red-200 px-4 py-2 rounded-lg font-medium transition"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const { kpis, user_stats, recent_logs } = stats;
    const conversionRate = kpis.total_reports > 0
        ? Math.round((kpis.paid_reports / kpis.total_reports) * 100)
        : 0;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Super Admin</h1>
                    <p className="text-slate-500 mt-1">Platform overview and metrics</p>
                </div>
                <button
                    onClick={fetchStats}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition shadow-sm"
                >
                    <Activity size={16} className="text-indigo-600" />
                    Refresh Data
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit mb-8">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'overview' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'users' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Users
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'logs' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    System Logs
                </button>
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                    <Users size={24} />
                                </div>
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Total</span>
                            </div>
                            <h3 className="text-slate-500 text-sm font-medium mb-1">Registered Users</h3>
                            <p className="text-3xl font-bold text-slate-900">{kpis.total_users}</p>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                    <DollarSign size={24} />
                                </div>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Revenue</span>
                            </div>
                            <h3 className="text-slate-500 text-sm font-medium mb-1">Total Revenue</h3>
                            <p className="text-3xl font-bold text-slate-900">{formatCurrency(kpis.total_revenue)}</p>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                                    <FileText size={24} />
                                </div>
                                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">{kpis.paid_reports} Paid</span>
                            </div>
                            <h3 className="text-slate-500 text-sm font-medium mb-1">Business Reports</h3>
                            <p className="text-3xl font-bold text-slate-900">{kpis.total_reports}</p>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                                    <Activity size={24} />
                                </div>
                                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Conversion</span>
                            </div>
                            <h3 className="text-slate-500 text-sm font-medium mb-1">Paid / Total Ratio</h3>
                            <p className="text-3xl font-bold text-slate-900">{conversionRate}%</p>
                        </div>
                    </div>
                </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Joined</th>
                                    <th className="px-6 py-4 text-center">Reports</th>
                                    <th className="px-6 py-4 text-right">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {user_stats.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                                    {(u.full_name || u.email || 'U')[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 text-sm">{u.full_name || 'No Name'}</p>
                                                    {u.role === 'admin' && (
                                                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase">Admin</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{formatDate(u.created_at).split(',')[0]}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-700 text-center">{u.total_reports}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">{formatCurrency(u.total_revenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* LOGS TAB */}
            {activeTab === 'logs' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    {recent_logs.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-3" />
                            <p>No recent system logs or errors.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Timestamp</th>
                                        <th className="px-6 py-4">Event</th>
                                        <th className="px-6 py-4">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recent_logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4">
                                                {log.severity === 'error' || log.severity === 'critical' ? (
                                                    <XCircle size={18} className="text-red-500" />
                                                ) : log.severity === 'warning' ? (
                                                    <AlertCircle size={18} className="text-amber-500" />
                                                ) : (
                                                    <CheckCircle2 size={18} className="text-emerald-500" />
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">{formatDate(log.created_at)}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-900 whitespace-nowrap">{log.event_type}</td>
                                            <td className="px-6 py-4 text-xs text-slate-600 max-w-md truncate font-mono bg-slate-50/50 rounded p-2">
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
        </div>
    );
}
