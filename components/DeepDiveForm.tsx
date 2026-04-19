import React, { useState, useEffect } from 'react';
import {
    ArrowRight, ArrowLeft, Loader2, Sparkles, Upload, Target, CheckCircle, Wand2,
    DollarSign, Package, Zap, Shield, Award, Layers, Repeat, Lightbulb, TrendingUp,
    Rocket, ShoppingBag, Globe, MessageSquare, Phone, Store, BarChart3, Clock,
    Gem, Palette, Wrench, Star, Box, Monitor, Truck, Briefcase, X, HelpCircle
} from 'lucide-react';
import { DeepDiveInput, StrategicAnalysis, Language } from '../types';
import { preAnalyzeProduct, ProductPreAnalysis } from '../services/geminiDeepDiveService';

interface DeepDiveFormProps {
    lang: Language;
    onComplete: (data: DeepDiveInput) => void;
    onCancel: () => void;
    parentAnalysis?: StrategicAnalysis | null;
    parentOnboarding?: Record<string, any> | null;
    parentBusinessName?: string;
    initialData?: DeepDiveInput;
}

type WizardStep =
    | 'ingestion'
    | 'analyzing'
    | 'scope'
    | 'salesModel'
    | 'validation'
    | 'differentiator'
    | 'delivery'
    | 'priceRange'
    | 'repurchase'
    | 'productStage'
    | 'audience'
    | 'platforms'
    | 'volume'
    | 'objection'
    | 'customer'
    | 'uniqueAngle'
    | 'margin';

// Total steps for the progress bar (excluding ingestion/analyzing)
const TOTAL_STEPS = 16;

function getStepNumber(step: WizardStep): number {
    const map: Record<WizardStep, number> = {
        ingestion: 0, analyzing: 0,
        scope: 1,
        salesModel: 2,
        validation: 3,
        differentiator: 4,
        delivery: 5,
        priceRange: 6,
        repurchase: 7,
        productStage: 8,
        audience: 9,
        platforms: 10,
        volume: 11,
        objection: 12,
        customer: 13,
        uniqueAngle: 14,
        margin: 15,
    };
    return map[step] || 0;
}

interface QuestionProps {
    label: string;
    hint?: string;
    optional?: boolean;
    children: React.ReactNode;
}

const Question: React.FC<QuestionProps> = ({ label, hint, optional, children }) => (
    <div className="space-y-2">
        <label className="block text-sm font-bold text-slate-700">
            {label}
            {optional && <span className="text-slate-400 font-normal ml-2">(opcional)</span>}
        </label>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
        {children}
    </div>
);

