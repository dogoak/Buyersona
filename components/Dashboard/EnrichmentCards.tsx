import React from 'react';
import { TrendingUp, TrendingDown, ArrowRight, MapPin, Star, Search, ShoppingBag, DollarSign } from 'lucide-react';

/** Visual cards for Apify enrichment data (Strategic + Deep Dive) */

interface EnrichmentCardsProps {
    data: any; // The _enrichmentData object from analysis_result
    type: 'strategic' | 'deepDive';
}

export default function EnrichmentCards({ data, type }: EnrichmentCardsProps) {
    if (!data) return null;

    const hasTrends = data.trends && data.trends.length > 0;
    const hasMapsCompetitors = data.mapsCompetitors && data.mapsCompetitors.length > 0;
    const hasSerpResults = data.serpResults && data.serpResults.length > 0;
    const hasGoogleShopping = data.googleShopping && data.googleShopping.totalProducts > 0;
    const hasMercadoLibre = data.mercadoLibre && data.mercadoLibre.totalProducts > 0;

    if (!hasTrends && !hasMapsCompetitors && !hasSerpResults && !hasGoogleShopping && !hasMercadoLibre) return null;

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 print:mb-4">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-sm">
                    <Search size={16} className="text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">
                    Datos Reales de Mercado
                </h2>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                    Verificados vía Apify
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Google Trends Card */}
                {hasTrends && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp size={18} className="text-blue-600" />
                            <h3 className="text-sm font-bold text-slate-800">Tendencia de Demanda</h3>
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold ml-auto">Google Trends</span>
                        </div>
                        {data.trends.map((t: any, i: number) => (
                            <div key={i} className="mb-2 last:mb-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-semibold text-slate-700">"{t.term}"</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                        t.trendSummary === 'rising' ? 'bg-green-100 text-green-700' :
                                        t.trendSummary === 'declining' ? 'bg-red-100 text-red-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                        {t.trendSummary === 'rising' ? '📈 Creciente' :
                                         t.trendSummary === 'declining' ? '📉 Decreciente' : '➡️ Estable'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span>Pico: <strong className="text-slate-700">{t.peakValue}/100</strong></span>
                                    <span>Actual: <strong className="text-slate-700">{t.currentValue}/100</strong></span>
                                </div>
                                {t.relatedQueries && t.relatedQueries.length > 0 && (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {t.relatedQueries.slice(0, 4).map((q: string, qi: number) => (
                                            <span key={qi} className="text-[10px] bg-white/60 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">{q}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Google Maps Competitors Card (Strategic only) */}
                {hasMapsCompetitors && (
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-5 border border-emerald-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <MapPin size={18} className="text-emerald-600" />
                            <h3 className="text-sm font-bold text-slate-800">Competidores Reales</h3>
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold ml-auto">Google Maps</span>
                        </div>
                        <div className="space-y-2">
                            {data.mapsCompetitors.slice(0, 5).map((c: any, i: number) => (
                                <div key={i} className="flex items-start gap-2 text-sm">
                                    <span className="font-bold text-emerald-600 text-xs mt-0.5 min-w-[18px]">#{i + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-slate-700 truncate">{c.name}</div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span className="flex items-center gap-0.5">
                                                <Star size={10} className="text-amber-500 fill-amber-500" />
                                                {c.rating}/5
                                            </span>
                                            <span>({c.totalReviews} reseñas)</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Google Shopping Card (Deep Dive only) */}
                {hasGoogleShopping && (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <ShoppingBag size={18} className="text-amber-600" />
                            <h3 className="text-sm font-bold text-slate-800">Precios del Mercado</h3>
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold ml-auto">Google Shopping</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="bg-white/60 rounded-xl p-2.5 text-center border border-amber-200/50">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Más bajo</div>
                                <div className="text-sm font-bold text-green-600">${data.googleShopping.lowestPrice?.toLocaleString('es-AR')}</div>
                            </div>
                            <div className="bg-white/60 rounded-xl p-2.5 text-center border border-amber-200/50">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Promedio</div>
                                <div className="text-sm font-bold text-slate-800">${data.googleShopping.averagePrice?.toLocaleString('es-AR')}</div>
                            </div>
                            <div className="bg-white/60 rounded-xl p-2.5 text-center border border-amber-200/50">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Más alto</div>
                                <div className="text-sm font-bold text-red-600">${data.googleShopping.highestPrice?.toLocaleString('es-AR')}</div>
                            </div>
                        </div>
                        <div className="text-xs text-slate-500">
                            {data.googleShopping.totalProducts} productos encontrados
                        </div>
                    </div>
                )}

                {/* MercadoLibre Card (Deep Dive only) */}
                {hasMercadoLibre && (
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-5 border border-yellow-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <DollarSign size={18} className="text-yellow-600" />
                            <h3 className="text-sm font-bold text-slate-800">Precios en MercadoLibre</h3>
                            <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-semibold ml-auto">MercadoLibre</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="bg-white/60 rounded-xl p-2.5 text-center border border-yellow-200/50">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Más bajo</div>
                                <div className="text-sm font-bold text-green-600">${data.mercadoLibre.lowestPrice?.toLocaleString('es-AR')}</div>
                            </div>
                            <div className="bg-white/60 rounded-xl p-2.5 text-center border border-yellow-200/50">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Promedio</div>
                                <div className="text-sm font-bold text-slate-800">${data.mercadoLibre.averagePrice?.toLocaleString('es-AR')}</div>
                            </div>
                            <div className="bg-white/60 rounded-xl p-2.5 text-center border border-yellow-200/50">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Más alto</div>
                                <div className="text-sm font-bold text-red-600">${data.mercadoLibre.highestPrice?.toLocaleString('es-AR')}</div>
                            </div>
                        </div>
                        {data.mercadoLibre.products && data.mercadoLibre.products.length > 0 && (
                            <div className="space-y-1 mt-2">
                                {data.mercadoLibre.products.slice(0, 3).map((p: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between text-xs">
                                        <span className="text-slate-600 truncate max-w-[60%]">{p.title}</span>
                                        <span className="font-semibold text-slate-700">${p.price?.toLocaleString('es-AR')} · {p.soldQuantity || 0} vendidos</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Google SERP Card */}
                {hasSerpResults && (
                    <div className={`bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-5 border border-violet-100 shadow-sm ${!hasMapsCompetitors && !hasGoogleShopping ? 'md:col-span-1' : ''}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <Search size={18} className="text-violet-600" />
                            <h3 className="text-sm font-bold text-slate-800">Quién Domina Google</h3>
                            <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-semibold ml-auto">SERP</span>
                        </div>
                        {data.serpResults.slice(0, 2).map((s: any, si: number) => (
                            <div key={si} className="mb-2 last:mb-0">
                                <div className="text-xs font-semibold text-violet-600 mb-1">"{s.query}"</div>
                                <div className="space-y-0.5">
                                    {(s.topResults || []).slice(0, 3).map((r: any, ri: number) => (
                                        <div key={ri} className="flex items-center gap-1.5 text-xs">
                                            <span className="font-bold text-violet-500 min-w-[18px]">#{r.position}</span>
                                            <span className="text-slate-700 truncate">{r.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
