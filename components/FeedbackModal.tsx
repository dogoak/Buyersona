import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { MessageSquareHeart, X, Send, CheckCircle2, Loader2 } from 'lucide-react';

interface FeedbackModalProps {
    reportId?: string;
    deepDiveId?: string;
    reportType: 'business' | 'deepdive';
    userId: string;
    lang?: string;
}

const EMOJIS = ['😡', '😕', '😐', '🙂', '🤩'];
const EMOJI_LABELS_ES = ['Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];
const EMOJI_LABELS_EN = ['Very bad', 'Bad', 'Average', 'Good', 'Excellent'];

export default function FeedbackModal({ reportId, deepDiveId, reportType, userId, lang = 'es' }: FeedbackModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [alreadySent, setAlreadySent] = useState(false);
    const [sending, setSending] = useState(false);
    const [showThankYou, setShowThankYou] = useState(false);

    // Ratings (1-5, 0 = not selected)
    const [ratingGeneral, setRatingGeneral] = useState(0);
    const [ratingOnboarding, setRatingOnboarding] = useState(0);
    const [ratingQuality, setRatingQuality] = useState(0);

    // Per-category comments
    const [commentGeneral, setCommentGeneral] = useState('');
    const [commentOnboarding, setCommentOnboarding] = useState('');
    const [commentQuality, setCommentQuality] = useState('');

    const emojiLabels = lang === 'es' ? EMOJI_LABELS_ES : EMOJI_LABELS_EN;

    // Check if feedback already exists
    useEffect(() => {
        const checkExisting = async () => {
            const query = supabase
                .from('report_feedback')
                .select('id')
                .eq('user_id', userId);

            if (reportType === 'business' && reportId) {
                query.eq('report_id', reportId);
            } else if (reportType === 'deepdive' && deepDiveId) {
                query.eq('deep_dive_id', deepDiveId);
            }

            const { data } = await query.limit(1);
            if (data && data.length > 0) {
                setAlreadySent(true);
            }
        };
        if (userId) checkExisting();
    }, [userId, reportId, deepDiveId, reportType]);

    const handleSubmit = async () => {
        if (ratingGeneral === 0 || ratingOnboarding === 0 || ratingQuality === 0) return;

        setSending(true);
        try {
            const { error } = await supabase.from('report_feedback').insert({
                user_id: userId,
                report_id: reportType === 'business' ? reportId : null,
                deep_dive_id: reportType === 'deepdive' ? deepDiveId : null,
                report_type: reportType,
                rating_general: ratingGeneral,
                rating_onboarding: ratingOnboarding,
                rating_quality: ratingQuality,
                comment_general: commentGeneral.trim() || null,
                comment_onboarding: commentOnboarding.trim() || null,
                comment_quality: commentQuality.trim() || null,
            });

            if (error) throw error;

            setIsOpen(false);
            setAlreadySent(true);
            setShowThankYou(true);
            setTimeout(() => setShowThankYou(false), 5000);
        } catch (err: any) {
            console.error('Feedback error:', err);
            alert(lang === 'es' ? 'Error al enviar feedback. Intentá de nuevo.' : 'Error submitting feedback. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const allRated = ratingGeneral > 0 && ratingOnboarding > 0 && ratingQuality > 0;

    // Thank you state after submission
    if (alreadySent || showThankYou) {
        return (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center print:hidden">
                <div className="flex items-center justify-center gap-2 text-emerald-700">
                    <CheckCircle2 size={20} />
                    <p className="font-bold text-sm">
                        {lang === 'es' ? '¡Gracias por tu feedback! Nos ayuda a mejorar.' : 'Thanks for your feedback! It helps us improve.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="w-full bg-gradient-to-r from-indigo-50 to-violet-50 border-2 border-dashed border-indigo-200 rounded-2xl p-6 hover:border-indigo-400 hover:from-indigo-100 hover:to-violet-100 transition-all group print:hidden"
            >
                <div className="flex items-center justify-center gap-3">
                    <MessageSquareHeart size={24} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                        <p className="font-bold text-indigo-700 text-lg">
                            {lang === 'es' ? '¿Qué te pareció este informe?' : 'How was this report?'}
                        </p>
                        <p className="text-sm text-indigo-400">
                            {lang === 'es' ? 'Tu feedback nos ayuda a mejorar cada análisis' : 'Your feedback helps us improve every analysis'}
                        </p>
                    </div>
                </div>
            </button>

            {/* Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
                >
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <MessageSquareHeart size={22} className="text-white" />
                                <h3 className="text-white font-bold text-lg">
                                    {lang === 'es' ? 'Tu opinión importa' : 'Your opinion matters'}
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white/70 hover:text-white transition p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5 overflow-y-auto flex-1">
                            {/* Rating Category: General */}
                            <RatingRow
                                label={lang === 'es' ? 'Rating General' : 'Overall Rating'}
                                sublabel={lang === 'es' ? '¿Qué te pareció en general?' : 'How was it overall?'}
                                value={ratingGeneral}
                                onChange={setRatingGeneral}
                                emojiLabels={emojiLabels}
                                comment={commentGeneral}
                                onCommentChange={setCommentGeneral}
                                commentPlaceholder={lang === 'es' ? '¿Por qué esta puntuación? (opcional)' : 'Why this score? (optional)'}
                                lang={lang}
                            />

                            <hr className="border-slate-100" />

                            {/* Rating Category: Onboarding */}
                            <RatingRow
                                label={lang === 'es' ? 'Facilidad del Onboarding' : 'Onboarding Ease'}
                                sublabel={lang === 'es' ? '¿Fue fácil completar el formulario inicial?' : 'Was the initial form easy to complete?'}
                                value={ratingOnboarding}
                                onChange={setRatingOnboarding}
                                emojiLabels={emojiLabels}
                                comment={commentOnboarding}
                                onCommentChange={setCommentOnboarding}
                                commentPlaceholder={lang === 'es' ? '¿Qué mejorarías del onboarding? (opcional)' : 'What would you improve about onboarding? (optional)'}
                                lang={lang}
                            />

                            <hr className="border-slate-100" />

                            {/* Rating Category: Quality */}
                            <RatingRow
                                label={lang === 'es' ? 'Calidad del Reporte' : 'Report Quality'}
                                sublabel={lang === 'es' ? '¿El contenido fue útil y accionable?' : 'Was the content useful and actionable?'}
                                value={ratingQuality}
                                onChange={setRatingQuality}
                                emojiLabels={emojiLabels}
                                comment={commentQuality}
                                onCommentChange={setCommentQuality}
                                commentPlaceholder={lang === 'es' ? '¿Qué mejorarías del reporte? (opcional)' : 'What would you improve about the report? (optional)'}
                                lang={lang}
                            />

                            {/* Submit */}
                            <button
                                onClick={handleSubmit}
                                disabled={!allRated || sending}
                                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all ${allRated
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                {sending ? (
                                    <><Loader2 size={16} className="animate-spin" /> {lang === 'es' ? 'Enviando...' : 'Sending...'}</>
                                ) : (
                                    <><Send size={16} /> {lang === 'es' ? 'Enviar Feedback' : 'Submit Feedback'}</>
                                )}
                            </button>

                            {!allRated && (
                                <p className="text-xs text-center text-slate-400">
                                    {lang === 'es' ? 'Seleccioná una carita en cada categoría para enviar' : 'Select a face in each category to submit'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ── Emoji Rating Row with optional textarea ──────────────────────────
function RatingRow({ label, sublabel, value, onChange, emojiLabels, comment, onCommentChange, commentPlaceholder, lang }: {
    label: string;
    sublabel: string;
    value: number;
    onChange: (v: number) => void;
    emojiLabels: string[];
    comment: string;
    onCommentChange: (v: string) => void;
    commentPlaceholder: string;
    lang: string;
}) {
    const [hovered, setHovered] = useState(0);

    return (
        <div>
            <p className="text-sm font-bold text-slate-700 mb-0.5">{label}</p>
            <p className="text-xs text-slate-400 mb-3">{sublabel}</p>
            <div className="flex items-center gap-3 mb-3">
                {EMOJIS.map((emoji, idx) => {
                    const rating = idx + 1;
                    const isActive = value === rating;
                    const isHovered = hovered === rating;

                    return (
                        <button
                            key={rating}
                            onClick={() => onChange(rating)}
                            onMouseEnter={() => setHovered(rating)}
                            onMouseLeave={() => setHovered(0)}
                            className={`relative flex flex-col items-center transition-all duration-200 ${isActive
                                ? 'scale-125'
                                : isHovered
                                    ? 'scale-110'
                                    : 'scale-100 opacity-60 hover:opacity-100'
                                }`}
                            title={emojiLabels[idx]}
                        >
                            <span className={`text-3xl ${isActive ? 'drop-shadow-lg' : ''}`}>{emoji}</span>
                            {(isActive || isHovered) && (
                                <span className="absolute -bottom-5 text-[10px] font-bold text-slate-500 whitespace-nowrap">
                                    {emojiLabels[idx]}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
            {/* Show textarea when a rating is selected */}
            {value > 0 && (
                <textarea
                    value={comment}
                    onChange={(e) => onCommentChange(e.target.value)}
                    rows={2}
                    placeholder={commentPlaceholder}
                    className="w-full mt-4 p-3 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none transition"
                />
            )}
        </div>
    );
}