export default function DeepDiveForm({ lang, onComplete, onCancel, parentAnalysis, parentOnboarding, parentBusinessName, initialData }: DeepDiveFormProps) {
    const [step, setStep] = useState<WizardStep>('ingestion');

    // Ingestion states
    const [ingestionText, setIngestionText] = useState('');
    const [ingestionUrl, setIngestionUrl] = useState('');
    const [ingestionImages, setIngestionImages] = useState<string[]>([]);
    const [preAnalysisError, setPreAnalysisError] = useState<string | null>(null);

    // Form data
    const [formData, setFormData] = useState<DeepDiveInput>(initialData || {
        productName: '',
        productDescription: '',
        productUrl: '',
        productImages: [],
        unitPrice: '',
        unitCost: '',
        specificPainSolved: '',
        currentCustomerProfile: '',
        desiredCustomerProfile: '',
        mainObjection: '',
        directCompetitors: ['', '', '', '', ''],
        targetAudience: [],
        salesPlatforms: [],
        expectedVolume: '',
        differentiator: '',
        deliveryModel: '',
        priceRange: '',
        repurchaseFrequency: [],
        productStage: '',
        currentMargin: '',
        unitCostRaw: '',
        uniqueAngle: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pre-populate competitors from parent analysis
    useEffect(() => {
        if (parentAnalysis?.competitors && formData.directCompetitors.every(c => !c.trim())) {
            const parentComps = parentAnalysis.competitors.slice(0, 5).map(c => c.name);
            setFormData(prev => ({
                ...prev,
                directCompetitors: [
                    parentComps[0] || prev.directCompetitors[0] || '',
                    parentComps[1] || prev.directCompetitors[1] || '',
                    parentComps[2] || prev.directCompetitors[2] || '',
                    parentComps[3] || prev.directCompetitors[3] || '',
                    parentComps[4] || prev.directCompetitors[4] || ''
                ]
            }));
        }
    }, [parentAnalysis]);

    // Helpers
    const handleCompetitorChange = (index: number, value: string) => {
        const newCompetitors = [...formData.directCompetitors];
        newCompetitors[index] = value;
        setFormData({ ...formData, directCompetitors: newCompetitors });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []) as File[];
        if (files.length === 0) return;

        const newImages: string[] = [];
        let loadedCount = 0;

        files.forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                alert(lang === 'es' ? 'Cada imagen debe pesar menos de 5MB.' : 'Each image must be under 5MB.');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                newImages.push(base64String);
                loadedCount++;
                if (loadedCount === files.length) {
                    setIngestionImages(prev => [...prev, ...newImages]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setIngestionImages(prev => prev.filter((_, i) => i !== index));
    };

    // --- STEP LOGIC ---
    const runPreAnalysis = async () => {
        if (!ingestionText.trim() && !ingestionUrl.trim() && ingestionImages.length === 0) {
            setPreAnalysisError(lang === 'es' ? 'Proporcioná al menos un texto, una URL o una imagen.' : 'Provide at least text, a URL, or an image.');
            return;
        }

        setStep('analyzing');
        setPreAnalysisError(null);

        try {
            let textContext = ingestionText;
            if (ingestionUrl) {
                try {
                    const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(ingestionUrl)}`);
                    if (response.ok) {
                        const html = await response.text();
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        const text = doc.body.textContent || '';
                        textContext += '\n\nContenido extraído de la URL:\n' + text.substring(0, 15000);
                    }
                } catch (e) {
                    console.warn("Failed to proxy URL", e);
                    textContext += '\n\nURL: ' + ingestionUrl;
                }
            }

            const result = await preAnalyzeProduct(textContext, ingestionImages, lang);

            setFormData(prev => ({
                ...prev,
                productName: result.productName || '',
                productDescription: result.productDescription || '',
                unitPrice: result.unitPrice || '',
                specificPainSolved: result.specificPainSolved || '',
                currentCustomerProfile: result.currentCustomerProfile || '',
                directCompetitors: [
                    result.directCompetitors[0] || prev.directCompetitors[0] || '',
                    result.directCompetitors[1] || prev.directCompetitors[1] || '',
                    result.directCompetitors[2] || prev.directCompetitors[2] || '',
                    prev.directCompetitors[3] || '',
                    prev.directCompetitors[4] || ''
                ],
                productUrl: ingestionUrl,
                productImages: ingestionImages
            }));

            setStep('scope');
        } catch (err: any) {
            console.error(err);
            setPreAnalysisError(lang === 'es' ? 'Error al analizar. Podés avanzar manualmente.' : 'Error analyzing. You can proceed manually.');
            setFormData(prev => ({ ...prev, productUrl: ingestionUrl, productImages: ingestionImages }));
            setStep('scope');
        }
    };

    const isValidationOk = () => {
        const validComps = formData.directCompetitors.filter(c => c.trim() !== '');
        return formData.productName.trim() &&
            formData.productDescription.trim() &&
            formData.unitPrice.trim() &&
            formData.specificPainSolved.trim() &&
            formData.currentCustomerProfile.trim() &&
            validComps.length > 0;
    };

    const finishOnboarding = () => {
        setIsSubmitting(true);

        // Compute margin from cost + price fields
        const costNum = parseFloat((formData.unitCostRaw || '').replace(/[^0-9.]/g, ''));
        const priceNum = parseFloat((formData.unitPrice || '').replace(/[^0-9.]/g, ''));
        let computedMargin = formData.currentMargin || '';
        if (!isNaN(costNum) && !isNaN(priceNum) && priceNum > 0) {
            computedMargin = `${Math.round(((priceNum - costNum) / priceNum) * 100)}%`;
        }

        const cleanData = {
            ...formData,
            currentMargin: computedMargin,
            directCompetitors: formData.directCompetitors.filter(c => c.trim() !== '')
        };
        onComplete(cleanData);
    };

    // --- PROGRESS BAR ---
    const renderProgressBar = () => {
        const currentStep = getStepNumber(step);
        if (currentStep === 0) return null;
        const progress = (currentStep / TOTAL_STEPS) * 100;

        return (
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-violet-600 uppercase tracking-widest">
                        {lang === 'es' ? `Paso ${currentStep} de ${TOTAL_STEPS}` : `Step ${currentStep} of ${TOTAL_STEPS}`}
                    </span>
                    <span className="text-xs font-bold text-slate-400">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        );
    };

    // --- RENDERERS ---

    const renderIngestion = () => (
        <div className="animate-fade-in max-w-3xl mx-auto">
            {/* Context badge */}
            {parentBusinessName && (
                <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-violet-50 border border-violet-200 rounded-xl">
                    <Briefcase size={16} className="text-violet-500" />
                    <span className="text-sm font-bold text-violet-700">
                        Deep Dive para: <span className="text-violet-900">{parentBusinessName}</span>
                    </span>
                </div>
            )}

            <div className="mb-8">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3 leading-tight">
                    {lang === 'es' ? '¿Qué producto o servicio querés analizar?' : 'Which product or service do you want to analyze?'}
                </h2>
                <p className="text-lg text-slate-500 leading-relaxed">
                    {lang === 'es'
                        ? 'Danos info: pegá una URL, subí fotos, o contanos con palabras. La IA va a extraer todo automáticamente.'
                        : 'Give us info: paste a URL, upload photos, or describe it. AI will extract everything automatically.'}
                </p>
            </div>

            {preAnalysisError && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl mb-6 font-medium text-sm">
                    {preAnalysisError}
                </div>
            )}

            <div className="space-y-6">
                {/* URL Input */}
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">
                        <Globe size={14} className="inline mr-1.5 text-violet-500" />
                        {lang === 'es' ? 'URL del producto' : 'Product URL'}
                    </label>
                    <input
                        type="url"
                        className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none text-lg transition-all"
                        placeholder="https://tutienda.com/producto"
                        value={ingestionUrl}
                        onChange={(e) => setIngestionUrl(e.target.value)}
                    />
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">
                        <Upload size={14} className="inline mr-1.5 text-violet-500" />
                        {lang === 'es' ? 'Fotos del producto' : 'Product photos'}
                        <span className="text-slate-400 font-normal ml-2">(opcional)</span>
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {ingestionImages.map((img, i) => (
                            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-violet-200 group">
                                <img src={img} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
                                <button
                                    onClick={() => removeImage(i)}
                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                >
                                    <X size={16} className="text-white" />
                                </button>
                            </div>
                        ))}
                        <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-violet-400 flex items-center justify-center cursor-pointer transition-colors bg-slate-50 hover:bg-violet-50">
                            <Upload size={20} className="text-slate-400" />
                            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                        </label>
                    </div>
                </div>

                {/* Text Area */}
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">
                        <MessageSquare size={14} className="inline mr-1.5 text-violet-500" />
                        {lang === 'es' ? 'Descripción adicional' : 'Additional description'}
                        <span className="text-slate-400 font-normal ml-2">(opcional)</span>
                    </label>
                    <textarea
                        className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none text-lg transition-all h-32 resize-none"
                        placeholder={lang === 'es' ? 'Contanos de qué se trata, qué incluye, cómo se entrega...' : 'Tell us what it is, what it includes, how it is delivered...'}
                        value={ingestionText}
                        onChange={(e) => setIngestionText(e.target.value)}
                    />
                </div>
            </div>

            <div className="mt-10 flex items-center justify-between">
                <button onClick={onCancel} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 flex items-center gap-2 transition">
                    <ArrowLeft size={18} /> {lang === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setStep('scope')}
                        className="px-6 py-3 rounded-xl font-bold text-violet-600 hover:bg-violet-50 transition text-sm"
                    >
                        {lang === 'es' ? 'Omitir y describir manualmente' : 'Skip and describe manually'}
                    </button>
                    <button
                        onClick={runPreAnalysis}
                        className="px-8 py-4 rounded-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white flex items-center gap-3 shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all text-lg"
                    >
                        <Wand2 size={22} />
                        {lang === 'es' ? 'Analizar con IA' : 'Analyze with AI'}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderAnalyzing = () => (
        <div className="animate-fade-in flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
            <div className="w-28 h-28 relative mb-8">
                <div className="absolute inset-0 border-4 border-violet-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-violet-600 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-2 border-4 border-fuchsia-300 rounded-full border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                <Sparkles className="absolute inset-0 m-auto text-violet-600" size={36} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">
                {lang === 'es' ? 'Extrayendo ADN del producto...' : 'Extracting product DNA...'}
            </h3>
            <p className="text-slate-500 text-lg">
                {lang === 'es'
                    ? 'La IA está escaneando, leyendo y deduciendo el perfil de tu producto.'
                    : 'AI is scanning, reading, and deducing your product profile.'}
            </p>
        </div>
    );

    const renderValidation = () => (
        <div className="animate-fade-in max-w-3xl mx-auto">
            {renderProgressBar()}

            <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-900 mb-2">
                    {lang === 'es' ? 'Esto es lo que entendió la IA' : 'AI Analysis Results'}
                </h2>
                <p className="text-lg text-slate-500">
                    {lang === 'es'
                        ? 'Revisá y corregí cualquier dato. Esto es la base de tu estrategia táctica.'
                        : 'Review and correct any data. This is the foundation of your tactical strategy.'}
                </p>
            </div>

            <div className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                <Question label={lang === 'es' ? 'Nombre del Producto o Servicio' : 'Product / Service Name'}>
                    <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none font-bold text-slate-900 text-lg"
                        value={formData.productName} onChange={(e) => setFormData({ ...formData, productName: e.target.value })} />
                </Question>

                <Question label={lang === 'es' ? 'Descripción — ¿Qué es, qué incluye y cómo se entrega?' : 'Description — What is it and how is it delivered?'} hint={lang === 'es' ? "Editá si la IA se equivocó o faltan detalles." : "Edit if AI got it wrong or details are missing."}>
                    <textarea className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none h-24 text-slate-700"
                        value={formData.productDescription} onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })} />
                </Question>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Question label={lang === 'es' ? 'Precio (por unidad, sesión o paquete)' : 'Price (per unit, session, or package)'}>
                        <textarea className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none font-bold text-slate-900 h-16 resize-none"
                            placeholder={lang === 'es' ? 'Ej: $5.000 ARS / $50 USD / Desde $200' : 'E.g: $50 USD / From $200'}
                            value={formData.unitPrice} onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })} />
                    </Question>
                    <Question label={lang === 'es' ? '¿Por qué lo eligen? (Dolor que resuelve)' : 'Why Do They Choose It? (Pain Solved)'}>
                        <textarea className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none text-slate-700 h-16 resize-none"
                            placeholder={lang === 'es' ? 'Ej: No encuentran calidad a ese precio, necesitan resolver X rápido...' : 'E.g: They can\'t find quality at that price...'}
                            value={formData.specificPainSolved} onChange={(e) => setFormData({ ...formData, specificPainSolved: e.target.value })} />
                    </Question>
                </div>

                <Question label={lang === 'es' ? '¿Quién te compra hoy?' : 'Current Customer Profile'}>
                    <textarea className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none h-20 text-slate-700"
                        value={formData.currentCustomerProfile} onChange={(e) => setFormData({ ...formData, currentCustomerProfile: e.target.value })} />
                </Question>

                <Question label={lang === 'es' ? 'Competidores Directos (negocios que ofrecen lo mismo)' : 'Direct Competitors (businesses offering the same)'} hint={lang === 'es' ? 'Poné negocios que compiten con vos, no marcas. Ej: otra tienda, otro coach, otra consultora, otro e-commerce.' : 'Put businesses competing with you, not brands. E.g.: another store, coach, consultancy.'}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[0, 1, 2, 3, 4].map(index => (
                            <input key={index} type="text" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none"
                                placeholder={`${lang === 'es' ? 'Competidor' : 'Competitor'} #${index + 1}`} value={formData.directCompetitors[index] || ''} onChange={(e) => handleCompetitorChange(index, e.target.value)} />
                        ))}
                    </div>
                </Question>
            </div>

            <div className="mt-8 flex justify-between">
                <button onClick={() => setStep('salesModel')} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 flex items-center gap-2">
                    <ArrowLeft size={18} /> {lang === 'es' ? 'Atrás' : 'Back'}
                </button>
                <button onClick={() => setStep('differentiator')} disabled={!isValidationOk()} className="px-8 py-4 rounded-xl font-bold bg-slate-900 text-white flex items-center gap-2 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md">
                    {lang === 'es' ? 'Datos correctos. Siguiente' : 'Data correct. Next'} <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );

    // --- MULTI-CHOICE CARD RENDERER ---
    const renderCardChoice = (
        title: string,
        description: string,
        options: { id: string; label: string; icon: React.ReactNode; hint?: string }[],
        selectedValue: string | string[],
        onSelect: (val: string) => void,
        multiSelect: boolean,
        backStep: WizardStep,
        nextStep: WizardStep | 'finish'
    ) => {
        const isValid = multiSelect
            ? (selectedValue as string[]).length > 0
            : (selectedValue as string).trim() !== '';

        return (
            <div className="animate-fade-in max-w-2xl mx-auto">
                {renderProgressBar()}
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3 leading-tight">{title}</h2>
                <p className="text-lg text-slate-500 mb-8 border-l-4 border-violet-300 pl-4">{description}</p>

                <div className={`grid gap-3 ${options.length > 4 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                    {options.map((opt) => {
                        const isSelected = multiSelect
                            ? (selectedValue as string[]).includes(opt.id)
                            : selectedValue === opt.id;

                        return (
                            <button
                                key={opt.id}
                                onClick={() => onSelect(opt.id)}
                                className={`flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all ${isSelected
                                    ? 'border-violet-600 bg-violet-50 shadow-md ring-2 ring-violet-600/20'
                                    : 'border-slate-200 bg-white hover:border-violet-300 hover:bg-slate-50'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition ${isSelected ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {opt.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className={`font-bold text-lg block ${isSelected ? 'text-violet-900' : 'text-slate-700'}`}>
                                        {opt.label}
                                    </span>
                                    {opt.hint && <span className="text-xs text-slate-400 block mt-0.5">{opt.hint}</span>}
                                </div>
                                {isSelected && <CheckCircle size={22} className="text-violet-600 flex-shrink-0" />}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-8">
                    <button onClick={() => setStep(backStep)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 flex items-center gap-2">
                        <ArrowLeft size={18} /> {lang === 'es' ? 'Atrás' : 'Back'}
                    </button>
                    <button
                        onClick={() => nextStep === 'finish' ? finishOnboarding() : setStep(nextStep)}
                        disabled={!isValid}
                        className={`px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all ${!isValid ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg hover:-translate-y-1 hover:shadow-xl'}`}
                    >
                        {lang === 'es' ? 'Siguiente' : 'Next'} <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        );
    };

    // --- TEXT QUESTION RENDERER ---
    const renderTextQuestion = (
        question: string,
        hint: string,
        value: string,
        onChange: (val: string) => void,
        backStep: WizardStep,
        nextStep: WizardStep | 'finish',
        isValid: boolean,
        optional: boolean = false,
        placeholder?: string
    ) => (
        <div className="animate-fade-in max-w-2xl mx-auto">
            {renderProgressBar()}
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-6 leading-tight">{question}</h2>
            <p className="text-xl text-slate-500 mb-10 leading-relaxed border-l-4 border-violet-300 pl-4">{hint}</p>

            <textarea
                className="w-full px-6 py-5 rounded-2xl border-2 border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none text-xl transition-all h-40 shadow-sm resize-none"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder || (lang === 'es' ? 'Escribí acá...' : 'Write here...')}
                autoFocus
            />

            <div className="mt-12 flex items-center justify-between border-t border-slate-100 pt-8">
                <button onClick={() => setStep(backStep)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 flex items-center gap-2">
                    <ArrowLeft size={18} /> {lang === 'es' ? 'Atrás' : 'Back'}
                </button>
                <button
                    onClick={() => nextStep === 'finish' ? finishOnboarding() : setStep(nextStep)}
                    disabled={!isValid && !optional}
                    className={`px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all ${(!isValid && !optional) || isSubmitting ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg hover:-translate-y-1 hover:shadow-xl'}`}
                >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> :
                        (nextStep === 'finish'
                            ? <><Rocket size={20} /> {lang === 'es' ? 'Generar Deep Dive' : 'Generate Deep Dive'}</>
                            : <>{lang === 'es' ? 'Siguiente' : 'Next'} <ArrowRight size={20} /></>
                        )
                    }
                </button>
            </div>
        </div>
    );

    // --- MAIN RENDER ---
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-6 sm:p-12 overflow-hidden relative">
                {/* Decorative element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                {step === 'ingestion' && renderIngestion()}
                {step === 'analyzing' && renderAnalyzing()}

                {step === 'scope' && renderCardChoice(
                    lang === 'es' ? '¿Qué vas a analizar?' : 'What are you analyzing?',
                    lang === 'es' ? 'No es lo mismo analizar un producto específico que una línea completa, o un servicio puntual que una oferta más amplia.' : 'Analyzing one specific offering is different from a full line. This shapes the analysis depth.',
                    [
                        { id: 'specific_product', label: lang === 'es' ? 'Un producto o servicio específico' : 'A specific product or service', icon: <Target size={24} />, hint: lang === 'es' ? 'Ej: Perfume CK One 100ml, Clase de tenis 1h, Asesoría legal' : 'E.g: CK One 100ml, 1h Tennis Class, Legal Consultation' },
                        { id: 'product_family', label: lang === 'es' ? 'Una familia o línea' : 'A product/service line', icon: <Layers size={24} />, hint: lang === 'es' ? 'Ej: Todos los perfumes importados, Clases deportivas, Pack de asesorías' : 'E.g: All imported perfumes, Sports classes, Advisory packages' },
                    ],
                    formData.analysisScope || '',
                    (val) => setFormData({ ...formData, analysisScope: val as any }),
                    false,
                    'ingestion',
                    'salesModel'
                )}

                {step === 'salesModel' && renderCardChoice(
                    lang === 'es' ? '¿Cómo vas a ofrecer esto?' : 'How will you offer this?',
                    lang === 'es' ? 'Esto cambia radicalmente las personas, los canales y toda la estrategia de ventas.' : 'This radically changes the personas, channels, and the entire sales strategy.',
                    [
                        { id: 'minorista', label: lang === 'es' ? 'Minorista (venta al público)' : 'Retail (direct to consumer)', icon: <ShoppingBag size={24} />, hint: lang === 'es' ? 'Vendo por unidad al consumidor final' : 'Sell by unit to end consumer' },
                        { id: 'mayorista', label: lang === 'es' ? 'Mayorista (venta a negocios)' : 'Wholesale (to businesses)', icon: <Truck size={24} />, hint: lang === 'es' ? 'Vendo en cantidad a revendedores o empresas' : 'Sell in bulk to resellers or businesses' },
                        { id: 'ambos', label: lang === 'es' ? 'Ambos canales' : 'Both channels', icon: <Store size={24} />, hint: lang === 'es' ? 'Vendo tanto al por mayor como al por menor' : 'Sell both wholesale and retail' },
                        { id: 'nuevos_mercados', label: lang === 'es' ? 'Quiero explorar nuevos mercados' : 'I want to explore new markets', icon: <Globe size={24} />, hint: lang === 'es' ? 'No sé cuál es mejor o quiero expandirme' : 'I don\'t know which is best or want to expand' },
                    ],
                    formData.salesModel || '',
                    (val) => setFormData({ ...formData, salesModel: val }),
                    false,
                    'scope',
                    'validation'
                )}

                {step === 'validation' && renderValidation()}

                {step === 'differentiator' && renderCardChoice(
                    lang === 'es' ? '¿Cuál es el diferencial N°1?' : "What is the #1 differentiator?",
                    lang === 'es' ? 'Elegí UNA cosa. La razón principal por la que alguien te elige sobre la competencia.' : 'Choose ONE thing. The main reason someone picks you over competitors.',
                    [
                        { id: 'Precio', label: lang === 'es' ? 'Precio' : 'Price', icon: <DollarSign size={24} />, hint: lang === 'es' ? 'Somos los más accesibles' : 'Most affordable' },
                        { id: 'Calidad', label: lang === 'es' ? 'Calidad Superior' : 'Superior Quality', icon: <Award size={24} />, hint: lang === 'es' ? 'La mejor calidad del mercado' : 'Best in market' },
                        { id: 'Diseño', label: lang === 'es' ? 'Diseño / Estética' : 'Design / Aesthetics', icon: <Palette size={24} />, hint: lang === 'es' ? 'Se destaca visualmente' : 'Visually stands out' },
                        { id: 'Servicio', label: lang === 'es' ? 'Servicio / Atención' : 'Service / Support', icon: <Wrench size={24} />, hint: lang === 'es' ? 'Atención personalizada' : 'Personalized attention' },
                        { id: 'Innovación', label: lang === 'es' ? 'Innovación / Tecnología' : 'Innovation / Tech', icon: <Lightbulb size={24} />, hint: lang === 'es' ? 'Algo que nadie más hace' : 'Something nobody else does' },
                        { id: 'Exclusividad', label: lang === 'es' ? 'Exclusividad / Escasez' : 'Exclusivity / Scarcity', icon: <Gem size={24} />, hint: lang === 'es' ? 'Edición limitada o premium' : 'Limited edition or premium' },
                        { id: 'No sé', label: lang === 'es' ? 'No estoy seguro / No sé' : 'I\'m not sure', icon: <HelpCircle size={24} />, hint: lang === 'es' ? 'La IA te va a ayudar a descubrirlo' : 'AI will help you figure it out' },
                    ],
                    formData.differentiator || '',
                    (val) => setFormData({ ...formData, differentiator: val }),
                    false,
                    'validation',
                    'delivery'
                )}

                {step === 'delivery' && renderCardChoice(
                    lang === 'es' ? '¿Cómo se entrega?' : 'How is it delivered?',
                    lang === 'es' ? 'Esto define la logística y el tipo de estrategia.' : 'This defines logistics and sales strategy type.',
                    [
                        { id: 'Digital', label: lang === 'es' ? 'Digital / Online' : 'Digital / Online', icon: <Monitor size={24} />, hint: lang === 'es' ? 'Software, contenido, SaaS, curso' : 'Software, content, SaaS, course' },
                        { id: 'Físico', label: lang === 'es' ? 'Producto Físico' : 'Physical Product', icon: <Package size={24} />, hint: lang === 'es' ? 'Se empaca y envía' : 'Gets packed and shipped' },
                        { id: 'Servicio', label: lang === 'es' ? 'Servicio / Consultoría' : 'Service / Consulting', icon: <Briefcase size={24} />, hint: lang === 'es' ? 'Se presta personalmente' : 'Delivered personally' },
                        { id: 'Combo', label: lang === 'es' ? 'Combo (Físico + Digital/Servicio)' : 'Combo (Physical + Digital)', icon: <Layers size={24} />, hint: lang === 'es' ? 'Incluye partes físicas y digitales' : 'Includes physical and digital parts' },
                    ],
                    formData.deliveryModel || '',
                    (val) => setFormData({ ...formData, deliveryModel: val }),
                    false,
                    'differentiator',
                    'priceRange'
                )}

                {step === 'priceRange' && renderCardChoice(
                    lang === 'es' ? '¿En qué rango de precio está?' : 'What price range is it in?',
                    lang === 'es' ? 'El ticket promedio define el tipo de venta: impulso vs. consultiva.' : 'Average ticket defines sales type: impulse vs. consultative.',
                    [
                        { id: '<$10', label: lang === 'es' ? 'Menos de $10 USD' : 'Under $10 USD', icon: <DollarSign size={24} />, hint: lang === 'es' ? 'Compra por impulso' : 'Impulse buy' },
                        { id: '$10-50', label: '$10 - $50 USD', icon: <ShoppingBag size={24} />, hint: lang === 'es' ? 'Decisión rápida' : 'Quick decision' },
                        { id: '$50-200', label: '$50 - $200 USD', icon: <Box size={24} />, hint: lang === 'es' ? 'Necesita algo de consideración' : 'Needs some consideration' },
                        { id: '$200-1000', label: '$200 - $1000 USD', icon: <Target size={24} />, hint: lang === 'es' ? 'Compra considerada' : 'Considered purchase' },
                        { id: '>$1000', label: lang === 'es' ? 'Más de $1000 USD' : 'Over $1000 USD', icon: <Gem size={24} />, hint: lang === 'es' ? 'Venta consultiva / high ticket' : 'Consultative / high ticket' },
                    ],
                    formData.priceRange || '',
                    (val) => setFormData({ ...formData, priceRange: val }),
                    false,
                    'delivery',
                    'repurchase'
                )}

                {step === 'repurchase' && renderCardChoice(
                    lang === 'es' ? '¿Con qué frecuencia vuelven a contratarte o comprarte?' : 'How often do they repurchase or rebook?',
                    lang === 'es' ? 'Podés elegir más de una — es normal tener distintos tipos de clientes con distinta frecuencia.' : 'You can select multiple — it\'s normal to have different customer types.',
                    [
                        { id: 'Única', label: lang === 'es' ? 'Compra / Contratación Única' : 'One-Time', icon: <Target size={24} />, hint: lang === 'es' ? 'No vuelven' : 'No repeat' },
                        { id: 'Consumible', label: lang === 'es' ? 'Recurrente / Consumible' : 'Recurring / Consumable', icon: <Repeat size={24} />, hint: lang === 'es' ? 'Se gasta, se usa o se necesita de nuevo' : 'Gets used up or needed again' },
                        { id: 'Mensual', label: lang === 'es' ? 'Suscripción Mensual' : 'Monthly Subscription', icon: <Clock size={24} />, hint: lang === 'es' ? 'Cobro recurrente' : 'Recurring billing' },
                        { id: 'Trimestral', label: lang === 'es' ? 'Cada 2-3 meses' : 'Every 2-3 months', icon: <BarChart3 size={24} />, hint: lang === 'es' ? 'Recompra periódica' : 'Periodic repurchase' },
                        { id: 'Anual', label: lang === 'es' ? 'Anual / Esporádica' : 'Annual / Sporadic', icon: <Star size={24} />, hint: lang === 'es' ? 'Una vez al año o menos' : 'Once a year or less' },
                    ],
                    formData.repurchaseFrequency || [],
                    (val) => {
                        const current = formData.repurchaseFrequency || [];
                        const updated = current.includes(val) ? current.filter(r => r !== val) : [...current, val];
                        setFormData({ ...formData, repurchaseFrequency: updated });
                    },
                    true,
                    'priceRange',
                    'productStage'
                )}

                {step === 'productStage' && renderCardChoice(
                    lang === 'es' ? '¿En qué etapa está?' : 'What stage is it in?',
                    lang === 'es' ? 'Adaptamos la estrategia a tu realidad actual.' : 'We adapt the strategy to your current reality.',
                    [
                        { id: 'Idea', label: lang === 'es' ? 'Idea / Concepto' : 'Idea / Concept', icon: <Lightbulb size={24} />, hint: lang === 'es' ? 'Todavía no se vende' : 'Not selling yet' },
                        { id: 'MVP', label: 'MVP / Primeras Ventas', icon: <Rocket size={24} />, hint: lang === 'es' ? 'Algunas ventas pero sin tracción' : 'Some sales but no traction' },
                        { id: 'En Ventas', label: lang === 'es' ? 'En Ventas (Validado)' : 'Selling (Validated)', icon: <TrendingUp size={24} />, hint: lang === 'es' ? 'Ventas consistentes' : 'Consistent sales' },
                        { id: 'Escala', label: lang === 'es' ? 'Escalando / Creciendo' : 'Scaling / Growing', icon: <Zap size={24} />, hint: lang === 'es' ? 'Buscando más volumen o mercados' : 'Looking for more volume or markets' },
                    ],
                    formData.productStage || '',
                    (val) => setFormData({ ...formData, productStage: val }),
                    false,
                    'repurchase',
                    'audience'
                )}

                {step === 'audience' && renderCardChoice(
                    lang === 'es' ? '¿A quién le vendés o prestás este servicio?' : 'Who do you sell to or serve?',
                    lang === 'es' ? 'Podés elegir más de una. Por ejemplo: mayoristas Y consumidor final.' : 'You can select multiple. E.g.: wholesale AND direct consumer.',
                    [
                        { id: 'B2C', label: 'B2C (Consumidor Final)', icon: <ShoppingBag size={24} />, hint: lang === 'es' ? 'Le vendés directo a personas' : 'You sell directly to people' },
                        { id: 'B2B', label: 'B2B (Otras Empresas)', icon: <Briefcase size={24} />, hint: lang === 'es' ? 'Le vendés a negocios' : 'You sell to businesses' },
                        { id: 'B2B2C', label: 'B2B2C (Canal Híbrido)', icon: <Layers size={24} />, hint: lang === 'es' ? 'A empresas que llegan al consumidor' : 'To businesses that reach consumers' },
                        { id: 'D2C', label: 'D2C (Directo, sin intermediarios)', icon: <Truck size={24} />, hint: lang === 'es' ? 'Fabricás y vendés vos directo' : 'You manufacture and sell directly' },
                    ],
                    formData.targetAudience || [],
                    (val) => {
                        const current = formData.targetAudience || [];
                        const updated = current.includes(val) ? current.filter(a => a !== val) : [...current, val];
                        setFormData({ ...formData, targetAudience: updated });
                    },
                    true,
                    'productStage',
                    'platforms'
                )}

                {step === 'platforms' && renderCardChoice(
                    lang === 'es' ? '¿Dónde vendés o querés vender?' : 'Where do you sell or want to sell?',
                    lang === 'es' ? 'Podés elegir más de una. Hacé clic para seleccionar/deseleccionar.' : 'You can select multiple. Click to toggle.',
                    [
                        { id: 'E-commerce Propio', label: lang === 'es' ? 'E-commerce Propio' : 'Own E-commerce', icon: <Globe size={24} />, hint: 'Shopify, TiendaNube, WooCommerce' },
                        { id: 'Marketplace', label: 'Marketplace', icon: <Store size={24} />, hint: 'MercadoLibre, Amazon, etc.' },
                        { id: 'WhatsApp / DM', label: 'WhatsApp / DM', icon: <Phone size={24} />, hint: lang === 'es' ? 'Cierre por chat directo' : 'Direct chat closing' },
                        { id: 'Venta Consultiva', label: lang === 'es' ? 'Venta Consultiva (Call/Reunión)' : 'Consultative Sale (Call)', icon: <MessageSquare size={24} />, hint: lang === 'es' ? 'Videollamada o presencial' : 'Video call or in person' },
                        { id: 'Retail Físico', label: lang === 'es' ? 'Local Físico / Retail' : 'Physical Store / Retail', icon: <Store size={24} /> },
                        { id: 'Redes Sociales', label: lang === 'es' ? 'Redes Sociales (Instagram/TikTok Shop)' : 'Social Commerce', icon: <TrendingUp size={24} /> },
                    ],
                    formData.salesPlatforms || [],
                    (val) => {
                        const current = formData.salesPlatforms || [];
                        const updated = current.includes(val) ? current.filter(p => p !== val) : [...current, val];
                        setFormData({ ...formData, salesPlatforms: updated });
                    },
                    true,
                    'audience',
                    'volume'
                )}

                {step === 'volume' && renderCardChoice(
                    lang === 'es' ? '¿Cuántas ventas o sesiones querés hacer al mes?' : 'How many sales or sessions do you want per month?',
                    lang === 'es' ? 'No importa si hoy vendés menos. ¿Cuál es tu meta mensual?' : 'No matter current volume. What\'s your monthly goal?',
                    [
                        { id: 'Micro (<50)', label: lang === 'es' ? 'Menos de 50' : 'Under 50', icon: <Gem size={24} />, hint: lang === 'es' ? 'Foco en calidad, alto valor individual' : 'Quality focus, high individual value' },
                        { id: 'Pequeño (50-200)', label: '50 - 200', icon: <BarChart3 size={24} />, hint: lang === 'es' ? 'Volumen medio, necesita algo de proceso' : 'Medium volume' },
                        { id: 'Escala (200-1000)', label: '200 - 1000', icon: <TrendingUp size={24} />, hint: lang === 'es' ? 'Requiere logística y ads consistentes' : 'Needs consistent logistics & ads' },
                        { id: 'Masivo (>1000)', label: lang === 'es' ? 'Más de 1000' : 'Over 1000', icon: <Zap size={24} />, hint: lang === 'es' ? 'Automatización total y operación grande' : 'Full automation, large operation' },
                    ],
                    formData.expectedVolume || '',
                    (val) => setFormData({ ...formData, expectedVolume: val }),
                    false,
                    'platforms',
                    'objection'
                )}

                {step === 'objection' && renderTextQuestion(
                    lang === 'es' ? '¿Cuál es la frase letal que te dicen cuando NO te compran?' : 'What is the killer phrase people say when they DON\'T buy?',
                    lang === 'es' ? 'Literalmente la objeción N°1. Ej: "Es muy caro", "Ya tengo uno parecido", "Mi equipo usa otra cosa". Sé brutal y honesto — la IA necesita armar munición pesada contra esto.' : 'The #1 objection. Be brutally honest.',
                    formData.mainObjection,
                    (val) => setFormData({ ...formData, mainObjection: val }),
                    'volume',
                    'customer',
                    formData.mainObjection.trim() !== '',
                    false,
                    lang === 'es' ? 'Ej: "Es muy caro para lo que ofrece"' : 'E.g: "It\'s too expensive for what it offers"'
                )}

                {step === 'customer' && renderTextQuestion(
                    lang === 'es' ? '¿A qué cliente soñás llegarle pero hoy no podés?' : 'Who is your dream client you can\'t reach today?',
                    lang === 'es' ? 'Si tuvieras una varita mágica, ¿a quién le venderías esto mañana? Sé lo más específico posible (Ej: "Directores médicos de clínicas privadas de CABA").' : 'If you had a magic wand, who would buy this tomorrow? Be very specific.',
                    formData.desiredCustomerProfile,
                    (val) => setFormData({ ...formData, desiredCustomerProfile: val }),
                    'objection',
                    'uniqueAngle',
                    formData.desiredCustomerProfile.trim() !== '',
                    false,
                    lang === 'es' ? 'Ej: "Dueñas de boutiques premium en ciudades grandes"' : 'E.g: "Owners of premium boutiques in major cities"'
                )}

                {step === 'uniqueAngle' && renderTextQuestion(
                    lang === 'es' ? '¿Qué tenés vos que las alternativas genéricas NO tienen?' : 'What do you have that generic alternatives DON\'T?',
                    lang === 'es' ? 'Pensá: ¿Por qué alguien pagaría MÁS por esto en vez de la opción barata? Puede ser experiencia, proceso, garantía, exclusividad, resultados, etc.' : 'Why would someone pay MORE for this instead of the cheap option?',
                    formData.uniqueAngle || '',
                    (val) => setFormData({ ...formData, uniqueAngle: val }),
                    'customer',
                    'margin',
                    true,
                    true,
                    lang === 'es' ? 'Ej: "Hecho a mano con cuero genuino, cada pieza es única"' : 'E.g: "Handmade with genuine leather, each piece is unique"'
                )}

                {step === 'margin' && (() => {
                    // Smart parser: handles "5.000" (LATAM thousands), "5,000.50", "$5.000,50", etc.
                    const parseSmartNumber = (raw: string) => {
                        if (!raw) return NaN;
                        let cleaned = raw.replace(/[^0-9.,]/g, ''); // keep digits, dots, commas
                        // Detect LATAM format: dots as thousands, comma as decimal (e.g. 5.000,50)
                        if (cleaned.includes(',') && cleaned.includes('.')) {
                            // If comma comes last, it's LATAM: dots are thousands, comma is decimal
                            if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
                                cleaned = cleaned.replace(/\./g, '').replace(',', '.');
                            } else {
                                // US format: commas are thousands, dot is decimal
                                cleaned = cleaned.replace(/,/g, '');
                            }
                        } else if (cleaned.includes(',') && !cleaned.includes('.')) {
                            // "5.000" or "5,000" — check if comma/dot is thousands separator
                            const parts = cleaned.split(',');
                            if (parts.length === 2 && parts[1].length === 3) {
                                // "5,000" — comma is thousands separator
                                cleaned = cleaned.replace(',', '');
                            } else {
                                // "5,50" — comma is decimal separator
                                cleaned = cleaned.replace(',', '.');
                            }
                        } else if (cleaned.includes('.') && !cleaned.includes(',')) {
                            const parts = cleaned.split('.');
                            if (parts.length === 2 && parts[1].length === 3) {
                                // "5.000" — dot is thousands separator (LATAM)
                                cleaned = cleaned.replace('.', '');
                            }
                            // else "5.50" — dot is decimal, keep as-is
                        }
                        return parseFloat(cleaned);
                    };
                    const costNum = parseSmartNumber(formData.unitCostRaw || '');
                    const priceNum = parseSmartNumber(formData.unitPrice || '');
                    const hasMargin = !isNaN(costNum) && !isNaN(priceNum) && priceNum > 0;
                    const marginPct = hasMargin ? Math.round(((priceNum - costNum) / priceNum) * 100) : null;

                    return (
                        <div className="animate-fade-in max-w-2xl mx-auto">
                            {renderProgressBar()}
                            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-6 leading-tight">
                                {lang === 'es' ? '¿Cuánto te cuesta producir o entregar esto?' : 'How much does it cost to produce or deliver this?'}
                            </h2>
                            <p className="text-xl text-slate-500 mb-10 leading-relaxed border-l-4 border-violet-300 pl-4">
                                {lang === 'es'
                                    ? 'Incluí todo: insumos, herramientas, plataformas, publicidad, comisiones, envío. Si es un servicio, pensá en tu tiempo + costos operativos. Aproximado está bien.'
                                    : 'Include everything: supplies, tools, platforms, ads, commissions, shipping. For services, think about your time + operational costs. Approximate is fine.'}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">
                                        {lang === 'es' ? 'Costo por unidad / servicio' : 'Cost per unit / service'}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none text-xl font-bold"
                                        placeholder={lang === 'es' ? 'Ej: $2000' : 'E.g: $20'}
                                        value={formData.unitCostRaw || ''}
                                        onChange={(e) => setFormData({ ...formData, unitCostRaw: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">
                                        {lang === 'es' ? 'Precio de venta' : 'Selling price'}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none text-xl font-bold"
                                        placeholder={lang === 'es' ? 'Ej: $5000' : 'E.g: $50'}
                                        value={formData.unitPrice}
                                        onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                                    />
                                </div>
                            </div>

                            {hasMargin && marginPct !== null && (
                                <div className={`p-6 rounded-2xl border-2 text-center mb-6 ${marginPct >= 50 ? 'bg-emerald-50 border-emerald-200' :
                                    marginPct >= 20 ? 'bg-amber-50 border-amber-200' :
                                        'bg-rose-50 border-rose-200'
                                    }`}>
                                    <span className="text-sm font-bold text-slate-500 block mb-1">
                                        {lang === 'es' ? 'Tu margen bruto estimado' : 'Estimated gross margin'}
                                    </span>
                                    <span className={`text-4xl font-black ${marginPct >= 50 ? 'text-emerald-600' :
                                        marginPct >= 20 ? 'text-amber-600' :
                                            'text-rose-600'
                                        }`}>{marginPct}%</span>
                                    <span className="text-xs text-slate-400 block mt-2">
                                        {lang === 'es' ? `Costo: $${costNum.toLocaleString()} → Precio: $${priceNum.toLocaleString()} → Ganancia: $${(priceNum - costNum).toLocaleString()}` : `Cost: $${costNum.toLocaleString()} → Price: $${priceNum.toLocaleString()} → Profit: $${(priceNum - costNum).toLocaleString()}`}
                                    </span>
                                </div>
                            )}

                            <p className="text-sm text-slate-400 italic mb-6">
                                {lang === 'es' ? 'Si no tenés estos datos, podés omitir este paso.' : 'If you don\'t have this data, you can skip this step.'}
                            </p>

                            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-8">
                                <button onClick={() => setStep('uniqueAngle')} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 flex items-center gap-2">
                                    <ArrowLeft size={18} /> {lang === 'es' ? 'Atrás' : 'Back'}
                                </button>
                                <button
                                    onClick={finishOnboarding}
                                    disabled={isSubmitting}
                                    className={`px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all ${isSubmitting ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg hover:-translate-y-1 hover:shadow-xl'
                                        }`}
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Rocket size={20} /> {lang === 'es' ? 'Generar Deep Dive' : 'Generate Deep Dive'}</>}
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
