import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { Loader2, ArrowLeft, Target, Users, Mail, Building2, ExternalLink, Copy, CheckCircle2, Linkedin, Phone, Globe, MapPin, Zap, MessageSquare, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type OutreachTab = 'email_formal' | 'email_direct' | 'linkedin_dm';

export default function CampaignView() {
    const { campaignId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [campaign, setCampaign] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedProspect, setSelectedProspect] = useState<any>(null);
    const [copied, setCopied] = useState('');
    const [activeTab, setActiveTab] = useState<OutreachTab>('email_formal');
    const [icpExpanded, setIcpExpanded] = useState(false);

    useEffect(() => { if (user && campaignId) fetchCampaign(); }, [user, campaignId]);

    const fetchCampaign = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('prospecting_campaigns').select('*').eq('id', campaignId).single();
        if (error || !data) { navigate('/dashboard/prospector/dashboard'); return; }
        if (data.status !== 'completed') { navigate(`/dashboard/prospector/loader/${campaignId}`); return; }
        setCampaign(data);
        if (data.prospects_list?.length > 0) setSelectedProspect(data.prospects_list[0]);
        setLoading(false);
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(''), 2000);
    };

    const getOutreachContent = (prospect: any, tab: OutreachTab) => {
        if (!prospect?.outreach) return null;
        return prospect.outreach[tab] || null;
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-slate-500 bg-slate-50 border-slate-200';
    };

    const getInitials = (name: string) => {
        return name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
    }

    const { icp_definition, prospects_list, name: campName } = campaign;
    const leadsCount = prospects_list?.length || 0;
    const withEmail = prospects_list?.filter((p: any) => p.email).length || 0;
    const avgScore = leadsCount > 0 ? Math.round(prospects_list.reduce((s: number, p: any) => s + (p.match_score || 0), 0) / leadsCount) : 0;

    return (
        <div className="flex-1 flex flex-col h-screen bg-slate-50 relative pt-[57px] sm:pt-0">
            {/* Top Bar */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/dashboard/prospector/dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500"><ArrowLeft size={20} /></button>
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{campName}</h1>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Prospección B2B • {leadsCount} leads</p>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-3 text-sm">
                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg font-bold">{withEmail} con email</span>
                    <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg font-bold">Score promedio: {avgScore}%</span>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

                {/* ═══ LEFT PANEL ═══ */}
                <div className="w-full lg:w-[380px] flex flex-col border-r border-slate-200 bg-white shrink-0">
                    
                    {/* ICP Section (collapsible) */}
                    {icp_definition && (
                        <div className="border-b border-slate-100">
                            <button onClick={() => setIcpExpanded(!icpExpanded)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition">
                                <div className="flex items-center gap-2">
                                    <Target size={16} className="text-indigo-600" />
                                    <span className="text-sm font-bold text-slate-900">Perfil de Cliente Ideal (ICP)</span>
                                </div>
                                {icpExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                            </button>
                            {icpExpanded && (
                                <div className="px-5 pb-4 space-y-3 animate-in">
                                    <p className="text-sm text-slate-600 leading-relaxed">{icp_definition.icp_summary}</p>
                                    {icp_definition.target_roles?.length > 0 && (
                                        <div>
                                            <span className="text-xs font-bold text-slate-400 uppercase">Roles</span>
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                {icp_definition.target_roles.map((r: string, i: number) => (
                                                    <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium">{r}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {icp_definition.target_industries?.length > 0 && (
                                        <div>
                                            <span className="text-xs font-bold text-slate-400 uppercase">Industrias</span>
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                {icp_definition.target_industries.map((ind: string, i: number) => (
                                                    <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium">{ind}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {icp_definition.icp_pain_points?.length > 0 && (
                                        <div>
                                            <span className="text-xs font-bold text-slate-400 uppercase">Pain Points</span>
                                            <ul className="mt-1 space-y-1">
                                                {icp_definition.icp_pain_points.map((p: string, i: number) => (
                                                    <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                                                        <span className="text-red-400 mt-0.5">•</span> {p}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Leads List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/80">
                        {prospects_list?.map((prospect: any, idx: number) => {
                            const isSelected = selectedProspect === prospect;
                            const score = prospect.match_score || 0;
                            return (
                                <button key={idx} onClick={() => { setSelectedProspect(prospect); setActiveTab('email_formal'); }}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer block focus:outline-none ${isSelected ? 'bg-white border-indigo-300 shadow-md ring-2 ring-indigo-500 ring-offset-1' : 'bg-white border-slate-200 hover:border-indigo-200 shadow-sm'}`}>
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        <div className="shrink-0">
                                            {prospect.photo_url ? (
                                                <img src={prospect.photo_url} alt="" className="w-11 h-11 rounded-xl object-cover border border-slate-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
                                            ) : null}
                                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-600 text-xs font-bold ${prospect.photo_url ? 'hidden' : ''}`}>
                                                {getInitials(prospect.full_name)}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="font-bold text-slate-900 text-sm truncate">{prospect.full_name}</h3>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-md border shrink-0 ${getScoreColor(score)}`}>{score}%</span>
                                            </div>
                                            <p className="text-xs text-slate-500 truncate mt-0.5">{prospect.job_title}</p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <Building2 size={11} className="text-slate-400 shrink-0" />
                                                <span className="text-xs text-slate-400 truncate">{prospect.company_name}</span>
                                            </div>
                                            <div className="flex gap-1.5 mt-1.5">
                                                {prospect.email && <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">✉️ Email</span>}
                                                {prospect.phone && <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded font-medium">📞 Tel</span>}
                                                {prospect.linkedin_url && <span className="text-[10px] px-1.5 py-0.5 bg-sky-50 text-sky-600 rounded font-medium">in</span>}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ═══ RIGHT PANEL ═══ */}
                <div className="flex-1 flex flex-col bg-slate-50/50 overflow-y-auto">
                    {selectedProspect ? (
                        <div className="p-6 lg:p-10 max-w-4xl mx-auto w-full">
                            
                            {/* Profile Header */}
                            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-6">
                                <div className="flex flex-col sm:flex-row items-start gap-5">
                                    {/* Photo */}
                                    <div className="shrink-0">
                                        {selectedProspect.photo_url ? (
                                            <img src={selectedProspect.photo_url} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
                                        ) : null}
                                        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-300 flex items-center justify-center text-indigo-600 text-xl font-bold ${selectedProspect.photo_url ? 'hidden' : ''}`}>
                                            {getInitials(selectedProspect.full_name)}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-extrabold text-slate-900">{selectedProspect.full_name}</h2>
                                        <p className="text-sm font-bold text-indigo-600 mt-1">{selectedProspect.job_title} <span className="text-slate-400">@</span> {selectedProspect.company_name}</p>
                                        {selectedProspect.location && (
                                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin size={12} /> {selectedProspect.location}</p>
                                        )}
                                        {/* Contact buttons */}
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {selectedProspect.linkedin_url && (
                                                <a href={selectedProspect.linkedin_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-200 text-slate-700 text-xs font-bold rounded-lg transition">
                                                    <Linkedin size={13} /> LinkedIn <ExternalLink size={11} />
                                                </a>
                                            )}
                                            {selectedProspect.email && (
                                                <button onClick={() => copyToClipboard(selectedProspect.email, 'email')} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 text-xs font-bold rounded-lg transition">
                                                    <Mail size={13} /> {copied === 'email' ? '¡Copiado!' : selectedProspect.email}
                                                </button>
                                            )}
                                            {selectedProspect.phone && (
                                                <button onClick={() => copyToClipboard(selectedProspect.phone, 'phone')} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-slate-50 hover:bg-green-50 hover:border-green-200 text-slate-700 text-xs font-bold rounded-lg transition">
                                                    <Phone size={13} /> {copied === 'phone' ? '¡Copiado!' : selectedProspect.phone}
                                                </button>
                                            )}
                                            {selectedProspect.company_website && (
                                                <a href={selectedProspect.company_website.startsWith('http') ? selectedProspect.company_website : `https://${selectedProspect.company_website}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition">
                                                    <Globe size={13} /> Web <ExternalLink size={11} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    {/* Match Score */}
                                    <div className="shrink-0 text-center">
                                        <div className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center ${getScoreColor(selectedProspect.match_score || 0)}`}>
                                            <Star size={14} />
                                            <span className="text-lg font-extrabold">{selectedProspect.match_score || 0}%</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Match</p>
                                    </div>
                                </div>
                            </div>

                            {/* Match Reason */}
                            {selectedProspect.reason_for_match && (
                                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5 mb-6">
                                    <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Target size={14} /> Por qué es un buen lead
                                    </h3>
                                    <p className="text-emerald-900 text-sm leading-relaxed">{selectedProspect.reason_for_match}</p>
                                </div>
                            )}

                            {/* Outreach Tabs */}
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                {/* Tab Headers */}
                                <div className="bg-slate-900 px-4 sm:px-6 py-3 flex items-center gap-1 overflow-x-auto">
                                    {([
                                        { key: 'email_formal' as OutreachTab, icon: Mail, label: 'Email Formal' },
                                        { key: 'email_direct' as OutreachTab, icon: Zap, label: 'Email Directo' },
                                        { key: 'linkedin_dm' as OutreachTab, icon: MessageSquare, label: 'LinkedIn DM' },
                                    ]).map(tab => (
                                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap ${activeTab === tab.key ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                                            <tab.icon size={14} /> {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content */}
                                <div className="p-6 sm:p-8">
                                    {activeTab === 'linkedin_dm' ? (
                                        // LinkedIn DM (simple message)
                                        <div>
                                            <p className="text-sm text-slate-400 font-medium mb-3">MENSAJE DIRECTO DE LINKEDIN:</p>
                                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                                                <p className="text-slate-800 text-sm leading-relaxed font-medium">
                                                    {getOutreachContent(selectedProspect, 'linkedin_dm')?.message || 'No disponible'}
                                                </p>
                                            </div>
                                            <button onClick={() => copyToClipboard(getOutreachContent(selectedProspect, 'linkedin_dm')?.message || '', 'dm')}
                                                className="mt-4 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition">
                                                {copied === 'dm' ? <><CheckCircle2 size={16} /> ¡Copiado!</> : <><Copy size={16} /> Copiar Mensaje</>}
                                            </button>
                                        </div>
                                    ) : (
                                        // Email variants
                                        <div>
                                            <div className="mb-5 pb-4 border-b border-slate-100">
                                                <p className="text-xs text-slate-400 font-medium mb-1">ASUNTO:</p>
                                                <p className="text-lg font-bold text-slate-900">{getOutreachContent(selectedProspect, activeTab)?.subject || 'Sin asunto'}</p>
                                            </div>
                                            <div className="prose prose-slate bg-transparent font-medium text-slate-700 max-w-none prose-p:leading-relaxed text-sm">
                                                {(getOutreachContent(selectedProspect, activeTab)?.body || 'No disponible').split('\n').map((line: string, i: number) => (
                                                    <p key={i}>{line}</p>
                                                ))}
                                            </div>
                                            <button onClick={() => {
                                                const content = getOutreachContent(selectedProspect, activeTab);
                                                if (content) copyToClipboard(`Asunto: ${content.subject}\n\n${content.body}`, activeTab);
                                            }}
                                                className="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition">
                                                {copied === activeTab ? <><CheckCircle2 size={16} /> ¡Copiado!</> : <><Copy size={16} /> Copiar Email Completo</>}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Data source badge */}
                            <div className="mt-4 flex justify-end">
                                <span className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1 bg-slate-100 rounded-md">
                                    Fuente: {selectedProspect.data_source === 'apollo' ? '🔷 Apollo.io' : '🔗 LinkedIn'}
                                </span>
                            </div>

                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                            <Users size={48} className="mb-4 opacity-20" />
                            <p className="text-lg font-medium">Seleccioná un prospecto a la izquierda<br/>para ver su ficha y opciones de contacto.</p>
                        </div>
                    )}
                </div>

            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-in { animation: fadeInUp 0.25s ease-out; }
            `}</style>
        </div>
    );
}
