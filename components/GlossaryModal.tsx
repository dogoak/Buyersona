import React, { useState } from 'react';
import { HelpCircle, X, Search } from 'lucide-react';
import { Language } from '../types';

interface GlossaryEntry {
    term: string;
    definition: string;
    example?: string;
}

const glossaryEs: GlossaryEntry[] = [
    { term: 'CAC (Costo de Adquisición)', definition: 'Cuánta plata te cuesta conseguir UN cliente nuevo. Incluye publicidad, tiempo, herramientas, etc.', example: 'Si gastás $1000 en publicidad y conseguís 10 clientes, tu CAC es $100.' },
    { term: 'LTV (Valor de Vida del Cliente)', definition: 'Cuánta plata te deja un cliente EN TOTAL, desde que te compra la primera vez hasta que deja de comprarte.', example: 'Si un cliente te compra todos los meses $50 durante 1 año, su LTV es $600.' },
    { term: 'ROI (Retorno de Inversión)', definition: 'Por cada peso que invertís, cuánto vuelve. Si es positivo, ganás. Si es negativo, perdés.', example: 'Invertiste $100 y ganaste $300. Tu ROI es del 200%.' },
    { term: 'Tasa de Conversión', definition: 'De cada 100 personas que ven tu producto, cuántas terminan comprando. Es un porcentaje.', example: 'Si 1000 personas ven tu publicidad y 30 compran, tu tasa de conversión es 3%.' },
    { term: 'Ciclo de Venta', definition: 'El tiempo que pasa desde que alguien conoce tu producto hasta que te compra. Puede ser minutos (compra impulsiva) o meses (B2B).', example: 'Un helado tiene un ciclo de 2 minutos. Un software empresarial puede tener un ciclo de 6 meses.' },
    { term: 'Break Even (Punto de Equilibrio)', definition: 'La cantidad mínima que tenés que vender para cubrir todos tus costos. A partir de ahí, empezás a ganar plata.', example: 'Si tus costos fijos son $5000/mes y ganás $50 por venta, tu break even es 100 ventas.' },
    { term: 'Margen', definition: 'El porcentaje de ganancia que te queda después de pagar todos los costos. Cuanto más alto, mejor.', example: 'Vendés algo a $100 y te cuesta $60 producirlo. Tu margen es 40%.' },
    { term: 'Buyer Persona', definition: 'Un perfil ficticio pero basado en datos reales de tu cliente ideal. Incluye quién es, qué necesita, dónde busca y cómo compra.' },
    { term: 'Funnel (Embudo de Ventas)', definition: 'El camino que recorre una persona desde que te conoce hasta que te compra. Se llama embudo porque en cada paso se "caen" personas que no siguen avanzando.', example: 'Un usuario te ve en Instagram → entra a tu web → agrega al carrito → compra. Si de 1000 que te ven solo 10 compran, tu embudo tiene "fugas" que hay que reparar.' },
    { term: 'Lead', definition: 'Una persona interesada en tu producto/servicio que te dejó algún dato de contacto (email, teléfono, etc.). Es un potencial cliente.' },
    { term: 'B2B / B2C', definition: 'B2B = le vendés a otras empresas. B2C = le vendés directo al consumidor final (personas).', example: 'Un mayorista de alimentos es B2B. Una tienda online de ropa es B2C.' },
    { term: 'SEO', definition: 'Siglas de "Search Engine Optimization" (Optimización para Motores de Búsqueda). Son técnicas para que tu negocio aparezca en los primeros resultados de Google cuando alguien busca algo relacionado con lo que vendés. Es gratuito, no es publicidad paga.', example: 'Si vendés zapatillas en Buenos Aires, con buen SEO aparecés cuando alguien busca "zapatillas Buenos Aires" en Google.' },
    { term: 'CPC (Costo por Click)', definition: 'Cuánto te cobra la plataforma de publicidad (Google, Facebook, Instagram) cada vez que alguien hace click en tu anuncio.' },
    { term: 'Upsell / Cross-sell', definition: 'Upsell = ofrecer una versión mejor o más cara de lo que el cliente ya quiere comprar. Cross-sell = ofrecer productos complementarios.', example: 'Upsell: "¿Querés el combo grande por $50 más?". Cross-sell: "Los clientes que compraron esto también llevaron aquello."' },
    { term: 'Ticket Promedio', definition: 'Cuánto gasta en promedio un cliente cada vez que te compra. Se calcula dividiendo la facturación total por la cantidad de ventas.' },
    { term: 'Retención de Clientes', definition: 'El porcentaje de clientes que te vuelven a comprar. Alta retención = negocio sano. Baja retención = algo está fallando.' },
    { term: 'Propuesta de Valor', definition: 'La razón principal por la que un cliente debería elegirte a vos y no a tu competencia. Es lo que te hace diferente y valioso.' },
    // ── Digital Audit Specific Terms ──
    { term: 'SSL (Candadito de Seguridad)', definition: 'Un certificado que encripta la comunicación entre tu sitio web y los visitantes. Se muestra como un candadito verde en el navegador. Sin esto, Google marca tu sitio como "No seguro", lo que espanta clientes.', example: 'Cuando ves "https://" en la URL y un candadito, eso es SSL.' },
    { term: 'Schema Markup (Datos Estructurados)', definition: 'Etiquetas invisibles en tu sitio web que le dicen a Google exactamente qué es tu negocio, qué vendés, tus horarios, tu ubicación, etc. Ayuda a que Google te muestre mejor en los resultados.' },
    { term: 'AEO (Answer Engine Optimization)', definition: 'Es el SEO pero para inteligencias artificiales. Es hacer que tu negocio aparezca cuando la gente le pregunta a ChatGPT, Gemini o Siri sobre tu rubro. Todavía es nuevo pero está creciendo rápidamente.' },
    { term: 'E-E-A-T', definition: 'Siglas de Experience, Expertise, Authoritativeness, Trust (Experiencia, Conocimiento, Autoridad, Confianza). Son los criterios que usa Google para evaluar si tu contenido es de calidad y confiable.' },
    { term: 'Engagement (Interacción)', definition: 'Qué tanto tu audiencia interactúa con tu contenido en redes sociales. Incluye likes, comentarios, compartidos y guardados. Un engagement alto significa que tu contenido le importa a la gente.', example: 'Si tenés 1000 seguidores y cada post tiene 50 likes y 10 comentarios, tu engagement es del 6% — eso es bueno.' },
    { term: 'Social Proof (Prueba Social)', definition: 'Lo que otros dicen de vos: reseñas, testimonios, comentarios, menciones. Las personas confían más en la opinión de otros clientes que en tu propia publicidad.' },
    { term: 'CRM (Customer Relationship Management)', definition: 'Herramienta para gestionar la relación con tus clientes. Te permite guardar datos de contacto, hacer seguimiento de ventas, enviar emails y automatizar tareas de marketing.', example: 'Tools como HubSpot, Mailchimp o incluso una planilla de Excel bien organizada pueden servir como CRM.' },
    { term: 'Meta Tags', definition: 'Información invisible en tu sitio web que le dice a Google de qué trata cada página. Incluye el título (lo que aparece en la pestaña del navegador) y la descripción (el textito que aparece en Google debajo del título).' },
    { term: 'PageSpeed (Velocidad de Carga)', definition: 'Qué tan rápido carga tu sitio web. Google penaliza los sitios lentos bajándolos en los resultados de búsqueda, y los usuarios abandonan sitios que tardan más de 3 segundos.' },
    { term: 'Content Mix (Mezcla de Contenido)', definition: 'La proporción de tipos de contenido que publicás. Lo ideal es un balance entre: contenido educativo (que enseñe), entretenimiento, y ventas. Si solo vendés, la gente se cansa.' },
    { term: 'KPI (Indicador Clave)', definition: 'Son las métricas más importantes para medir si tu estrategia está funcionando. No todos los números importan igual — los KPIs son los que realmente te dicen si vas bien o mal.', example: 'Para un e-commerce, un KPI clave es la tasa de conversión. Para un restaurante, puede ser la tasa de reseñas positivas.' },
    { term: 'Marketplace', definition: 'Plataforma online donde múltiples vendedores ofrecen sus productos, como MercadoLibre, Amazon o Tiendanube. Estar presente te da acceso a millones de compradores que ya están buscando lo que vendés.' },
];

