import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Globe, Building2, Target, ArrowRight, ArrowLeft, BookOpen, AlertCircle, Sparkles, Plus, X, MapPin, Briefcase, MessageSquare, Linkedin } from 'lucide-react';

interface SeedClient {
    name: string;
    website: string;
    linkedin: string;
    instagram: string;
    facebook: string;
    twitter: string;
    industry: string;
    notes: string;
}

const emptySeedClient = (): SeedClient => ({ name: '', website: '', linkedin: '', instagram: '', facebook: '', twitter: '', industry: '', notes: '' });

// SVG icons for social networks (inline since lucide doesn't have all)
const InstagramIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="5"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
);
const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
);
const XIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
);

export default function WizardCampaign() {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [reports, setReports] = useState<any[]>([]);
    const [selectedReportId, setSelectedReportId] = useState('');
    const [loadingReports, setLoadingReports] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Step 2: Seed clients
    const [seedClients, setSeedClients] = useState<SeedClient[]>([emptySeedClient(), emptySeedClient()]);

    // Step 3: Search config
    const [region, setRegion] = useState('Argentina');
    const [roles, setRoles] = useState<string[]>([]);
    const [roleInput, setRoleInput] = useState('');
    const [industries, setIndustries] = useState<string[]>([]);
    const [industryInput, setIndustryInput] = useState('');
    const [maxLeads, setMaxLeads] = useState(10);

    useEffect(() => { if (user) fetchReports(); }, [user]);

    const fetchReports = async () => {
        const { data } = await supabase
            .from('business_reports')
            .select('id, business_name, created_at')
            .eq('user_id', user!.id)
            .in('status', ['completed'])
            .order('created_at', { ascending: false });
        if (data) {
            setReports(data);
            if (data.length > 0) setSelectedReportId(data[0].id);
        }
        setLoadingReports(false);
    };

    const addSeedClient = () => {
        if (seedClients.length >= 8) return;
        setSeedClients([...seedClients, emptySeedClient()]);
    };

    const removeSeedClient = (idx: number) => {
        if (seedClients.length <= 2) return;
        setSeedClients(seedClients.filter((_, i) => i !== idx));
    };

    const updateSeedClient = (idx: number, field: keyof SeedClient, value: string) => {
        const updated = [...seedClients];
        updated[idx] = { ...updated[idx], [field]: value };
        setSeedClients(updated);
    };

    const addPill = (type: 'role' | 'industry') => {
        const val = type === 'role' ? roleInput.trim() : industryInput.trim();
        if (!val) return;
        if (type === 'role') {
            if (!roles.includes(val)) setRoles([...roles, val]);
            setRoleInput('');
        } else {
            if (!industries.includes(val)) setIndustries([...industries, val]);
            setIndustryInput('');
        }
    };

    const validateStep = (s: number): boolean => {
        setErrorMsg('');
        if (s === 1) {
            if (!name.trim()) { setErrorMsg('Dale un nombre a tu campaña.'); return false; }
            if (!selectedReportId) { setErrorMsg('Seleccioná un análisis estratégico.'); return false; }
            return true;
        }
        if (s === 2) {
            const valid = seedClients.filter(c => c.name.trim());
            if (valid.length < 2) { setErrorMsg('Necesitás al menos 2 empresas semilla con nombre.'); return false; }
            return true;
        }
        return true;
    };

    const goNext = () => {
        if (validateStep(step)) setStep(step + 1);
    };
    const goBack = () => { setErrorMsg(''); setStep(step - 1); };

    const handleCreate = async () => {
        if (!validateStep(3)) return;
        setSaving(true);
        setErrorMsg('');
        try {
            const validClients = seedClients.filter(c => c.name.trim());
            const { data, error } = await supabase.from('prospecting_campaigns').insert({
                user_id: user!.id,
                name: name.trim(),
                business_report_id: selectedReportId,
                input_clients: validClients,
                search_config: {
                    region,
                    roles: roles.length > 0 ? roles : undefined,
                    industries: industries.length > 0 ? industries : undefined,
                    max_leads: maxLeads
                }
            }).select('id').single();
            if (error || !data) throw error || new Error("No data returned");
            navigate(`/dashboard/prospector/checkout/${data.id}`);
        } catch (error: any) {
            setErrorMsg(error.message || 'Error al crear campaña');
            setSaving(false);
        }
    };

    const stepIndicator = (
        <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map(s => (
                <React.Fragment key={s}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${s === step ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-200' : s < step ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {s < step ? '✓' : s}
                    </div>
                    {s < 3 && <div className={`h-0.5 w-10 rounded-full transition-all ${s < step ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
                </React.Fragment>
            ))}
            <span className="ml-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                {step === 1 ? 'Contexto' : step === 2 ? 'Clientes Semilla' : 'Configuración'}
            </span>
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 sm:p-8 pt-24 sm:pt-10">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-2">
                    <button onClick={() => navigate('/dashboard/prospector/dashboard')} className="text-slate-500 hover:text-slate-800 transition">Dashboard</button>
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-900 font-semibold">Nueva prospección</span>
                </div>
                
                <h1 className="text-3xl font-extrabold text-slate-900 mb-4 mt-4 tracking-tight flex items-center gap-3">
                    Motor de Prospección IA
                    <Sparkles className="text-indigo-500 hidden sm:block" size={28} />
                </h1>

                {stepIndicator}

                {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 mb-6 animate-in">
                        <AlertCircle size={20} />
                        <span className="font-medium">{errorMsg}</span>
                    </div>
                )}

                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">

                    {/* ═══ STEP 1: Name + Context ═══ */}
                    {step === 1 && (
                        <div className="space-y-8 animate-in">
                            <div>
                                <label className="block text-sm font-bold text-slate-900 mb-2">Nombre de la Campaña</label>
                                <p className="text-sm text-slate-500 mb-3">Un nombre para identificar esta búsqueda.</p>
                                <div className="relative">
                                    <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input type="text" placeholder="Ej: Expansión Textil Q3" value={name} onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-900" />
                                </div>
                            </div>
                            <div className="h-px bg-slate-100" />
                            <div>
                                <label className="block text-sm font-bold text-slate-900 mb-2">Contexto Estratégico (IA)</label>
                                <p className="text-sm text-slate-500 mb-3">La IA usará tu Análisis de Negocio previo para entender tu propuesta de valor, competidores y oportunidades. Esto hace que los emails generados sean realmente personalizados.</p>
                                {loadingReports ? (
                                    <div className="h-12 bg-slate-100 animate-pulse rounded-xl" />
                                ) : reports.length === 0 ? (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex flex-col gap-3">
                                        <div className="flex items-start gap-3">
                                            <BookOpen className="text-amber-600 shrink-0 mt-0.5" size={20} />
                                            <div>
                                                <h4 className="font-bold text-amber-900">Necesitás un Análisis Previo</h4>
                                                <p className="text-sm text-amber-800">Para que la IA arme un prospector de alta calidad, primero analizá tu negocio con Buyersona.</p>
                                            </div>
                                        </div>
                                        <button onClick={() => navigate('/')} className="self-start text-sm bg-white border border-amber-300 text-amber-700 px-4 py-2 font-bold rounded-lg hover:bg-amber-100 transition">+ Crear Análisis de mi Negocio</button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                        <select value={selectedReportId} onChange={(e) => setSelectedReportId(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-900 appearance-none cursor-pointer"
                                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}>
                                            <option value="" disabled>Seleccioná un análisis...</option>
                                            {reports.map(r => (
                                                <option key={r.id} value={r.id}>{r.business_name} ({new Date(r.created_at).toLocaleDateString()})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="pt-4 flex justify-end">
                                <button onClick={goNext} disabled={!selectedReportId}
                                    className="group inline-flex items-center gap-2 bg-slate-900 disabled:bg-slate-300 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all">
                                    Siguiente <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ═══ STEP 2: Seed Clients ═══ */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in">
                            <div>
                                <label className="block text-sm font-bold text-slate-900 mb-1">Tus Mejores Clientes (Empresas Semilla)</label>
                                <p className="text-sm text-slate-500 mb-4">La IA analiza tus clientes actuales para encontrar patrones y buscar empresas similares. Cuanta más info, mejores resultados.</p>
                            </div>

                            <div className="space-y-4">
                                {seedClients.map((client, idx) => (
                                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 relative group hover:border-indigo-200 transition-all" style={{ animation: `fadeInUp 0.3s ease-out ${idx * 0.05}s both` }}>
                                        {seedClients.length > 2 && (
                                            <button onClick={() => removeSeedClient(idx)} className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition opacity-0 group-hover:opacity-100">
                                                <X size={16} />
                                            </button>
                                        )}
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">{idx + 1}</div>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Empresa Semilla</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="relative sm:col-span-2">
                                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input type="text" placeholder="Nombre de la empresa *" value={client.name} onChange={(e) => updateSeedClient(idx, 'name', e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                            </div>
                                            <div className="relative">
                                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input type="url" placeholder="Website (opcional)" value={client.website} onChange={(e) => updateSeedClient(idx, 'website', e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                            </div>
                                            <div className="relative">
                                                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input type="url" placeholder="linkedin.com/company/..." value={client.linkedin} onChange={(e) => updateSeedClient(idx, 'linkedin', e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><InstagramIcon /></span>
                                                <input type="url" placeholder="instagram.com/usuario" value={client.instagram} onChange={(e) => updateSeedClient(idx, 'instagram', e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FacebookIcon /></span>
                                                <input type="url" placeholder="facebook.com/pagina" value={client.facebook} onChange={(e) => updateSeedClient(idx, 'facebook', e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><XIcon /></span>
                                                <input type="url" placeholder="x.com/usuario" value={client.twitter} onChange={(e) => updateSeedClient(idx, 'twitter', e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                            </div>
                                            <div className="relative">
                                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input type="text" placeholder="Industria/rubro (opcional)" value={client.industry} onChange={(e) => updateSeedClient(idx, 'industry', e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                            </div>
                                            <div className="relative">
                                                <MessageSquare className="absolute left-3 top-3 text-slate-400" size={16} />
                                                <input type="text" placeholder="¿Por qué es buen cliente? (opcional)" value={client.notes} onChange={(e) => updateSeedClient(idx, 'notes', e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {seedClients.length < 8 && (
                                <button onClick={addSeedClient} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 hover:text-indigo-600 hover:border-indigo-300 font-bold text-sm flex items-center justify-center gap-2 transition-all hover:bg-indigo-50/50">
                                    <Plus size={18} /> Agregar otra empresa semilla
                                </button>
                            )}

                            <div className="pt-4 flex justify-between">
                                <button onClick={goBack} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition">
                                    <ArrowLeft size={18} /> Atrás
                                </button>
                                <button onClick={goNext} className="group inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all">
                                    Siguiente <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ═══ STEP 3: Search Config ═══ */}
                    {step === 3 && (
                        <div className="space-y-8 animate-in">
                            <div>
                                <label className="block text-sm font-bold text-slate-900 mb-1">Configuración de Búsqueda</label>
                                <p className="text-sm text-slate-500 mb-4">Ajustá los parámetros del motor. La IA sugerirá roles e industrias automáticamente, pero podés agregar los tuyos.</p>
                            </div>

                            {/* Region */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    <MapPin size={14} className="inline mr-1" /> Región Target
                                </label>
                                <select value={region} onChange={(e) => setRegion(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}>
                                    <option value="Argentina">🇦🇷 Argentina</option>
                                    <option value="Latinoamerica">🌎 Latinoamérica</option>
                                    <option value="España">🇪🇸 España</option>
                                    <option value="Global">🌍 Global</option>
                                </select>
                            </div>

                            {/* Roles pills */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    <Users size={14} className="inline mr-1" /> Roles Target (opcional, la IA sugiere automáticamente)
                                </label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {roles.map((r, i) => (
                                        <span key={i} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                                            {r}
                                            <button onClick={() => setRoles(roles.filter((_, idx) => idx !== i))} className="hover:text-red-500 transition"><X size={14} /></button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input type="text" placeholder="Ej: CEO, Director Comercial..." value={roleInput} onChange={(e) => setRoleInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPill('role'); } }}
                                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    <button onClick={() => addPill('role')} className="px-4 py-2.5 bg-indigo-100 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-200 transition">
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Industries pills */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    <Briefcase size={14} className="inline mr-1" /> Industrias Target (opcional)
                                </label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {industries.map((ind, i) => (
                                        <span key={i} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                                            {ind}
                                            <button onClick={() => setIndustries(industries.filter((_, idx) => idx !== i))} className="hover:text-red-500 transition"><X size={14} /></button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input type="text" placeholder="Ej: Textil, Moda, Alimentos..." value={industryInput} onChange={(e) => setIndustryInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPill('industry'); } }}
                                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    <button onClick={() => addPill('industry')} className="px-4 py-2.5 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-sm hover:bg-emerald-200 transition">
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Max leads slider */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    <Target size={14} className="inline mr-1" /> Cantidad de Leads
                                </label>
                                <div className="flex items-center gap-4">
                                    <input type="range" min={5} max={15} step={5} value={maxLeads} onChange={(e) => setMaxLeads(Number(e.target.value))}
                                        className="flex-1 accent-indigo-600" />
                                    <span className="w-16 text-center py-2 bg-indigo-50 text-indigo-700 rounded-xl font-extrabold text-lg">{maxLeads}</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Más leads = mayor tiempo de búsqueda y consumo de créditos.</p>
                            </div>

                            <div className="pt-4 flex justify-between">
                                <button onClick={goBack} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition">
                                    <ArrowLeft size={18} /> Atrás
                                </button>
                                <button onClick={handleCreate} disabled={saving}
                                    className="group inline-flex items-center gap-2 bg-indigo-600 disabled:bg-slate-300 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transform hover:-translate-y-0.5 disabled:transform-none disabled:shadow-none">
                                    {saving ? 'Creando campaña...' : 'Crear Prospección'}
                                    {!saving && <Sparkles size={18} />}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-in { animation: fadeInUp 0.3s ease-out; }
            `}</style>
        </div>
    );
}
