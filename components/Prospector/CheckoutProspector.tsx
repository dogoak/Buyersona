import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, AlertCircle, ShoppingCart, Target, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function CheckoutProspector() {
    const { campaignId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [campaign, setCampaign] = useState<any>(null);
    const [priceArs, setPriceArs] = useState<number>(35000);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (user && campaignId) {
            fetchCampaignData();
            checkAdminStatus();
        }
    }, [user, campaignId]);

    const checkAdminStatus = async () => {
        const { data } = await supabase.from('profiles').select('role').eq('id', user!.id).single();
        if (data?.role === 'admin') setIsAdmin(true);
    };

    const fetchCampaignData = async () => {
        setLoading(true);
        // Get Campaign
        const { data: camp, error: campError } = await supabase
            .from('prospecting_campaigns')
            .select('*')
            .eq('id', campaignId)
            .single();

        if (campError || !camp) {
            navigate('/dashboard/prospector/dashboard');
            return;
        }

        // If paid, go straight to loader or view
        if (camp.payment_status === 'paid') {
            if (camp.status === 'completed') navigate(`/dashboard/prospector/view/${campaignId}`);
            else navigate(`/dashboard/prospector/loader/${campaignId}`);
            return;
        }

        setCampaign(camp);

        // Get Price
        const { data: settings } = await supabase.from('system_settings').select('prospector_campaign_price_ars').eq('id', 1).single();
        if (settings && settings.prospector_campaign_price_ars) {
            setPriceArs(settings.prospector_campaign_price_ars);
        }

        setLoading(false);
    };

    const handlePayment = async () => {
        setProcessing(true);
        setErrorMsg('');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No autenticado");

            const successUrl = `${window.location.origin}/dashboard/payment/success?campaign_id=${campaignId}`;
            const failureUrl = `${window.location.origin}/dashboard/payment/failure?campaign_id=${campaignId}`;

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    campaign_id: campaignId,
                    success_url: successUrl,
                    failure_url: failureUrl
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Error al conectar con Mercado Pago');

            // Redirect to MercadoPago
            window.location.href = data.init_point;
            
        } catch (error: any) {
            console.error('Payment Error:', error);
            setErrorMsg(error.message);
            setProcessing(false);
        }
    };

    const handleAdminSkip = async () => {
        setProcessing(true);
        try {
            await supabase.from('prospecting_campaigns').update({ payment_status: 'paid' }).eq('id', campaignId);
            // Skip the payment result page entirely – go straight to the loader
            navigate(`/dashboard/prospector/loader/${campaignId}`);
        } catch (error: any) {
            console.error(error);
            setErrorMsg('Error skipping payment');
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 sm:p-8 pt-24 sm:pt-10">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-2">
                    <button onClick={() => navigate('/dashboard/prospector/dashboard')} className="text-slate-500 hover:text-slate-800 transition">
                        Dashboard
                    </button>
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-900 font-semibold">Confirmar Prospector</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm mt-6">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                        <ShoppingCart size={32} />
                    </div>
                    
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Desbloquear Búsqueda B2B</h1>
                    <p className="text-slate-500 mb-8">Estás a punto de iniciar una campaña automatizada de generación de leads. El motor buscará activamente en la web utilizando el perfil de tus mejores clientes.</p>

                    {errorMsg && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 mb-6">
                            <AlertCircle size={20} />
                            <span className="font-medium">{errorMsg}</span>
                        </div>
                    )}

                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8 space-y-4">
                        <div className="flex justify-between items-center text-slate-700 pb-4 border-b border-slate-200">
                            <span className="font-semibold text-lg flex items-center gap-2"><Target size={20} className="text-indigo-500"/> Campaña:</span>
                            <span className="font-bold">{campaign.name}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-700 pb-4 border-b border-slate-200">
                            <span className="font-semibold flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-500"/> Calidad de Leads:</span>
                            <span>Verificada por IA</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 pt-2">
                            <span className="font-bold text-xl text-slate-900">Total a pagar</span>
                            <div className="text-right">
                                <span className="text-sm text-slate-400 block line-through mb-1">${(priceArs * 1.5).toLocaleString('es-AR')} ARS</span>
                                <span className="text-3xl font-extrabold text-indigo-600">${priceArs.toLocaleString('es-AR')} ARS</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={handlePayment}
                            disabled={processing}
                            className="w-full flex items-center justify-center gap-2 bg-[#009EE3] text-white px-8 py-5 rounded-2xl font-bold text-lg hover:bg-[#008ACB] transition-all focus:ring-4 focus:ring-blue-100 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {processing ? <Loader2 size={24} className="animate-spin" /> : 'Pagar con Mercado Pago'}
                        </button>
                        
                        <p className="text-center text-xs text-slate-400">Pago seguro y encriptado. Se te cobrará en moneda local.</p>

                        {isAdmin && (
                            <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-md mb-3 inline-block">MODO ADMIN</span>
                                <br />
                                <button
                                    onClick={handleAdminSkip}
                                    disabled={processing}
                                    className="group inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-800 transition"
                                >
                                    <Zap size={18} /> Simular Pago Exitoso (Gratis)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
