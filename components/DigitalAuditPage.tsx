import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import DigitalAuditForm from './DigitalAuditForm';
import { DigitalAuditInput, StrategicAnalysis, Language } from '../types';
import { Loader2 } from 'lucide-react';
import AppHeader from './AppHeader';

interface DigitalAuditPageProps {
    lang: Language;
    setLang: (lang: Language) => void;
}

export default function DigitalAuditPage({ lang, setLang }: DigitalAuditPageProps) {
    const { reportId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [isSaving, setIsSaving] = useState(false);
    const [loadingParent, setLoadingParent] = useState(true);
    const [parentAnalysis, setParentAnalysis] = useState<StrategicAnalysis | null>(null);
    const [parentOnboarding, setParentOnboarding] = useState<Record<string, any> | null>(null);
    const [parentBusinessName, setParentBusinessName] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (!reportId) {
            navigate('/dashboard');
            return;
        }

        const loadParentData = async () => {
            try {
                const { data, error } = await supabase
                    .from('business_reports')
                    .select('business_name, analysis_result, onboarding_data')
                    .eq('id', reportId)
                    .eq('status', 'completed')
                    .single();

                if (error) throw error;
                if (!data || !data.analysis_result) {
                    setError(lang === 'es'
                        ? 'El análisis de empresa debe estar completado antes de hacer una Auditoría Digital.'
                        : 'The business analysis must be completed before starting a Digital Audit.');
                    return;
                }

                const analysisResult = (data.analysis_result as any)?.result || data.analysis_result;
                setParentAnalysis(analysisResult as StrategicAnalysis);
                setParentBusinessName(data.business_name || '');

                if (data.onboarding_data) {
                    const { productImages, documents, ...lightOnboarding } = data.onboarding_data as any;
                    setParentOnboarding(lightOnboarding);
                }
            } catch (err: any) {
                console.error('Error loading parent report:', err);
                setError(lang === 'es'
                    ? 'No se pudo cargar el análisis de empresa.'
                    : 'Could not load business analysis.');
            } finally {
                setLoadingParent(false);
            }
        };

        loadParentData();
    }, [user, reportId, navigate, lang]);

    const handleFormComplete = async (data: DigitalAuditInput) => {
        setIsSaving(true);
        try {
            const { data: insertedData, error } = await supabase
                .from('digital_audits')
                .insert({
                    business_report_id: reportId,
                    audit_name: lang === 'es' ? 'Auditoría Digital' : 'Digital Audit',
                    status: 'draft',
                    audit_input: data,
                    is_paid: false,
                    user_id: user!.id
                })
                .select()
                .single();

            if (error) throw error;

            navigate(`/digital-audit/checkout/${insertedData.id}`);
        } catch (error) {
            console.error('Error saving digital audit draft:', error);
            alert(lang === 'es' ? 'Hubo un error al guardar. Intente nuevamente.' : 'Error saving. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (loadingParent) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-emerald-600 mb-4" size={40} />
                    <p className="text-lg font-bold text-slate-700">
                        {lang === 'es' ? 'Cargando contexto del negocio...' : 'Loading business context...'}
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
                <div className="flex-1 flex flex-col items-center justify-center px-4">
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center">
                        <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
                        <p className="text-red-600 mb-6">{error}</p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-900 transition"
                        >
                            {lang === 'es' ? 'Volver al Panel' : 'Back to Dashboard'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <div className="flex-1 overflow-y-auto pt-4">
                <DigitalAuditForm
                    lang={lang}
                    onComplete={handleFormComplete}
                    onCancel={() => navigate('/dashboard')}
                    parentAnalysis={parentAnalysis}
                    parentOnboarding={parentOnboarding}
                    parentBusinessName={parentBusinessName}
                />
            </div>
            {isSaving && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-xl font-bold text-slate-800">
                        {lang === 'es' ? 'Preparando tu auditoría...' : 'Preparing your audit...'}
                    </p>
                </div>
            )}
        </div>
    );
}
