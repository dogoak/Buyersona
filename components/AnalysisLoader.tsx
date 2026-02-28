import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import {
    Target, TrendingUp, BarChart3, Globe, Lightbulb,
    ShieldCheck, Rocket, CheckCircle, Users2, MapPin
} from 'lucide-react';

interface AnalysisLoaderProps {
    lang: Language;
}

const STEPS_ES = [
    { icon: Globe, label: 'Analizando contexto de mercado...', duration: 8000 },
    { icon: Target, label: 'Identificando buyer personas...', duration: 12000 },
    { icon: Users2, label: 'Perfilando segmentos de clientes...', duration: 10000 },
    { icon: TrendingUp, label: 'Evaluando canales de adquisición...', duration: 10000 },
    { icon: BarChart3, label: 'Calculando métricas de industria...', duration: 8000 },
    { icon: MapPin, label: 'Mapeando competencia...', duration: 10000 },
    { icon: Lightbulb, label: 'Descubriendo océanos azules...', duration: 10000 },
    { icon: ShieldCheck, label: 'Evaluando riesgos y oportunidades...', duration: 8000 },
    { icon: Rocket, label: 'Generando plan de acción...', duration: 12000 },
    { icon: CheckCircle, label: 'Finalizando informe estratégico...', duration: 6000 },
];

const STEPS_EN = [
    { icon: Globe, label: 'Analyzing market context...', duration: 8000 },
    { icon: Target, label: 'Identifying buyer personas...', duration: 12000 },
    { icon: Users2, label: 'Profiling customer segments...', duration: 10000 },
    { icon: TrendingUp, label: 'Evaluating acquisition channels...', duration: 10000 },
    { icon: BarChart3, label: 'Calculating industry benchmarks...', duration: 8000 },
    { icon: MapPin, label: 'Mapping competition...', duration: 10000 },
    { icon: Lightbulb, label: 'Discovering blue oceans...', duration: 10000 },
    { icon: ShieldCheck, label: 'Evaluating risks and opportunities...', duration: 8000 },
    { icon: Rocket, label: 'Generating action plan...', duration: 12000 },
    { icon: CheckCircle, label: 'Finalizing strategic report...', duration: 6000 },
];

export default function AnalysisLoader({ lang }: AnalysisLoaderProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const [stepProgress, setStepProgress] = useState(0);

    const steps = lang === 'es' ? STEPS_ES : STEPS_EN;
    const totalSteps = steps.length;

    // Advance through steps with timing
    useEffect(() => {
        const stepDuration = steps[currentStep]?.duration || 8000;
        const interval = 50; // Update every 50ms for smooth progress
        const increment = (100 / (stepDuration / interval));

        let localProgress = 0;
        const timer = setInterval(() => {
            localProgress += increment;
            setStepProgress(Math.min(localProgress, 100));

            if (localProgress >= 100) {
                clearInterval(timer);
                if (currentStep < totalSteps - 1) {
                    setTimeout(() => {
                        setCurrentStep(prev => prev + 1);
                        setStepProgress(0);
                    }, 300);
                }
            }
        }, interval);

        return () => clearInterval(timer);
    }, [currentStep, totalSteps]);

    // Overall progress
    useEffect(() => {
        const baseProgress = (currentStep / totalSteps) * 100;
        const stepContribution = (stepProgress / 100) * (1 / totalSteps) * 100;
        setProgress(Math.min(baseProgress + stepContribution, 95)); // Cap at 95% until done
    }, [currentStep, stepProgress, totalSteps]);

    const CurrentIcon = steps[currentStep]?.icon || Globe;

    return (
        <div className="min-h-[calc(100vh-57px)] flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 p-6">
            <div className="w-full max-w-lg mx-auto">

                {/* Animated Icon */}
                <div className="flex justify-center mb-10">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-indigo-200 animate-ping opacity-15 scale-150"></div>
                        <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-200">
                            <CurrentIcon size={40} className="text-white" />
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-2">
                    {lang === 'es' ? 'Generando tu informe estratégico' : 'Generating your strategic report'}
                </h2>
                <p className="text-slate-500 text-center mb-10 text-sm">
                    {lang === 'es'
                        ? 'Esto suele tomar entre 1 y 2 minutos. No cierres esta ventana.'
                        : 'This usually takes 1-2 minutes. Don\'t close this window.'}
                </p>

                {/* Progress Bar */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
                    {/* Overall progress */}
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Progreso</span>
                        <span className="text-sm font-bold text-indigo-600">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-6">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300 ease-out relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                    </div>

                    {/* Current step label */}
                    <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                        <CurrentIcon size={18} className="text-indigo-600 flex-shrink-0" />
                        <span className="text-sm font-semibold text-indigo-800">
                            {steps[currentStep]?.label}
                        </span>
                    </div>
                </div>

                {/* Steps checklist */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="space-y-1">
                        {steps.map((step, index) => {
                            const StepIcon = step.icon;
                            const isDone = index < currentStep;
                            const isCurrent = index === currentStep;
                            const isFuture = index > currentStep;

                            return (
                                <div
                                    key={index}
                                    className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-300 ${isCurrent ? 'bg-indigo-50' : ''
                                        }`}
                                >
                                    {/* Status indicator */}
                                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                                        {isDone ? (
                                            <CheckCircle size={16} className="text-emerald-500" />
                                        ) : isCurrent ? (
                                            <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
                                        ) : (
                                            <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                                        )}
                                    </div>

                                    {/* Label */}
                                    <span className={`text-sm transition-colors ${isDone ? 'text-emerald-700 font-medium' :
                                            isCurrent ? 'text-indigo-700 font-semibold' :
                                                'text-slate-400'
                                        }`}>
                                        {step.label.replace('...', '')}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}
