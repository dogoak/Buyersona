import React, { useState, useEffect, useRef } from 'react';
import { BusinessInput, Language } from '../types';
import { translations } from '../utils/translations';
import { analyzeWebsite } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowRight, ArrowLeft, Building2, Box, Activity, Users,
  DollarSign, BarChart3, TrendingUp, AlertCircle, Target,
  User, Check, Briefcase, ShoppingBag, Globe, Zap, Clock, ShieldAlert,
  CreditCard, Repeat, Calendar, Briefcase as BriefcaseIcon, RefreshCw,
  MapPin, Coins, Phone, Mail, MessageCircle, Link, Search, Share2, Crown, Users2,
  Lightbulb, AlertTriangle, TrendingDown, Eye, HelpCircle, FileText, Store, Truck,
  Facebook, PlusCircle, Flame, Trophy, GitBranch, Factory, Heart, MousePointer, Smartphone, Loader2, XCircle, Rocket, Gift, Landmark,
  Bot, Workflow, Database, LayoutTemplate
} from 'lucide-react';

interface OnboardingProps {
  lang: Language;
  onComplete: (data: BusinessInput) => void;
  onStepChange?: (step: number, data: BusinessInput) => void;
  initialStep?: number;
  initialData?: BusinessInput;
}

const TOTAL_STEPS = 7;

// --- UI COMPONENTS ---

const PlaneIcon = ({ size, className }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12h20" /><path d="M13 2l9 10-9 10" /><path d="M2 12l5-5m0 10l-5-5" /></svg>
);

// --- LOCATION AUTOCOMPLETE COMPONENT ---
interface LocationResult {
  display_name: string;
  place_id: number;
}