const glossaryEn: GlossaryEntry[] = [
    { term: 'CAC (Customer Acquisition Cost)', definition: 'How much money it costs to get ONE new customer. Includes advertising, time, tools, etc.', example: 'If you spend $1000 on ads and get 10 customers, your CAC is $100.' },
    { term: 'LTV (Lifetime Value)', definition: 'How much money a customer brings you IN TOTAL, from their first purchase until they stop buying from you.', example: 'If a customer buys $50/month for 1 year, their LTV is $600.' },
    { term: 'ROI (Return on Investment)', definition: 'For every dollar invested, how much comes back. Positive = profit. Negative = loss.', example: 'Invested $100, earned $300. ROI = 200%.' },
    { term: 'Conversion Rate', definition: 'Out of every 100 people who see your product, how many end up buying. It\'s a percentage.', example: '1000 people see your ad, 30 buy. Conversion rate = 3%.' },
    { term: 'Sales Cycle', definition: 'The time from when someone discovers your product to when they buy. Can be minutes (impulse) or months (B2B).' },
    { term: 'Break Even', definition: 'The minimum you need to sell to cover all your costs. After that, you start making money.' },
    { term: 'Margin', definition: 'The percentage of profit left after paying all costs. Higher = better.' },
    { term: 'Buyer Persona', definition: 'A fictional but data-backed profile of your ideal customer. Includes who they are, what they need, where they search, and how they buy.' },
    { term: 'Funnel', definition: 'The path a person takes from discovering you to buying. Called a funnel because people "fall off" at each step.' },
    { term: 'Lead', definition: 'A person interested in your product/service who gave you contact info (email, phone, etc.). A potential customer.' },
    { term: 'B2B / B2C', definition: 'B2B = selling to other businesses. B2C = selling directly to end consumers (individuals).' },
    { term: 'SEO', definition: 'Techniques to get your business to appear in Google\'s top results when someone searches for something related to what you sell. It\'s free (not paid advertising).' },
    { term: 'Upsell / Cross-sell', definition: 'Upsell = offering a better/pricier version. Cross-sell = offering complementary products.' },
];

