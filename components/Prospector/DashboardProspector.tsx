import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { Search, Loader2, Plus, Target, Building2, ChevronRight, Briefcase } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardProspector() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchCampaigns();
        }
    }, [user]);

    const fetchCampaigns = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('prospecting_campaigns')
            .select(`*, business_reports(business_name)`)
            .eq('user_id', user!.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setCampaigns(data);
        }
        setLoading(false);
    };

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 sm:p-8 pt-24 sm:pt-10">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Buyersona Prospector</h1>
                            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-widest border border-amber-200">BETA</span>
                        </div>
                        <p className="text-slate-500 mt-1">Tu motor B2B Inteligente. Análisis de ICP y generación de leads con outreach automático.</p>
                    </div>

                    <button
                        onClick={() => navigate('/dashboard/prospector/new')}
                        className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-200 transition-all transform hover:-translate-y-0.5"
                    >
                        <Plus size={20} />
                        Nueva Campaña
                        <Target size={18} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="animate-spin text-slate-400" size={32} />
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-12 text-center">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Briefcase size={32} className="text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">No hay campañas activas</h2>
                        <p className="text-slate-500 max-w-md mx-auto mb-8">
                            Iniciá tu primera campaña de prospección. Buyersona usará IA y datos reales para encontrar tomadores de decisiones de tu nicho y escribirles correos hiper-personalizados.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard/prospector/new')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition"
                        >
                            <Plus size={18} /> Empezar a Prospectar
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {campaigns.map((camp) => (
                            <button
                                key={camp.id}
                                onClick={() => {
                                    if (camp.payment_status === 'paid' && camp.status === 'completed') navigate(`/dashboard/prospector/view/${camp.id}`);
                                    else if (camp.payment_status === 'paid' && camp.status !== 'completed') navigate(`/dashboard/prospector/loader/${camp.id}`);
                                    else navigate(`/dashboard/prospector/checkout/${camp.id}`);
                                }}
                                className="group flex flex-col text-left bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                                            <Target size={24} className="text-indigo-600" />
                                        </div>
                                        {camp.status === 'completed' && <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">Listo</span>}
                                        {camp.status === 'running' && <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> Generando</span>}
                                        {camp.payment_status === 'unpaid' && <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">Pago Pdte.</span>}
                                        {camp.status === 'failed' && <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">Error</span>}
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1">{camp.name}</h3>
                                    
                                    {camp.business_reports ? (
                                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                                            <Building2 size={14} className="shrink-0" />
                                            <span className="truncate">Contexto: {camp.business_reports.business_name}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-2 opacity-0">
                                            <span>-</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-auto px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center group-hover:bg-indigo-50 transition-colors">
                                    {(camp.status === 'completed' && camp.prospects_list) ? (
                                        <span className="text-sm font-semibold text-indigo-600">{camp.prospects_list.length} Prospectos Hallados</span>
                                    ) : (
                                        <span className="text-sm font-semibold text-slate-400">
                                            {new Date(camp.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                        </span>
                                    )}
                                    <ChevronRight size={18} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