const LocationAutocomplete = ({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder: string }) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 2 && showDropdown) {
        setIsLoading(true);
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`, {
            headers: {
              'User-Agent': 'BuyersonaApp/1.0'
            }
          });
          const data = await response.json();
          setResults(data);
        } catch (e) {
          console.error("Location fetch error", e);
        } finally {
          setIsLoading(false);
        }
      } else if (query.length <= 2) {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, showDropdown]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSelect = (item: LocationResult) => {
    const cleanName = item.display_name;
    setQuery(cleanName);
    onChange(cleanName);
    setShowDropdown(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onChange(e.target.value);
    setShowDropdown(true);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          className="w-full pl-12 pr-10 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-md bg-slate-50 transition-all"
          value={query}
          onChange={handleChange}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <Loader2 className="animate-spin text-indigo-500" size={18} />
          </div>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in-up">
          <ul>
            {results.map((item) => (
              <li
                key={item.place_id}
                onClick={() => handleSelect(item)}
                className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0 text-sm text-slate-700 flex items-start"
              >
                <MapPin size={16} className="mt-0.5 mr-2 text-slate-400 flex-shrink-0" />
                <span>{item.display_name}</span>
              </li>
            ))}
          </ul>
          <div className="bg-slate-50 px-3 py-1 text-[10px] text-slate-400 text-right">
            Powered by OpenStreetMap
          </div>
        </div>
      )}
    </div>
  );
};


interface SectionTitleProps {
  title: string;
  icon: any;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ title, icon: Icon }) => (
  <div className="flex items-center space-x-4 mb-8">
    <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-3 rounded-xl text-white shadow-lg shadow-indigo-200">
      <Icon size={28} />
    </div>
    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h2>
  </div>
);

interface QuestionProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

const Question: React.FC<QuestionProps> = ({ label, hint, children }) => (
  <div className="mb-10 animate-fade-in">
    <label className="block text-sm font-bold text-slate-800 mb-2 uppercase tracking-wide">{label}</label>
    {hint && <p className="text-sm text-slate-500 mb-4 bg-indigo-50 p-3 rounded-lg inline-block border border-indigo-100">{hint}</p>}
    {!hint && <div className="mb-3"></div>}
    {children}
  </div>
);

interface CardOptionProps {
  label: string;
  icon?: any;
  selected: boolean;
  onClick: () => void;
}

const CardOption: React.FC<CardOptionProps> = ({
  label,
  icon: Icon,
  selected,
  onClick
}) => (
  <div
    onClick={onClick}
    className={`cursor-pointer relative group rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all duration-300 h-full ${selected
      ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105 transform z-10'
      : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:shadow-md hover:-translate-y-1'
      }`}
  >
    {selected && (
      <div className="absolute top-2 right-2">
        <div className="bg-white/20 rounded-full p-1">
          <Check size={12} className="text-white" />
        </div>
      </div>
    )}
    {Icon && <Icon size={28} className={`mb-3 transition-colors ${selected ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'}`} />}
    <span className="font-semibold text-sm leading-tight">{label}</span>
  </div>
);

export default function Onboarding({ lang, onComplete, onStepChange, initialStep = 0, initialData }: OnboardingProps) {
  const { user } = useAuth();
  const t = translations[lang].onboarding;

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isAnalyzingUrl, setIsAnalyzingUrl] = useState(false);
  const [formData, setFormData] = useState<BusinessInput>(initialData || {
    // Identity & Context
    businessName: '',
    businessStage: 'startup', // Default
    websiteUrl: '',
    businessType: [],
    customBusinessType: '',
    distributionModel: '',
    offeringType: '',
    differentiation: '',
    description: '',
    locationScope: '',
    targetRegion: '',
    currency: 'USD',

    // Product Intelligence
    productName: '',
    productImages: [],
    documents: [],
    productTargetScope: 'b2b',

    // B2B Specifics
    b2bUseCase: [],
    b2bBuyerRole: [],
    b2bProblemSolved: [],
    customB2bProblem: '',
    b2bPurchaseDrivers: [],
    customB2bDriver: '',

    // B2C Specifics
    b2cPurchaseContext: [],
    b2cNaturalChannel: [],
    b2cProblemSolved: [],
    customB2cProblem: '',
    b2cPurchaseDrivers: [],
    customB2cDriver: '',

    // Legacy/Shared
    secondaryBenefits: [],
    painOfInaction: '',
    marketPositioning: '',
    priceRelativity: '',
    usageFrequency: [],

    // Revenue
    targetCustomer: [],
    paymentModel: [],
    productPrice: '',
    purchaseVolume: '',
    transactionValue: '', // Legacy
    customerValue: [],
    salesCycle: [],

    // Acquisition
    socialMediaPresence: [],
    customSocialMedia: '',
    salesChannels: [],
    customSalesChannel: '',
    acquisitionChannels: [],
    customAcquisitionChannel: '',
    bestChannel: '',
    bestClientChannel: '',
    volumeChannel: '',
    adSpendRange: '',
    customAdSpend: '',
    demandPredictability: '',
    responseMechanism: '',
    prospectingSources: [],
    customProspectingSource: '',

    // Strategic Ambition
    exploreSecondaryMarket: false,
    secondaryMarketType: undefined,

    // Operations
    teamSize: 1,
    capacityPerDay: 10,
    capacityChannel: [],
    responseSla: '',
    automationTools: [],
    toolsUsed: '',
    surgeHandling: '',
    supportReadiness: '',

    // Pain & Ambition
    primaryPain: [],
    customPain: '',
    businessRiskIfNoChange: '',
    growthGoal: [],
    growthPace: '',
    additionalNotes: ''
  });

  const updateField = (field: keyof BusinessInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUrlAnalysis = async () => {
    if (!formData.websiteUrl) return;
    setIsAnalyzingUrl(true);

    // Safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsAnalyzingUrl(false);
      // Optional: You could set an error state here to show a message to the user
    }, 15000); // 15 seconds max

    try {
      const { result: jsonString, costUsd } = await analyzeWebsite(formData.websiteUrl, lang);
      if (jsonString) {
        try {
          const data = JSON.parse(jsonString);
          setFormData(prev => ({
            ...prev,
            description: data.description || prev.description,
            productName: data.productName || prev.productName,
            targetRegion: data.targetRegion || prev.targetRegion,
            businessType: Array.isArray(data.businessType) ? data.businessType : (data.businessType ? [data.businessType] : prev.businessType),
            distributionModel: data.distributionModel || prev.distributionModel,
            productTargetScope: data.distributionModel || prev.productTargetScope, // Auto-sync scope
            websiteAnalysisCostUsd: costUsd
          }));
        } catch (e) {
          // Fallback if not JSON (legacy support)
          updateField('description', jsonString);
          updateField('websiteAnalysisCostUsd', costUsd);
        }
      }
    } catch (e) {
      console.error("Analysis failed", e);
    } finally {
      clearTimeout(timeoutId);
      setIsAnalyzingUrl(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'productImages' | 'documents') => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      const readers = files.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers).then(base64Files => {
        setFormData(prev => ({
          ...prev,
          [field]: [...(prev[field] || []), ...base64Files]
        }));
      });
    }
  };

  const removeFile = (field: 'productImages' | 'documents', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index)
    }));
  };

  const toggleArrayField = (field: keyof BusinessInput, value: string) => {
    setFormData(prev => {
      const list = (prev[field] as string[]) || [];
      const updated = list.includes(value)
        ? list.filter(item => item !== value)
        : [...list, value];
      return { ...prev, [field]: updated };
    });
  };

  const isSoftCurrency = (currency: string) => {
    return ['ARS', 'CLP', 'COP', 'MXN'].includes(currency);
  };

  const getTransactionLabel = (id: string) => {
    const isSoft = isSoftCurrency(formData.currency);
    const labels: Record<string, string> = {
      'under_50': isSoft ? '< 50,000' : '< 50',
      '50_200': isSoft ? '50k - 200k' : '50 - 200',
      '200_1000': isSoft ? '200k - 1M' : '200 - 1k',
      '1000_5000': isSoft ? '1M - 5M' : '1k - 5k',
      'over_5000': isSoft ? '> 5M' : '> 5k',
    };
    return labels[id] || id;
  };

  const next = async () => {
    let newStepsData = { ...formData };
    if (currentStep === 3) {
      if (formData.exploreSecondaryMarket) {
        const secondary = formData.productTargetScope === 'b2b' ? 'b2c' : 'b2b';
        newStepsData.secondaryMarketType = secondary;
        updateField('secondaryMarketType', secondary);
      } else {
        newStepsData.secondaryMarketType = undefined;
        newStepsData.supportReadiness = undefined;
        updateField('secondaryMarketType', undefined);
        updateField('supportReadiness', undefined);
      }
    }

    if (currentStep < TOTAL_STEPS - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      window.scrollTo(0, 0);
      if (onStepChange) onStepChange(nextStep, newStepsData);
    } else {
      // Final step completed
      onComplete(newStepsData);
    }
  };

  const back = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      if (onStepChange) onStepChange(prevStep, formData);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      // STAGE 0: IDENTITY
      case 0: return (
        <>
          <SectionTitle title={t.steps.identity} icon={Building2} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <Question label={t.questions.q_name}>
              <input
                type="text"
                className="w-full px-5 py-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-lg transition-all"
                value={formData.businessName}
                onChange={(e) => updateField('businessName', e.target.value)}
                placeholder="e.g. Acme Inc."
              />
            </Question>
            <Question label={t.questions.q_currency}>
              <select
                className="w-full px-5 py-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none text-lg bg-white"
                value={formData.currency}
                onChange={(e) => updateField('currency', e.target.value)}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="ARS">ARS ($)</option>
                <option value="MXN">MXN ($)</option>
                <option value="COP">COP ($)</option>
                <option value="CLP">CLP ($)</option>
              </select>
            </Question>
          </div>

          {/* NEW: Business Stage */}
          <Question label={lang === 'es' ? 'Etapa del Negocio' : 'Business Stage'} hint={lang === 'es' ? 'Esto adapta las preguntas a tu realidad.' : 'This adapts questions to your reality.'}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: 'idea', label: lang === 'es' ? 'Idea / Validando' : 'Idea / Validating', icon: Lightbulb },
                { id: 'startup', label: lang === 'es' ? 'Lanzamiento' : 'Launch / Startup', icon: Rocket },
                { id: 'growth', label: lang === 'es' ? 'Crecimiento' : 'Growth', icon: TrendingUp },
                { id: 'mature', label: lang === 'es' ? 'Consolidado' : 'Mature', icon: Crown },
              ].map(opt => (
                <CardOption
                  key={opt.id}
                  label={opt.label}
                  icon={opt.icon}
                  selected={formData.businessStage === opt.id}
                  onClick={() => updateField('businessStage', opt.id)}
                />
              ))}
            </div>
          </Question>

          {/* NEW: Website URL & Analysis */}
          <Question label={lang === 'es' ? 'Sitio Web (Opcional)' : 'Website URL (Optional)'} hint={lang === 'es' ? 'Analizaremos tu web para entender tu negocio automáticamente.' : 'We will analyze your site to understand your business automatically.'}>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-grow px-5 py-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-lg transition-all"
                value={formData.websiteUrl || ''}
                onChange={(e) => updateField('websiteUrl', e.target.value)}
                placeholder="https://example.com"
              />
              <button
                onClick={handleUrlAnalysis}
                disabled={!formData.websiteUrl || isAnalyzingUrl}
                className="bg-indigo-600 text-white px-6 rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isAnalyzingUrl ? <Loader2 className="animate-spin" /> : <Search size={20} />}
                <span className="ml-2 hidden sm:inline">{lang === 'es' ? 'Analizar' : 'Analyze'}</span>
              </button>
            </div>
          </Question>

          <Question label={lang === 'es' ? 'Descripción del Negocio' : 'Business Description'} hint={lang === 'es' ? 'Edita si el análisis automático no fue preciso.' : 'Edit if the automatic analysis was not accurate.'}>
            <textarea
              className="w-full px-5 py-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-md transition-all h-32"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder={lang === 'es' ? "Describe qué haces, para quién y cómo..." : "Describe what you do, for whom, and how..."}
            />
          </Question>

          <Question label={lang === 'es' ? '¿Qué te diferencia de la competencia?' : 'What differentiates you from competitors?'} hint={lang === 'es' ? 'Tu ventaja competitiva principal.' : 'Your main competitive advantage.'}>
            <input
              type="text"
              className="w-full px-5 py-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-lg transition-all"
              value={formData.differentiation}
              onChange={(e) => updateField('differentiation', e.target.value)}
              placeholder={lang === 'es' ? "Ej: Somos los únicos que..." : "e.g. We are the only ones that..."}
            />
          </Question>

          <Question label={t.questions.q_geo}>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { id: 'local', label: t.options.local, icon: MapPin },
                { id: 'national', label: t.options.national, icon: Globe },
                { id: 'global', label: t.options.global, icon: PlaneIcon },
              ].map(opt => (
                <CardOption
                  key={opt.id}
                  label={opt.label}
                  icon={opt.icon}
                  selected={formData.locationScope === opt.id}
                  onClick={() => updateField('locationScope', opt.id)}
                />
              ))}
            </div>
            <LocationAutocomplete
              value={formData.targetRegion}
              onChange={(val) => updateField('targetRegion', val)}
              placeholder={lang === 'es' ? "Ej: Buenos Aires, Argentina" : "e.g. New York, USA"}
            />
          </Question>

          <Question label={t.questions.q_type}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {[
                { id: 'factory', label: t.options.factory, icon: Box },
                { id: 'brand', label: t.options.brand, icon: Target },
                { id: 'distributor', label: t.options.distributor, icon: ShoppingBag },
                { id: 'service', label: t.options.service, icon: Briefcase },
                { id: 'software', label: t.options.software, icon: Zap },
                { id: 'other', label: t.options.other, icon: PlusCircle },
              ].map(opt => (
                <CardOption
                  key={opt.id}
                  label={opt.label}
                  icon={opt.icon}
                  selected={formData.businessType.includes(opt.id)}
                  onClick={() => toggleArrayField('businessType', opt.id)}
                />
              ))}
            </div>
            {formData.businessType.includes('other') && (
              <input
                type="text"
                className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-md bg-slate-50 animate-fade-in"
                value={formData.customBusinessType}
                onChange={(e) => updateField('customBusinessType', e.target.value)}
                placeholder={t.questions.q_type_other}
              />
            )}
          </Question>

          <Question label={t.questions.q_dist_model}>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'b2c', label: t.options.dist_b2c, icon: Store },
                { id: 'b2b', label: t.options.dist_b2b, icon: Truck },
                { id: 'both', label: t.options.dist_both, icon: Repeat },
              ].map(opt => (
                <CardOption
                  key={opt.id}
                  label={opt.label}
                  icon={opt.icon}
                  selected={formData.distributionModel === opt.id}
                  onClick={() => updateField('distributionModel', opt.id)}
                />
              ))}
            </div>
          </Question>
        </>
      );

      // STAGE 1: PRODUCT INTELLIGENCE (UPDATED WITH SEPARATE B2B/B2C LOGIC)
      case 1:
        // Use distributionModel from Step 0 as the source of truth
        const showB2B = formData.distributionModel === 'b2b' || formData.distributionModel === 'both';
        const showB2C = formData.distributionModel === 'b2c' || formData.distributionModel === 'both';

        return (
          <>
            <SectionTitle title={t.steps.product} icon={Lightbulb} />

            <Question label={t.questions.q_what_sell} hint={t.questions.q_what_sell_hint}>
              <input
                type="text"
                className="w-full px-5 py-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-lg transition-all"
                value={formData.productName}
                onChange={(e) => updateField('productName', e.target.value)}
              />
            </Question>

            {/* NEW: File Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Question label={lang === 'es' ? 'Fotos del Producto' : 'Product Photos'} hint={lang === 'es' ? 'Ayuda a la IA a "ver" lo que vendes.' : 'Helps AI "see" what you sell.'}>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition cursor-pointer relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => handleFileUpload(e, 'productImages')}
                  />
                  <div className="flex flex-col items-center text-slate-400">
                    <Box size={32} className="mb-2" />
                    <span className="text-sm font-bold">{lang === 'es' ? 'Subir Imágenes' : 'Upload Images'}</span>
                  </div>
                </div>
                {/* Preview */}
                {formData.productImages && formData.productImages.length > 0 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                    {formData.productImages.map((img, i) => (
                      <div key={i} className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200 group">
                        <img src={img} alt="preview" className="w-full h-full object-cover" />
                        <button onClick={() => removeFile('productImages', i)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition"><XCircle size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </Question>

              <Question label={lang === 'es' ? 'Documentación / PDF' : 'Documentation / PDF'} hint={lang === 'es' ? 'Brochures, menús, listas de precios.' : 'Brochures, menus, price lists.'}>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition cursor-pointer relative">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,application/pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => handleFileUpload(e, 'documents')}
                  />
                  <div className="flex flex-col items-center text-slate-400">
                    <FileText size={32} className="mb-2" />
                    <span className="text-sm font-bold">{lang === 'es' ? 'Subir PDFs' : 'Upload PDFs'}</span>
                  </div>
                </div>
                {/* Preview */}
                {formData.documents && formData.documents.length > 0 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                    {formData.documents.map((doc, i) => (
                      <div key={i} className="relative w-16 h-16 flex-shrink-0 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center group">
                        <FileText size={24} className="text-slate-400" />
                        <button onClick={() => removeFile('documents', i)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition"><XCircle size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </Question>
            </div>

            {/* B2B CONTEXT SECTION */}
            {showB2B && (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 animate-fade-in-up shadow-sm">
                <div className="flex items-center mb-6 border-b border-indigo-100 pb-2">
                  <Factory className="text-indigo-600 mr-2" size={20} />
                  <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest">{t.options.b2b}</h3>
                </div>

                <Question label={t.questions.q_b2b_use}>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'resale', label: t.options.b2b_use_resale },
                      { id: 'input', label: t.options.b2b_use_input },
                      { id: 'operations', label: t.options.b2b_use_ops },
                      { id: 'gift', label: t.options.b2b_use_gift },
                    ].map(opt => (
                      <CardOption
                        key={opt.id} label={opt.label}
                        selected={(formData.b2bUseCase || []).includes(opt.id)}
                        onClick={() => toggleArrayField('b2bUseCase', opt.id)}
                      />
                    ))}
                  </div>
                </Question>
                <Question label={t.questions.q_b2b_role}>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'owner', label: t.options.b2b_role_owner },
                      { id: 'procurement', label: t.options.b2b_role_procurement },
                      { id: 'ops', label: t.options.b2b_role_ops },
                      { id: 'marketing', label: t.options.b2b_role_marketing },
                    ].map(opt => (
                      <CardOption
                        key={opt.id} label={opt.label}
                        selected={(formData.b2bBuyerRole || []).includes(opt.id)}
                        onClick={() => toggleArrayField('b2bBuyerRole', opt.id)}
                      />
                    ))}
                  </div>
                </Question>

                {/* B2B Specific Value Prop */}
                <Question label={t.questions.q_b2b_problem}>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {[
                      { id: 'revenue', label: t.options.b2b_prob_revenue },
                      { id: 'cost', label: t.options.b2b_prob_cost },
                      { id: 'risk', label: t.options.b2b_prob_risk },
                      { id: 'efficiency', label: t.options.b2b_prob_efficiency },
                      { id: 'resale', label: t.options.b2b_prob_resale },
                      { id: 'other', label: t.options.prob_other },
                    ].map(opt => (
                      <CardOption
                        key={opt.id} label={opt.label}
                        selected={(formData.b2bProblemSolved || []).includes(opt.id)}
                        onClick={() => toggleArrayField('b2bProblemSolved', opt.id)}
                      />
                    ))}
                  </div>
                  {formData.b2bProblemSolved?.includes('other') && (
                    <input type="text" className="w-full px-5 py-2 rounded-xl border border-slate-200" value={formData.customB2bProblem} onChange={(e) => updateField('customB2bProblem', e.target.value)} placeholder="..." />
                  )}
                </Question>

                <Question label={t.questions.q_b2b_driver}>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {[
                      { id: 'margin', label: t.options.b2b_driver_margin },
                      { id: 'reliability', label: t.options.b2b_driver_reliability },
                      { id: 'speed', label: t.options.b2b_driver_speed },
                      { id: 'relationship', label: t.options.b2b_driver_relationship },
                      { id: 'other', label: t.options.driver_other },
                    ].map(opt => (
                      <CardOption
                        key={opt.id} label={opt.label}
                        selected={(formData.b2bPurchaseDrivers || []).includes(opt.id)}
                        onClick={() => toggleArrayField('b2bPurchaseDrivers', opt.id)}
                      />
                    ))}
                  </div>
                  {formData.b2bPurchaseDrivers?.includes('other') && (
                    <input type="text" className="w-full px-5 py-2 rounded-xl border border-slate-200" value={formData.customB2bDriver} onChange={(e) => updateField('customB2bDriver', e.target.value)} placeholder="..." />
                  )}
                </Question>
              </div>
            )}

            {/* B2C CONTEXT SECTION */}
            {showB2C && (
              <div className="bg-pink-50 p-6 rounded-2xl border border-pink-100 mb-8 animate-fade-in-up shadow-sm">
                <div className="flex items-center mb-6 border-b border-pink-200 pb-2">
                  <Heart className="text-pink-600 mr-2" size={20} />
                  <h3 className="text-sm font-bold text-pink-600 uppercase tracking-widest">{t.options.b2c}</h3>
                </div>

                <Question label={t.questions.q_b2c_context}>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'daily', label: t.options.b2c_ctx_daily },
                      { id: 'event', label: t.options.b2c_ctx_event },
                      { id: 'gift', label: t.options.b2c_ctx_gift },
                      { id: 'status', label: t.options.b2c_ctx_status },
                      { id: 'pleasure', label: lang === 'es' ? 'Placer / Capricho' : 'Pleasure / Indulgence' },
                    ].map(opt => (
                      <CardOption
                        key={opt.id} label={opt.label}
                        selected={(formData.b2cPurchaseContext || []).includes(opt.id)}
                        onClick={() => toggleArrayField('b2cPurchaseContext', opt.id)}
                      />
                    ))}
                  </div>
                </Question>

                {/* B2C Specific Value Prop */}
                <Question label={lang === 'es' ? '¿Qué problema le resuelves?' : 'What problem do you solve for them?'} hint={lang === 'es' ? 'El motivo principal por el que te compran.' : 'The main reason they buy from you.'}>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {[
                      { id: 'need', label: t.options.b2c_prob_need },
                      { id: 'pleasure', label: t.options.b2c_prob_pleasure },
                      { id: 'health', label: t.options.b2c_prob_health },
                      { id: 'status', label: t.options.b2c_prob_status },
                      { id: 'convenience', label: t.options.b2c_prob_convenience },
                      { id: 'other', label: t.options.prob_other },
                    ].map(opt => (
                      <CardOption
                        key={opt.id} label={opt.label}
                        selected={(formData.b2cProblemSolved || []).includes(opt.id)}
                        onClick={() => toggleArrayField('b2cProblemSolved', opt.id)}
                      />
                    ))}
                  </div>
                  {formData.b2cProblemSolved?.includes('other') && (
                    <input type="text" className="w-full px-5 py-2 rounded-xl border border-pink-200" value={formData.customB2cProblem} onChange={(e) => updateField('customB2cProblem', e.target.value)} placeholder="..." />
                  )}
                </Question>

                <Question label={t.questions.q_b2c_driver}>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {[
                      { id: 'price', label: t.options.b2c_driver_price },
                      { id: 'brand', label: t.options.b2c_driver_brand },
                      { id: 'convenience', label: t.options.b2c_driver_convenience },
                      { id: 'review', label: t.options.b2c_driver_review },
                      { id: 'design', label: t.options.b2c_driver_design },
                      { id: 'other', label: t.options.driver_other },
                    ].map(opt => (
                      <CardOption
                        key={opt.id} label={opt.label}
                        selected={(formData.b2cPurchaseDrivers || []).includes(opt.id)}
                        onClick={() => toggleArrayField('b2cPurchaseDrivers', opt.id)}
                      />
                    ))}
                  </div>
                  {formData.b2cPurchaseDrivers?.includes('other') && (
                    <input type="text" className="w-full px-5 py-2 rounded-xl border border-pink-200" value={formData.customB2cDriver} onChange={(e) => updateField('customB2cDriver', e.target.value)} placeholder="..." />
                  )}
                </Question>

                <Question label={t.questions.q_b2c_channel}>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'social', label: t.options.b2c_chan_social },
                      { id: 'search', label: t.options.b2c_chan_search },
                      { id: 'physical', label: t.options.b2c_chan_physical },
                      { id: 'market', label: t.options.b2c_chan_market },
                    ].map(opt => (
                      <CardOption
                        key={opt.id} label={opt.label}
                        selected={(formData.b2cNaturalChannel || []).includes(opt.id)}
                        onClick={() => toggleArrayField('b2cNaturalChannel', opt.id)}
                      />
                    ))}
                  </div>
                </Question>
              </div>
            )}

            <Question label={t.questions.q_inaction} hint={t.questions.q_inaction_hint}>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-5 py-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-lg transition-all"
                  value={formData.painOfInaction}
                  onChange={(e) => updateField('painOfInaction', e.target.value)}
                />
                <button
                  onClick={() => updateField('painOfInaction', lang === 'es' ? "No estoy seguro" : "I'm not sure")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-indigo-600 bg-slate-100 px-3 py-1 rounded-full transition"
                >
                  {lang === 'es' ? 'No estoy seguro' : 'Not sure'}
                </button>
              </div>
            </Question>

            <Question label={t.questions.q_freq}>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'yes', label: t.options.freq_yes },
                  { id: 'sometimes', label: t.options.freq_sometimes },
                  { id: 'no', label: t.options.freq_no },
                ].map(opt => (
                  <CardOption
                    key={opt.id}
                    label={opt.label}
                    selected={formData.usageFrequency.includes(opt.id)}
                    onClick={() => toggleArrayField('usageFrequency', opt.id)}
                  />
                ))}
              </div>
            </Question>
          </>
        );

      // STAGE 2: REVENUE MODEL (UPDATED)
      case 2:
        const isIdea = formData.businessStage === 'idea';

        return (
          <>
            <SectionTitle title={t.steps.revenue} icon={DollarSign} />

            {/* MOVED FROM STEP 1: Positioning & Price Relativity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <Question label={t.questions.q_market_pos}>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'mass', label: t.options.pos_mass },
                    { id: 'premium', label: t.options.pos_premium },
                    { id: 'luxury', label: t.options.pos_luxury },
                    { id: 'unsure', label: t.options.pos_unsure },
                  ].map(opt => (
                    <CardOption
                      key={opt.id}
                      label={opt.label}
                      selected={formData.marketPositioning === opt.id}
                      onClick={() => updateField('marketPositioning', opt.id)}
                    />
                  ))}
                </div>
              </Question>

              <Question label={t.questions.q_price_rel}>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'v_cheap', label: t.options.price_v_cheap },
                    { id: 'cheap', label: t.options.price_cheap },
                    { id: 'medium', label: t.options.price_medium },
                    { id: 'expensive', label: t.options.price_expensive },
                    { id: 'v_expensive', label: t.options.price_v_expensive },
                  ].map(opt => (
                    <CardOption
                      key={opt.id}
                      label={opt.label}
                      selected={formData.priceRelativity === opt.id}
                      onClick={() => updateField('priceRelativity', opt.id)}
                    />
                  ))}
                </div>
              </Question>
            </div>

            <Question
              label={isIdea ? (lang === 'es' ? '¿Quién sería tu cliente ideal?' : 'Who would be your ideal customer?') : t.questions.q_target}
              hint={isIdea ? (lang === 'es' ? 'A quién apuntas venderle.' : 'Who you aim to sell to.') : undefined}
            >
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'smb', label: t.options.cust_smb, icon: Store },
                  { id: 'enterprise', label: t.options.cust_enterprise, icon: Building2 },
                  { id: 'consumer', label: t.options.cust_consumer, icon: User },
                  { id: 'gov', label: t.options.cust_gov, icon: Globe },
                ].map(opt => (
                  <CardOption
                    key={opt.id}
                    label={opt.label}
                    icon={opt.icon}
                    selected={formData.targetCustomer.includes(opt.id)}
                    onClick={() => toggleArrayField('targetCustomer', opt.id)}
                  />
                ))}
              </div>
            </Question>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Question
                label={`${lang === 'es' ? 'Precio Unitario Promedio' : 'Average Unit Price'} (${formData.currency})`}
                hint={formData.distributionModel === 'both'
                  ? (lang === 'es' ? 'Si vendes a ambos, usa el precio de tu segmento PRINCIPAL.' : 'If you sell to both, use the price of your PRIMARY segment.')
                  : (lang === 'es' ? 'Cuánto cuesta 1 unidad de tu producto/servicio.' : 'Cost of 1 unit of your product/service.')}
              >
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 font-bold">{formData.currency}</span>
                  <input
                    type="number"
                    className="w-full pl-16 pr-5 py-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none text-lg transition-all"
                    value={formData.productPrice}
                    onChange={(e) => updateField('productPrice', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </Question>

              <Question
                label={lang === 'es' ? 'Volumen de Compra Típico' : 'Typical Purchase Volume'}
                hint={formData.distributionModel === 'both'
                  ? (lang === 'es' ? 'Ej: "B2B: 100u, B2C: 1u" o enfócate en el principal.' : 'e.g. "B2B: 100u, B2C: 1u" or focus on primary.')
                  : (lang === 'es' ? 'Cuántas unidades compra un cliente en una transacción.' : 'How many units a customer buys in one transaction.')}
              >
                <input
                  type="text"
                  className="w-full px-5 py-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none text-lg transition-all"
                  value={formData.purchaseVolume}
                  onChange={(e) => updateField('purchaseVolume', e.target.value)}
                  placeholder={lang === 'es' ? "Ej: 1 unidad, 100 usuarios, 5 cajas" : "e.g. 1 unit, 100 users, 5 boxes"}
                />
              </Question>
            </div>

            <Question label={isIdea ? (lang === 'es' ? '¿Cómo planeas cobrar?' : 'How do you plan to charge?') : t.questions.q_payment_model}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { id: 'one_time', label: t.options.pay_one_time, icon: CreditCard },
                  { id: 'subscription', label: t.options.pay_subscription, icon: RefreshCw },
                  { id: 'usage', label: t.options.pay_usage, icon: Activity },
                  { id: 'freemium', label: t.options.pay_freemium, icon: Gift }, // Ensure Gift is imported or use another icon
                ].map(opt => (
                  <CardOption
                    key={opt.id}
                    label={opt.label}
                    icon={opt.icon}
                    selected={formData.paymentModel.includes(opt.id)}
                    onClick={() => toggleArrayField('paymentModel', opt.id)}
                  />
                ))}
              </div>
            </Question>

            <Question label={t.questions.q_ltv}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: 'single', label: t.options.ltv_single },
                  { id: 'multiple', label: t.options.ltv_multiple },
                  { id: 'long_term', label: t.options.ltv_longterm },
                  { id: 'unknown', label: t.options.ltv_unknown },
                ].map(opt => (
                  <CardOption
                    key={opt.id}
                    label={opt.label}
                    selected={formData.customerValue.includes(opt.id)}
                    onClick={() => toggleArrayField('customerValue', opt.id)}
                  />
                ))}
              </div>
            </Question>

            <Question label={t.questions.q_cycle}>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { id: 'instant', label: t.options.instant },
                  { id: 'days', label: t.options.days },
                  { id: 'weeks', label: t.options.weeks },
                  { id: 'months', label: t.options.months },
                  { id: 'unknown', label: t.options.unknown },
                ].map(opt => (
                  <CardOption
                    key={opt.id}
                    label={opt.label}
                    selected={formData.salesCycle.includes(opt.id)}
                    onClick={() => toggleArrayField('salesCycle', opt.id)}
                  />
                ))}
              </div>
            </Question>
          </>
        );

      // STAGE 3: ACQUISITION & GO-TO-MARKET
      case 3:
        const canExploreSecondary = formData.productTargetScope === 'b2b' || formData.productTargetScope === 'b2c';
        const secondaryLabel = formData.productTargetScope === 'b2b' ? t.options.explore_yes_b2c : t.options.explore_yes_b2b;

        return (
          <>
            <SectionTitle title={t.steps.acquisition} icon={BarChart3} />

            {/* SALES CHANNELS (Where transaction happens) */}
            <Question label={lang === 'es' ? '¿Dónde se concreta la venta?' : 'Where does the sale happen?'}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {[
                  { id: 'physical_store', label: lang === 'es' ? 'Local / Tienda Física' : 'Physical Store' },
                  { id: 'ecommerce', label: lang === 'es' ? 'E-commerce Propio' : 'Own E-commerce' },
                  { id: 'marketplace', label: lang === 'es' ? 'Marketplace (Amazon/Meli)' : 'Marketplace' },
                  { id: 'whatsapp', label: 'WhatsApp / Chat' },
                  { id: 'phone', label: lang === 'es' ? 'Teléfono' : 'Phone' },
                  { id: 'meeting', label: lang === 'es' ? 'Reunión / Propuesta' : 'Meeting / Proposal' },
                  { id: 'other', label: lang === 'es' ? 'Otro' : 'Other' },
                ].map(opt => (
                  <CardOption
                    key={opt.id}
                    label={opt.label}
                    selected={formData.salesChannels.includes(opt.id)}
                    onClick={() => toggleArrayField('salesChannels', opt.id)}
                  />
                ))}
              </div>
              {formData.salesChannels.includes('other') && (
                <input
                  type="text"
                  className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-md bg-slate-50 animate-fade-in"
                  value={formData.customSalesChannel}
                  onChange={(e) => updateField('customSalesChannel', e.target.value)}
                  placeholder={lang === 'es' ? 'Ej: Ferias, Pop-ups, Showroom...' : 'e.g. Trade shows, Pop-ups...'}
                />
              )}
            </Question>

            {/* SOCIAL MEDIA PRESENCE */}
            <Question label={lang === 'es' ? '¿En qué redes sociales tenés presencia activa?' : 'Which social media platforms are you active on?'} hint={lang === 'es' ? 'Seleccioná todas las que uses.' : 'Select all that apply.'}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { id: 'instagram', label: 'Instagram' },
                  { id: 'facebook', label: 'Facebook' },
                  { id: 'tiktok', label: 'TikTok' },
                  { id: 'linkedin', label: 'LinkedIn' },
                  { id: 'youtube', label: 'YouTube' },
                  { id: 'twitter', label: 'Twitter / X' },
                  { id: 'pinterest', label: 'Pinterest' },
                  { id: 'none', label: lang === 'es' ? 'Ninguna' : 'None' },
                  { id: 'other', label: lang === 'es' ? 'Otra' : 'Other' },
                ].map(opt => (
                  <CardOption
                    key={opt.id}
                    label={opt.label}
                    selected={formData.socialMediaPresence.includes(opt.id)}
                    onClick={() => toggleArrayField('socialMediaPresence', opt.id)}
                  />
                ))}
              </div>
              {formData.socialMediaPresence.includes('other') && (
                <input
                  type="text"
                  className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-md bg-slate-50 animate-fade-in"
                  value={formData.customSocialMedia}
                  onChange={(e) => updateField('customSocialMedia', e.target.value)}
                  placeholder={lang === 'es' ? 'Ej: Threads, Telegram...' : 'e.g. Threads, Telegram...'}
                />
              )}
            </Question>

            {/* MARKETING CHANNELS (Traffic) */}
            <Question label={t.questions.q_channels}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {['Google Ads', 'SEO/Organic', 'Meta Ads (FB/IG)', 'TikTok/Reels', 'LinkedIn/Cold', 'Referrals/WOM', 'Influencers', 'Events', 'Other'].map(channel => (
                  <CardOption
                    key={channel}
                    label={channel}
                    selected={formData.acquisitionChannels.includes(channel)}
                    onClick={() => toggleArrayField('acquisitionChannels', channel)}
                  />
                ))}
              </div>
              {formData.acquisitionChannels.includes('Other') && (
                <input
                  type="text"
                  className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-md bg-slate-50 animate-fade-in"
                  value={formData.customAcquisitionChannel}
                  onChange={(e) => updateField('customAcquisitionChannel', e.target.value)}
                  placeholder={t.questions.q_channel_other}
                />
              )}
            </Question>

            <Question label={t.questions.q_ad_spend}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                {[
                  { id: 'none', label: t.options.ad_none },
                  { id: 'low', label: t.options.ad_low },
                  { id: 'medium', label: t.options.ad_med },
                  { id: 'high', label: t.options.ad_high },
                  { id: 'custom', label: 'Custom' },
                ].map(opt => (
                  <CardOption
                    key={opt.id}
                    label={opt.label}
                    selected={formData.adSpendRange === opt.id}
                    onClick={() => updateField('adSpendRange', opt.id)}
                  />
                ))}
              </div>
              {formData.adSpendRange === 'custom' && (
                <input
                  type="text"
                  className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-md bg-slate-50 animate-fade-in"
                  value={formData.customAdSpend}
                  onChange={(e) => updateField('customAdSpend', e.target.value)}
                  placeholder={t.questions.q_ad_spend_custom}
                />
              )}
            </Question>

            <Question label={t.questions.q_prospecting}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {[
                  { id: 'linkedin', label: 'LinkedIn Sales Nav' },
                  { id: 'maps', label: 'Google Maps' },
                  { id: 'instagram', label: 'Instagram' },
                  { id: 'directories', label: 'Directories' },
                  { id: 'other', label: 'Other' },
                ].map(opt => (
                  <CardOption
                    key={opt.id}
                    label={opt.label}
                    selected={formData.prospectingSources.includes(opt.id)}
                    onClick={() => toggleArrayField('prospectingSources', opt.id)}
                  />
                ))}
              </div>
              {formData.prospectingSources.includes('other') && (
                <input
                  type="text"
                  className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-md bg-slate-50 animate-fade-in"
                  value={formData.customProspectingSource}
                  onChange={(e) => updateField('customProspectingSource', e.target.value)}
                  placeholder={t.questions.q_prospecting_other}
                />
              )}
            </Question>

            <Question
              label={t.questions.q_predictability}
              hint={lang === 'es' ? '¿Sabes cuántos clientes llegarán el próximo mes?' : 'Do you know how many clients will come next month?'}
            >
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'predictable', label: t.options.predictable, icon: TrendingUp },
                  { id: 'random', label: t.options.random, icon: AlertCircle },
                ].map(opt => (
                  <CardOption
                    key={opt.id}
                    label={opt.label}
                    icon={opt.icon}
                    selected={formData.demandPredictability === opt.id}
                    onClick={() => updateField('demandPredictability', opt.id)}
                  />
                ))}
              </div>
            </Question>

            {/* EXPLORE SECONDARY MARKET */}
            {canExploreSecondary && (
              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-200 mt-8 animate-fade-in-up">
                <Question label={t.questions.q_explore_secondary}>
                  <div className="grid grid-cols-2 gap-4">
                    <CardOption
                      label={secondaryLabel}
                      selected={formData.exploreSecondaryMarket === true}
                      icon={GitBranch}
                      onClick={() => updateField('exploreSecondaryMarket', true)}
                    />
                    <CardOption
                      label={t.options.explore_no}
                      selected={formData.exploreSecondaryMarket === false}
                      icon={MousePointer}
                      onClick={() => updateField('exploreSecondaryMarket', false)}
                    />
                  </div>
                </Question>
              </div>
            )}
          </>
        );

      // STAGE 4: OPERATIONS
      case 4: return (
        <>
          <SectionTitle title={t.steps.operations} icon={Activity} />

          <Question label={t.questions.q_team}>
            <div className="flex items-center space-x-6 bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                className="flex-grow h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                value={formData.teamSize}
                onChange={(e) => updateField('teamSize', parseInt(e.target.value))}
              />
              <div className="w-16 h-16 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg shadow-indigo-200">
                {formData.teamSize}
              </div>
            </div>
          </Question>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Question label={t.questions.q_capacity}>
              <div className="flex items-center space-x-6 bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
                <input
                  type="range"
                  min="1"
                  max="200"
                  step="1"
                  className="flex-grow h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  value={formData.capacityPerDay}
                  onChange={(e) => updateField('capacityPerDay', parseInt(e.target.value))}
                />
                <div className="w-16 h-16 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-emerald-200">
                  {formData.capacityPerDay}
                </div>
              </div>
            </Question>
            <Question label={t.questions.q_capacity_channel}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'phone', label: 'Phone', icon: Phone },
                  { id: 'email', label: 'Email', icon: Mail },
                  { id: 'chat', label: 'Chat/WA', icon: MessageCircle },
                  { id: 'meeting', label: 'Zoom/Meet', icon: Users },
                ].map(opt => (
                  <CardOption
                    key={opt.id}
                    label={opt.label}
                    icon={opt.icon}
                    selected={formData.capacityChannel.includes(opt.id)}
                    onClick={() => toggleArrayField('capacityChannel', opt.id)}
                  />
                ))}
              </div>
            </Question>
          </div>

          <Question label={t.questions.q_response_sla}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'instant', label: t.options.sla_instant, icon: Zap },
                { id: 'hour', label: t.options.sla_hour, icon: Clock },
                { id: 'day', label: t.options.sla_day, icon: Calendar },
                { id: 'next_day', label: t.options.sla_next, icon: Repeat },
              ].map(opt => (
                <CardOption
                  key={opt.id}
                  label={opt.label}
                  icon={opt.icon}
                  selected={formData.responseSla === opt.id}
                  onClick={() => updateField('responseSla', opt.id)}
                />
              ))}
            </div>
          </Question>

          <Question label={t.questions.q_automation}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { id: 'crm', label: t.options.auto_crm, icon: Database },
                { id: 'bot', label: t.options.auto_bot, icon: Bot },
                { id: 'email', label: t.options.auto_email, icon: Mail },
                { id: 'zapier', label: t.options.auto_zap, icon: Workflow },
                { id: 'none', label: t.options.auto_none, icon: XCircle },
              ].map(opt => (
                <CardOption
                  key={opt.id}
                  label={opt.label}
                  icon={opt.icon}
                  selected={formData.automationTools.includes(opt.id)}
                  onClick={() => toggleArrayField('automationTools', opt.id)}
                />
              ))}
            </div>
          </Question>

          {/* Support Readiness for Secondary Market */}
          {formData.exploreSecondaryMarket && (
            <Question label={t.questions.q_support_readiness}>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'ready', label: t.options.ready_yes },
                  { id: 'partial', label: t.options.ready_partial },
                  { id: 'none', label: t.options.ready_no },
                ].map(opt => (
                  <CardOption
                    key={opt.id} label={opt.label}
                    selected={formData.supportReadiness === opt.id}
                    onClick={() => updateField('supportReadiness', opt.id)}
                  />
                ))}
              </div>
            </Question>
          )}

          <Question label={t.questions.q_surge}>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'lose', label: t.options.lose, icon: AlertCircle },
                { id: 'bad', label: t.options.bad, icon: Clock },
                { id: 'handle', label: t.options.handle, icon: Check },
              ].map(opt => (
                <CardOption
                  key={opt.id}
                  label={opt.label}
                  icon={opt.icon}
                  selected={formData.surgeHandling === opt.id}
                  onClick={() => updateField('surgeHandling', opt.id)}
                />
              ))}
            </div>
          </Question>
        </>
      );

      // STAGE 5: PAIN
      case 5: return (
        <>
          <SectionTitle title={t.steps.pain} icon={ShieldAlert} />
          <Question label={t.questions.q_pain}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'no_clients', label: t.options.no_clients },
                { id: 'bad_clients', label: t.options.bad_clients },
                { id: 'chaos', label: t.options.chaos },
                { id: 'expensive', label: t.options.expensive },
                { id: 'burnout', label: t.options.burnout },
                { id: 'competition', label: t.options.competition },
                { id: 'other', label: lang === 'es' ? 'Otro' : 'Other' },
              ].map(opt => (
                <CardOption
                  key={opt.id}
                  label={opt.label}
                  selected={formData.primaryPain.includes(opt.id)}
                  onClick={() => toggleArrayField('primaryPain', opt.id)}
                />
              ))}
            </div>
            {formData.primaryPain.includes('other') && (
              <input
                type="text"
                className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-md bg-slate-50 animate-fade-in mt-3"
                value={formData.customPain}
                onChange={(e) => updateField('customPain', e.target.value)}
                placeholder={lang === 'es' ? 'Describí tu dolor principal...' : 'Describe your main pain...'}
              />
            )}
          </Question>
          <Question label={t.questions.q_risk}>
            <textarea
              className="w-full px-5 py-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-lg transition-all"
              rows={3}
              value={formData.businessRiskIfNoChange}
              onChange={(e) => updateField('businessRiskIfNoChange', e.target.value)}
              placeholder="..."
            />
          </Question>
        </>
      );

      // STAGE 6: AMBITION
      case 6: return (
        <>
          <SectionTitle title={t.steps.ambition} icon={Target} />
          <Question label={t.questions.q_goal}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'sales', label: t.options.sales },
                { id: 'margin', label: t.options.margin },
                { id: 'order', label: t.options.order },
                { id: 'scale', label: t.options.scale },
                { id: 'exit', label: t.options.exit },
                { id: 'leader', label: t.options.leader },
              ].map(opt => (
                <CardOption
                  key={opt.id}
                  label={opt.label}
                  selected={formData.growthGoal.includes(opt.id)}
                  onClick={() => toggleArrayField('growthGoal', opt.id)}
                />
              ))}
            </div>
          </Question>
          <Question label={t.questions.q_pace}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'slow', label: t.options.slow, icon: ShieldAlert },
                { id: 'fast', label: t.options.fast, icon: Zap },
              ].map(opt => (
                <CardOption
                  key={opt.id}
                  label={opt.label}
                  icon={opt.icon}
                  selected={formData.growthPace === opt.id}
                  onClick={() => updateField('growthPace', opt.id)}
                />
              ))}
            </div>
          </Question>

          <Question label={lang === 'es' ? '¿Hay algo más que quieras contarnos?' : 'Anything else you want to tell us?'} hint={lang === 'es' ? 'Opcional. Cualquier detalle relevante sobre tu negocio.' : 'Optional. Any relevant detail about your business.'}>
            <textarea
              className="w-full px-5 py-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-md transition-all h-24"
              value={formData.additionalNotes || ''}
              onChange={(e) => updateField('additionalNotes', e.target.value)}
              placeholder={lang === 'es' ? "Ej: Tenemos un local en Palermo, hacemos eventos mensuales, estamos por lanzar un producto nuevo..." : "e.g. We have a physical store in NYC, we run monthly events, we're launching a new product..."}
            />
          </Question>
        </>
      );

      default: return null;
    }
  };

  const isCurrentStepValid = () => {
    const d = formData;
    switch (currentStep) {
      case 0:
        return d.businessName && d.locationScope && d.targetRegion && d.businessType.length > 0 && d.distributionModel && (d.businessType.indexOf('other') === -1 || d.customBusinessType);
      // STAGE 1: PRODUCT INTELLIGENCE
      case 1:
        const showB2B = d.distributionModel === 'b2b' || d.distributionModel === 'both';
        const showB2C = d.distributionModel === 'b2c' || d.distributionModel === 'both';

        let b2bValid = true;
        let b2cValid = true;

        if (showB2B) {
          b2bValid = !!(d.b2bUseCase?.length && d.b2bBuyerRole?.length && d.b2bProblemSolved?.length && d.b2bPurchaseDrivers?.length) &&
            (!d.b2bProblemSolved?.includes('other') || !!d.customB2bProblem) &&
            (d.b2bPurchaseDrivers.indexOf('other') === -1 || !!d.customB2bDriver);
        }
        if (showB2C) {
          b2cValid = !!(d.b2cPurchaseContext?.length && d.b2cProblemSolved?.length && d.b2cPurchaseDrivers?.length && d.b2cNaturalChannel?.length) &&
            (!d.b2cProblemSolved?.includes('other') || !!d.customB2cProblem) &&
            (d.b2cPurchaseDrivers.indexOf('other') === -1 || !!d.customB2cDriver);
        }

        // Removed marketPositioning and priceRelativity from here as they moved to Step 2
        return d.productName !== '' && d.painOfInaction !== '' && d.usageFrequency.length > 0 && b2bValid && b2cValid;

      case 2:
        // Added marketPositioning and priceRelativity validation here
        return d.targetCustomer.length > 0 &&
          d.paymentModel.length > 0 &&
          d.productPrice !== '' &&
          d.purchaseVolume !== '' &&
          d.customerValue.length > 0 &&
          d.salesCycle.length > 0 &&
          d.marketPositioning !== '' &&
          d.priceRelativity !== '';
      case 3:
        const salesChanValid = d.salesChannels.length > 0;
        const acqChanValid = d.acquisitionChannels.length > 0 && (d.acquisitionChannels.indexOf('Other') === -1 || d.customAcquisitionChannel);
        const adSpendValid = d.adSpendRange && (d.adSpendRange !== 'custom' || d.customAdSpend);

        return salesChanValid && acqChanValid && adSpendValid && d.demandPredictability;
      case 4:
        // If exploring secondary, readiness is required
        const readinessValid = !d.exploreSecondaryMarket || d.supportReadiness;
        return d.teamSize > 0 && d.capacityChannel.length > 0 && d.surgeHandling && d.responseSla && d.automationTools.length > 0 && readinessValid;
      case 5:
        return d.primaryPain.length > 0;
      case 6:
        return d.growthGoal.length > 0 && d.growthPace;
      default: return true;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 relative">
      {/* Progress Bar */}
      <div className="mb-10 px-2">
        <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          <span>Step {currentStep + 1} of {TOTAL_STEPS}</span>
          <span>{Math.round(((currentStep + 1) / TOTAL_STEPS) * 100)}%</span>
        </div>
        <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out shadow-lg"
            style={{ width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-2xl shadow-indigo-100 border border-white/50 overflow-hidden min-h-[600px] flex flex-col relative z-10">
        <div className="p-8 md:p-12 flex-grow overflow-y-auto custom-scrollbar">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="p-8 bg-white/50 border-t border-indigo-50 flex justify-between items-center backdrop-blur">
          <button
            onClick={back}
            disabled={currentStep === 0}
            className={`flex items-center px-6 py-3 rounded-xl font-bold text-sm transition ${currentStep === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
          >
            <ArrowLeft size={18} className="mr-2" />
            {t.back}
          </button>

          {/* Dev Skip Button */}
          <button
            onClick={() => {
              if (currentStep < TOTAL_STEPS - 1) {
                const nextStep = currentStep + 1;
                setCurrentStep(nextStep);
                if (onStepChange) onStepChange(nextStep, formData);
              }
              else onComplete(formData);
            }}
            className="absolute left-1/2 transform -translate-x-1/2 text-xs text-slate-300 hover:text-indigo-400 font-mono border border-slate-200 px-2 py-1 rounded bg-slate-50"
            title="Development only: Skip validation"
          >
            [SKIP / OMITIR]
          </button>

          <button
            onClick={next}
            disabled={!isCurrentStepValid()}
            className={`flex items-center px-10 py-4 rounded-2xl font-bold text-lg shadow-xl transition-all transform hover:-translate-y-1 ${isCurrentStepValid()
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-indigo-500/30'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
          >
            {currentStep === TOTAL_STEPS - 1 ? t.finish : t.next}
            <ArrowRight size={22} className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};