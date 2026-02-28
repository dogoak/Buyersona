import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsOfService() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition mb-8 text-sm font-medium"
                >
                    <ArrowLeft size={16} /> Volver
                </button>

                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <FileText size={24} className="text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900">Términos y Condiciones</h1>
                        <p className="text-slate-400 text-sm">Última actualización: Febrero 2026</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 prose prose-slate max-w-none">
                    <h2>1. Aceptación de los Términos</h2>
                    <p>
                        Al acceder y utilizar <strong>BUYERSONA</strong> (en adelante, "la Plataforma"), aceptás estos
                        Términos y Condiciones en su totalidad. Si no estás de acuerdo, no utilices la Plataforma.
                    </p>

                    <h2>2. Descripción del Servicio</h2>
                    <p>
                        BUYERSONA es una plataforma de análisis estratégico impulsada por inteligencia artificial que genera
                        informes personalizados sobre tu negocio, incluyendo buyer personas, análisis competitivo,
                        canales de adquisición y planes de acción.
                    </p>

                    <h2>3. Registro y Cuenta</h2>
                    <ul>
                        <li>Para usar la Plataforma, debés registrarte mediante Google OAuth.</li>
                        <li>Sos responsable de mantener la seguridad de tu cuenta.</li>
                        <li>Debés proporcionar información veraz y actualizada sobre tu negocio.</li>
                    </ul>

                    <h2>4. Pagos y Reembolsos</h2>
                    <ul>
                        <li>Los análisis tienen un precio indicado al momento de la compra.</li>
                        <li>Los pagos se procesan a través de MercadoPago de forma segura.</li>
                        <li>Cada pago corresponde a un informe específico (pago único, sin suscripción).</li>
                        <li>Debido a la naturaleza digital e inmediata del servicio, no se ofrecen reembolsos una vez generado el informe.</li>
                        <li>Si el informe no se genera correctamente por un error técnico, podés solicitar un nuevo análisis sin costo adicional.</li>
                    </ul>

                    <h2>5. Uso Aceptable</h2>
                    <p>Te comprometés a:</p>
                    <ul>
                        <li>Usar la Plataforma únicamente para fines comerciales legítimos.</li>
                        <li>No intentar vulnerar la seguridad de la Plataforma.</li>
                        <li>No reproducir, distribuir o revender los análisis generados como un servicio independiente.</li>
                        <li>No usar la Plataforma para actividades ilegales o fraudulentas.</li>
                    </ul>

                    <h2>6. Propiedad Intelectual</h2>
                    <ul>
                        <li>Los informes generados son de tu propiedad. Podés usarlos, compartirlos y distribuirlos libremente.</li>
                        <li>La Plataforma, su diseño, código y marca son propiedad de BUYERSONA.</li>
                        <li>Los datos que proporcionás sobre tu negocio son y seguirán siendo de tu propiedad.</li>
                    </ul>

                    <h2>7. Limitación de Responsabilidad</h2>
                    <p>
                        Los análisis generados por la Plataforma son orientativos y se basan en la información proporcionada
                        y en modelos de inteligencia artificial. <strong>No constituyen asesoramiento profesional</strong> y
                        no garantizamos resultados comerciales específicos. Las decisiones de negocio basadas en nuestros
                        informes son responsabilidad exclusiva del usuario.
                    </p>

                    <h2>8. Disponibilidad del Servicio</h2>
                    <p>
                        Nos esforzamos por mantener la Plataforma disponible, pero no garantizamos disponibilidad
                        ininterrumpida. Podemos realizar mantenimientos programados o de emergencia sin previo aviso.
                    </p>

                    <h2>9. Modificaciones</h2>
                    <p>
                        Nos reservamos el derecho de modificar estos Términos. Los cambios serán comunicados a través
                        de la Plataforma y entrarán en vigencia desde su publicación.
                    </p>

                    <h2>10. Contacto</h2>
                    <p>
                        Para consultas sobre estos términos: <strong>soporte@buyersona.com</strong>
                    </p>
                </div>
            </div>
        </div>
    );
}
