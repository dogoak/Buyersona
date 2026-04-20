import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { Loader2, Search, Zap, CheckCircle2, UserCheck, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function CampaignLoader() {
    const { campaignId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [step, setStep] = useState(0);
    const engineStarted = useRef(false);

    const steps = [
        { label: 'Analizando perfil de industria...', icon: Search },
        { label: 'Descubriendo empresas objetivo...', icon: UserCheck },
        { label: 'Identificando tomadores de decisiones...', icon: Zap },
        { label: 'Recolectando contexto estratégico...', icon: Zap },
        { label: 'Redactando propuestas de valor...', icon: Mail },
        { label: 'Consolidando prospectos...', icon: CheckCircle2 }
    ];

    useEffect(() => {
        if (!campaignId || !user) return;
        
        // Progress animation logic
        const stepInterval = setInterval(() => {
            setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 12000);

        // Start engine only once (React strict mode calls useEffect twice)
        if (!engineStarted.current) {
            engineStarted.current = true;
            startEngine();
        }

        // Realtime subscription (primary notification)
        const channel = supabase
            .channel(`campaign_${campaignId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'prospecting_campaigns', filter: `id=eq.${campaignId}` },
                (payload) => {
                    console.log('Realtime update received:', payload.new.status);
                    if (payload.new.status === 'completed') {
                        clearInterval(stepInterval);
                        navigate(`/dashboard/prospector/view/${campaignId}`);
                    } else if (payload.new.status === 'failed') {
                        clearInterval(stepInterval);
                        alert(`Falló la ejecución: ${payload.new.error_details || 'Error desconocido'}`);
                        navigate('/dashboard/prospector/dashboard');
                    }
                }
            )
            .subscribe();

        // Polling fallback (every 8 seconds, in case Realtime doesn't fire)
        const pollInterval = setInterval(async () => {
            try {
                const { data } = await supabase
                    .from('prospecting_campaigns')
                    .select('status, error_details')
                    .eq('id', campaignId)
                    .single();

                if (data?.status === 'completed') {
                    clearInterval(pollInterval);
                    clearInterval(stepInterval);
                    navigate(`/dashboard/prospector/view/${campaignId}`);
                } else if (data?.status === 'failed') {
                    clearInterval(pollInterval);
                    clearInterval(stepInterval);
                    alert(`Falló la ejecución: ${data.error_details || 'Error desconocido'}`);
                    navigate('/dashboard/prospector/dashboard');
                }
            } catch (err) {
                console.error('Poll error:', err);
            }
        }, 8000);

        return () => {
            clearInterval(stepInterval);
            clearInterval(pollInterval);
            supabase.removeChannel(channel);
        };
    }, [campaignId, user]);

    const startEngine = async () => {
        // Trigger Edge Function only if payment is done and it's not already running/completed
        const { data: campaign } = await supabase
            .from('prospecting_campaigns')
            .select('status, payment_status')
            .eq('id', campaignId)
            .single();

        if (campaign?.payment_status !== 'paid') {
            navigate(`/dashboard/prospector/checkout/${campaignId}`);
            return;
        }

        if (campaign?.status === 'completed') {
            navigate(`/dashboard/prospector/view/${campaignId}`);
            return;
        }

        if (campaign?.status === 'running') return; // already running

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Fire and forget - we track completion via realtime + polling
            fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/prospector-engine`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ campaign_id: campaignId })
            }).then(res => {
                if (!res.ok) {
                    console.error('Engine returned non-OK status:', res.status);
                }
            }).catch(err => {
                console.error('Engine fetch error:', err);
            });

        } catch (error) {
            console.error('Error starting engine', error);
        }
    };

    const CurrentIcon = steps[step].icon;

    return (
        <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-8 overflow-hidden relative">
            
            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/4 -translate-y-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl delay-1000 animate-pulse" />

            <div className="relative bg-white border border-slate-200 p-12 rounded-3xl shadow-xl text-center max-w-sm w-full z-10">
                <div className="relative mb-8">
                    <div className="w-24 h-24 bg-gradient-to-tr from-indigo-100 to-blue-50 rounded-full flex items-center justify-center mx-auto relative overflow-hidden">
                        <CurrentIcon size={40} className="text-indigo-600 animate-pulse" />
                        <div className="absolute inset-0 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin opacity-50"></div>
                    </div>
                </div>

                <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Motor de Prospección B2B</h2>
                <div className="h-8 mb-6 flex items-center justify-center">
                    <p className="text-slate-500 font-medium animate-pulse transition-all">
                        {steps[step].label}
                    </p>
                </div>

                {/* Progress Indicators */}
                <div className="space-y-3 relative">
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100 -z-10" />
                    {steps.map((s, idx) => (
                        <div key={idx} className={`flex items-center gap-3 text-sm font-medium transition-all duration-300 ${idx < step ? 'text-indigo-600' : idx === step ? 'text-slate-900 scale-105' : 'text-slate-400 opacity-50'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center bg-white border-2 transition-colors ${idx < step ? 'border-indigo-600 bg-indigo-50' : idx === step ? 'border-indigo-400' : 'border-slate-200'}`}>
                                {idx < step && <CheckCircle2 size={12} className="text-indigo-600" />}
                            </div>
                            <span className="text-left leading-tight">{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>
            
            <p className="text-sm text-slate-400 mt-8 z-10 max-w-md text-center bg-white/80 p-4 rounded-xl border border-slate-100 shadow-sm backdrop-blur">
                La investigación corporativa profunda puede demorar unos minutos. 
                <br/><strong className="text-indigo-600 mt-1 block">Podés cerrar o salir de esta página.</strong> 
                Tu campaña seguirá procesándose en segundo plano y te avisaremos cuando esté lista.
            </p>
        </div>
    );
}
