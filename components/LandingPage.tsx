import React from 'react';
import { translations } from '../utils/translations';
import { Language } from '../types';
import { ArrowRight, Globe, Target, MapPin, BarChart3, TrendingUp, Clock, Waves, ClipboardList, Activity, CheckCircle } from 'lucide-react';

import { FullLogo, Isotype } from './BrandAssets';

import { supabase } from '../services/supabaseClient';

interface LandingPageProps {
  lang: Language;
  setLang: (l: Language) => void;
  onLogin: () => void;
  onRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ lang, setLang, onLogin, onRegister }) => {
  const t = translations[lang].hero;
  const [reportPrice, setReportPrice] = React.useState<number | null>(null);

  React.useEffect(() => {
    const fetchPrice = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('report_price_ars')
          .eq('id', 1)
          .single();
        if (data && !error) setReportPrice(data.report_price_ars);
      } catch (err) {
        console.error('Failed to fetch pricing:', err);
      }
    };
    fetchPrice();
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navbar */}
      <nav className="px-4 sm:px-6 py-4 flex justify-between items-center bg-white/70 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Isotype className="h-8 w-8 text-slate-900 sm:hidden" />
          <FullLogo className="h-8 w-auto text-slate-900 hidden sm:block" />
        </div>
        <div className="flex items-center gap-1 sm:gap-4">
          <button
            onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
            className="flex items-center text-slate-600 hover:text-indigo-600 transition text-sm font-semibold p-2"
            aria-label="Switch Language"
          >
            <Globe size={18} className="sm:mr-1" />
            <span className="hidden sm:inline">{lang === 'en' ? 'ES' : 'EN'}</span>
          </button>
          <button
            onClick={onLogin}
            className="text-slate-600 font-semibold hover:text-indigo-600 transition text-sm whitespace-nowrap px-2 sm:px-4"
          >
            {t.cta_login}
          </button>
          <button
            onClick={onRegister}
            className="bg-slate-900 text-white px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-xs sm:text-base whitespace-nowrap"
          >
            {t.cta_start}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-grow flex flex-col justify-center items-center px-4 pt-16 pb-24 sm:pt-24 text-center max-w-5xl mx-auto">

        <FullLogo className="h-12 sm:h-24 w-auto max-w-[200px] sm:max-w-xs mb-10 text-slate-900" />

        <div className="mb-8 inline-flex items-center bg-white/80 backdrop-blur border border-indigo-100 rounded-full px-4 py-1.5 text-indigo-700 text-sm font-bold shadow-sm animate-fade-in-up">
          <span className="flex h-2.5 w-2.5 relative mr-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
          </span>
          AI-Powered Growth Consultant
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 tracking-tight leading-tight mb-8 drop-shadow-sm">
          {t.title}
        </h1>
        <h2 className="text-xl sm:text-2xl text-slate-600 font-medium mb-6 max-w-2xl leading-relaxed">
          {t.subtitle}
        </h2>

        <div className="flex items-center justify-center gap-2 text-slate-500 font-medium mb-10 bg-blue-50/50 px-5 py-2.5 rounded-full border border-blue-100/50 backdrop-blur-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Clock size={16} className="text-indigo-600" />
          <span className="text-sm font-semibold text-indigo-900/70">{t.time_to_value}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-16 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={onRegister}
            className="group flex items-center justify-center bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-lg px-8 py-4 rounded-2xl font-bold hover:shadow-indigo-500/30 hover:shadow-2xl transition-all transform hover:-translate-y-1"
          >
            {t.cta_start}
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full text-left animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 hover:bg-white transition duration-300 group">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform duration-300">
              <Target size={28} />
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-2">Targeting</h3>
            <p className="text-slate-500 leading-relaxed">Identifica tus buyer personas primarios y secundarios con precisión.</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 hover:bg-white transition duration-300 group">
            <div className="w-14 h-14 bg-fuchsia-50 rounded-2xl flex items-center justify-center text-fuchsia-600 mb-6 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp size={28} />
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-2">Channels</h3>
            <p className="text-slate-500 leading-relaxed">Descubre en qué canales digitales y físicos se esconde tu demanda real.</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 hover:bg-white transition duration-300 group">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform duration-300">
              <BarChart3 size={28} />
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-2">Operations</h3>
            <p className="text-slate-500 leading-relaxed">Calcula tu capacidad operativa para escalar de forma sostenible.</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 hover:bg-white transition duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl">NEW</div>
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-6 group-hover:scale-110 transition-transform duration-300">
              <Globe size={28} />
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-2">Intel</h3>
            <p className="text-slate-500 leading-relaxed">Espía a tu competencia y escucha conversaciones reales en redes.</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 hover:bg-white transition duration-300 group">
            <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-600 mb-6 group-hover:scale-110 transition-transform duration-300">
              <Waves size={28} />
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-2">Blue Ocean</h3>
            <p className="text-slate-500 leading-relaxed">Descubre océanos azules y deja de competir por precio.</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 hover:bg-white transition duration-300 group">
            <div className="w-14 h-14 bg-lime-50 rounded-2xl flex items-center justify-center text-lime-600 mb-6 group-hover:scale-110 transition-transform duration-300">
              <ClipboardList size={28} />
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-2">Action Plan</h3>
            <p className="text-slate-500 leading-relaxed">Un plan de ejecución paso a paso priorizado por impacto.</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 hover:bg-white transition duration-300 group">
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6 group-hover:scale-110 transition-transform duration-300">
              <Activity size={28} />
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-2">Market Pulse</h3>
            <p className="text-slate-500 leading-relaxed">Benchmarks de tu industria: CAC, conversión y ciclos de venta.</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 hover:bg-white transition duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl">BETA</div>
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform duration-300">
              <Target size={28} />
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-2">Product Deep Dive</h3>
            <p className="text-slate-500 leading-relaxed">Analiza productos específicos usando el contexto de tu negocio.</p>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-20 px-4 sm:px-8 bg-white" id="pricing">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-indigo-50 text-indigo-700 font-bold text-xs uppercase tracking-wider px-4 py-1.5 rounded-full mb-4">
              {lang === 'es' ? 'Precios transparentes' : 'Transparent pricing'}
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              {lang === 'es' ? 'Simple. Sin sorpresas.' : 'Simple. No surprises.'}
            </h2>
            <p className="text-slate-500 mt-4 text-lg max-w-2xl mx-auto">
              {lang === 'es'
                ? 'Pagás solo por lo que usás. Sin suscripciones ni costos ocultos.'
                : 'Pay only for what you use. No subscriptions, no hidden costs.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Business Analysis */}
            <div className="relative bg-gradient-to-br from-white to-indigo-50/40 rounded-3xl border-2 border-indigo-200 p-8 text-center shadow-lg shadow-indigo-100/50">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                {lang === 'es' ? 'MÁS POPULAR' : 'MOST POPULAR'}
              </div>
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BarChart3 size={30} className="text-indigo-600" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                {lang === 'es' ? 'Análisis Estratégico' : 'Strategic Analysis'}
              </h3>
              <div className="flex items-baseline justify-center gap-1 my-4">
                <span className="text-5xl font-extrabold text-slate-900">
                  {reportPrice ? `$${(reportPrice).toLocaleString('es-AR')}` : '...'}
                </span>
                <span className="text-xl font-bold text-slate-400">ARS</span>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                {lang === 'es' ? 'Pago único por informe' : 'One-time payment per report'}
              </p>
              <ul className="text-left space-y-3 mb-8">
                {[
                  lang === 'es' ? 'Buyer Personas detallados' : 'Detailed Buyer Personas',
                  lang === 'es' ? 'Canales de adquisición' : 'Acquisition channels',
                  lang === 'es' ? 'Análisis competitivo' : 'Competitive analysis',
                  lang === 'es' ? 'Oportunidades de océano azul' : 'Blue ocean opportunities',
                  lang === 'es' ? 'Plan de acción personalizado' : 'Custom action plan',
                  lang === 'es' ? 'Métricas de industria' : 'Industry benchmarks',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={onRegister}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3.5 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
              >
                {lang === 'es' ? 'Comenzar ahora' : 'Start now'}
              </button>
            </div>

            {/* Product Deep Dive */}
            <div className="relative bg-white rounded-3xl border border-slate-200 p-8 text-center opacity-80">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-xs font-bold px-4 py-1 rounded-full">
                {lang === 'es' ? 'PRÓXIMAMENTE' : 'COMING SOON'}
              </div>
              <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <TrendingUp size={30} className="text-violet-600" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">Product Deep Dive</h3>
              <div className="flex items-baseline justify-center gap-1 my-4">
                <span className="text-5xl font-extrabold text-slate-900">$5</span>
                <span className="text-xl font-bold text-slate-400">USD</span>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                {lang === 'es' ? 'Por análisis de producto' : 'Per product analysis'}
              </p>
              <ul className="text-left space-y-3 mb-8">
                {[
                  lang === 'es' ? 'Basado en tu análisis de empresa' : 'Based on your business analysis',
                  lang === 'es' ? 'Posicionamiento de producto' : 'Product positioning',
                  lang === 'es' ? 'Análisis de mercado específico' : 'Specific market analysis',
                  lang === 'es' ? 'Estrategia de precios' : 'Pricing strategy',
                  lang === 'es' ? 'Canales de distribución' : 'Distribution channels',
                  lang === 'es' ? 'Roadmap de crecimiento' : 'Growth roadmap',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                disabled
                className="w-full bg-slate-100 text-slate-400 py-3.5 rounded-2xl font-bold text-lg cursor-not-allowed"
              >
                {lang === 'es' ? 'Próximamente' : 'Coming Soon'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-white border-t border-slate-100 py-12 flex flex-col items-center justify-center text-center">
        <FullLogo className="h-8 w-auto text-slate-300 mb-6 opacity-50 hover:opacity-100 transition-opacity duration-300" />
        <div className="flex items-center gap-4 mb-4">
          <a href="/privacy" className="text-slate-400 hover:text-indigo-600 text-sm font-medium transition">
            {lang === 'es' ? 'Privacidad' : 'Privacy'}
          </a>
          <span className="text-slate-200">·</span>
          <a href="/terms" className="text-slate-400 hover:text-indigo-600 text-sm font-medium transition">
            {lang === 'es' ? 'Términos' : 'Terms'}
          </a>
        </div>
        <p className="text-slate-400 text-sm font-medium">© 2026 BUYERSONA. {t.footer}.</p>
      </footer>
    </div>
  );
};