export default function GlossaryModal({ lang }: { lang: Language }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const glossary = lang === 'es' ? glossaryEs : glossaryEn;
    const filtered = search
        ? glossary.filter(g =>
            g.term.toLowerCase().includes(search.toLowerCase()) ||
            g.definition.toLowerCase().includes(search.toLowerCase())
        )
        : glossary;

    return (
        <>
            {/* Floating button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-12 h-12 bg-violet-600 text-white rounded-full shadow-lg hover:bg-violet-700 hover:shadow-xl transition-all flex items-center justify-center z-40 print:hidden group"
                title={lang === 'es' ? '¿No entendés un término?' : "Don't understand a term?"}
            >
                <HelpCircle size={22} />
                <span className="absolute right-14 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">
                    {lang === 'es' ? 'Glosario' : 'Glossary'}
                </span>
            </button>

            {/* Modal */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setIsOpen(false)} />
                    <div className="fixed inset-x-4 top-[10%] bottom-[10%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[520px] bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="bg-violet-600 p-5 text-white flex-shrink-0">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-black flex items-center gap-2">
                                    <HelpCircle size={20} />
                                    {lang === 'es' ? 'Glosario — ¿Qué significa?' : 'Glossary — What does it mean?'}
                                </h3>
                                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-300" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={lang === 'es' ? 'Buscar un término...' : 'Search a term...'}
                                    className="w-full pl-9 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-violet-300 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                                />
                            </div>
                        </div>

                        {/* Entries */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {filtered.map((entry, i) => (
                                <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 hover:bg-violet-50 hover:border-violet-100 transition">
                                    <h4 className="font-bold text-slate-900 text-sm mb-1">{entry.term}</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">{entry.definition}</p>
                                    {entry.example && (
                                        <p className="text-xs text-violet-600 mt-2 bg-violet-50 px-3 py-2 rounded-lg border border-violet-100 font-medium">
                                            💡 {entry.example}
                                        </p>
                                    )}
                                </div>
                            ))}
                            {filtered.length === 0 && (
                                <p className="text-center text-slate-400 py-8 text-sm">
                                    {lang === 'es' ? 'No se encontraron resultados' : 'No results found'}
                                </p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
