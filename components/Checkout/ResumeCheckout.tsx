import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';
import CheckoutPage from './CheckoutPage';
import { Loader2 } from 'lucide-react';

export default function ResumeCheckout() {
    const { reportId } = useParams<{ reportId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user || !reportId) return;

        const fetchReport = async () => {
            const { data, error } = await supabase
                .from('business_reports')
                .select('id, business_name, status, is_paid, onboarding_data')
                .eq('id', reportId)
                .eq('user_id', user.id)
                .single();

            if (error || !data) {
                setError('Reporte no encontrado');
                setLoading(false);
                return;
            }

            if (data.is_paid || data.status === 'completed') {
                navigate(`/dashboard/report/${reportId}`);
                return;
            }

            setReport(data);
            setLoading(false);
        };

        fetchReport();
    }, [user, reportId]);

    const handlePaymentSuccess = async () => {
        // After payment, run the analysis
        // For now redirect to dashboard - the analysis will be triggered elsewhere
        navigate('/dashboard');
    };

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-57px)] flex items-center justify-center bg-slate-50">
                <Loader2 size={32} className="animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="min-h-[calc(100vh-57px)] flex items-center justify-center bg-slate-50 p-8">
                <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md text-center">
                    <p className="text-slate-600 mb-4">{error || 'Error al cargar el reporte'}</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition"
                    >
                        Volver al panel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <CheckoutPage
            reportId={report.id}
            businessName={report.business_name || 'Mi Negocio'}
            onBack={() => navigate('/dashboard')}
            onSuccess={handlePaymentSuccess}
        />
    );
}
