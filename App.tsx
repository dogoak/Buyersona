import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import ReportsList from './components/Dashboard/ReportsList';
import ReportView from './components/Dashboard/ReportView';
import BillingPage from './components/Dashboard/BillingPage';
import SettingsPage from './components/Dashboard/SettingsPage';
import CheckoutPage from './components/Checkout/CheckoutPage';
import PaymentResult from './components/Checkout/PaymentResult';
import ResumeCheckout from './components/Checkout/ResumeCheckout';
import PrivacyPolicy from './components/Legal/PrivacyPolicy';
import TermsOfService from './components/Legal/TermsOfService';
import Onboarding from './components/Onboarding';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import AppHeader from './components/AppHeader';
import AdminRoute from './components/AdminRoute';
import SuperAdminDashboard from './components/SuperAdmin/SuperAdminDashboard';
import AnalysisLoader from './components/AnalysisLoader';
import { Language, BusinessInput, StrategicAnalysis } from './types';
import { analyzeBusinessGrowth } from './services/geminiService';
import { supabase } from './services/supabaseClient';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-slate-500 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function LandingPageWrapper({ lang, setLang }: { lang: Language; setLang: (l: Language) => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <LandingPage
      lang={lang}
      setLang={setLang}
      onLogin={() => navigate('/login')}
      onRegister={() => navigate('/login')}
    />
  );
}

// Steps: onboarding → checkout → analyzing → results
type OnboardingStep = 'onboarding' | 'checkout' | 'analyzing' | 'results' | 'error';

function OnboardingPage({ lang }: { lang: Language }) {
  const { user } = useAuth();
  const [step, setStep] = useState<OnboardingStep>('onboarding');
  const [analysisResult, setAnalysisResult] = useState<StrategicAnalysis | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [onboardingData, setOnboardingData] = useState<BusinessInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Track step changes
  const handleStepChange = async (newStepIndex: number, data: BusinessInput) => {
    if (!user) return;
    try {
      if (!reportId) {
        const { data: report, error } = await supabase
          .from('business_reports')
          .insert({
            user_id: user.id,
            business_name: data.businessName || 'Draft Report',
            onboarding_data: data,
            status: 'draft',
            current_step: newStepIndex
          })
          .select('id')
          .single();

        if (error) throw error;
        setReportId(report.id);
      } else {
        await supabase
          .from('business_reports')
          .update({
            business_name: data.businessName || 'Draft Report',
            onboarding_data: data,
            current_step: newStepIndex
          })
          .eq('id', reportId);
      }
    } catch (e) {
      console.error('Error tracking step change:', e);
    }
  };

  // Step 1: Onboarding complete → save draft and go to checkout
  const handleOnboardingComplete = async (data: BusinessInput) => {
    if (!user) return;

    setOnboardingData(data);
    setBusinessName(data.businessName);

    try {
      // Ensure the very final state is saved with step 7 (Checkout intent)
      await handleStepChange(7, data);

      if (!reportId) {
        throw new Error("Report ID was not generated during step tracking.");
      }

      setStep('checkout');
    } catch (err: any) {
      console.error('Error saving report:', err);
      setError('Error al guardar los datos. Intentá de nuevo.');
      setStep('error');
    }
  };

  // Step 3: After payment, run analysis
  const runAnalysis = async () => {
    if (!onboardingData || !reportId) return;

    setStep('analyzing');
    setError(null);

    try {
      // Update status to analyzing
      await supabase
        .from('business_reports')
        .update({ status: 'analyzing' })
        .eq('id', reportId);

      // Run AI analysis
      const { result, costUsd: generationCostUsd } = await analyzeBusinessGrowth(onboardingData, lang);
      setAnalysisResult(result);

      // Evaluate the actual cost (Generation Cost + Initial Website Analysis Cost if applicable)
      const websiteCostUsd = onboardingData.websiteAnalysisCostUsd || 0;
      const totalCost = generationCostUsd + websiteCostUsd;

      // Save analysis result
      await supabase
        .from('business_reports')
        .update({
          analysis_result: result,
          status: 'completed',
          api_cost_usd: totalCost
        })
        .eq('id', reportId);

      setStep('results');
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError(err.message || 'Error al generar el análisis.');

      await supabase
        .from('business_reports')
        .update({
          status: 'failed',
          error_details: err.message || 'Unknown Error'
        })
        .eq('id', reportId);

      setStep('error');
    }
  };

  // Step: Onboarding form
  if (step === 'onboarding') {
    return <Onboarding lang={lang} onComplete={handleOnboardingComplete} onStepChange={handleStepChange} />;
  }

  // Step: Checkout
  if (step === 'checkout' && reportId) {
    return (
      <CheckoutPage
        reportId={reportId}
        businessName={businessName}
        onBack={() => setStep('onboarding')}
        onSuccess={runAnalysis}
      />
    );
  }

  // Step: Analyzing
  if (step === 'analyzing') {
    return <AnalysisLoader lang={lang} />;
  }

  // Step: Error
  if (step === 'error') {
    return (
      <div className="min-h-[calc(100vh-57px)] flex flex-col items-center justify-center bg-slate-50 p-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => { setError(null); setStep('onboarding'); }}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition"
          >
            Volver a intentar
          </button>
        </div>
      </div>
    );
  }

  // Step: Results
  if (step === 'results' && analysisResult) {
    return (
      <Dashboard
        data={analysisResult}
        lang={lang}
        onReset={() => navigate('/dashboard')}
      />
    );
  }

  return <Onboarding lang={lang} onComplete={handleOnboardingComplete} onStepChange={handleStepChange} />;
}

function App() {
  const [lang, setLang] = useState<Language>('es');

  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Global Header - hides on landing and login pages */}
        <AppHeader lang={lang} setLang={setLang} />

        <Routes>
          <Route path="/login" element={<Login />} />

          {/* User Dashboard Routes */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }>
            <Route index element={<ReportsList />} />
            <Route path="report/:reportId" element={<ReportView lang={lang} />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="payment/success" element={<PaymentResult status="success" />} />
            <Route path="payment/failure" element={<PaymentResult status="failure" />} />
            <Route path="payment/pending" element={<PaymentResult status="pending" />} />
          </Route>

          {/* Onboarding + Checkout + Analysis Flow (requires auth) */}
          <Route path="/onboarding" element={
            <PrivateRoute>
              <OnboardingPage lang={lang} />
            </PrivateRoute>
          } />

          {/* Resume checkout for draft reports */}
          <Route path="/checkout/:reportId" element={
            <PrivateRoute>
              <ResumeCheckout />
            </PrivateRoute>
          } />

          {/* Super Admin Routes */}
          <Route path="/super-admin" element={<AdminRoute />}>
            <Route index element={<SuperAdminDashboard />} />
          </Route>

          {/* Legal Pages */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />

          {/* Landing Page */}
          <Route path="/" element={<LandingPageWrapper lang={lang} setLang={setLang} />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

