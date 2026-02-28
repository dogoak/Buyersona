import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
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
                        <Shield size={24} className="text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900">Política de Privacidad</h1>
                        <p className="text-slate-400 text-sm">Última actualización: Febrero 2026</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 prose prose-slate max-w-none">
                    <h2>1. Información que Recopilamos</h2>
                    <p>
                        En <strong>BUYERSONA</strong> recopilamos la siguiente información cuando utilizás nuestros servicios:
                    </p>
                    <ul>
                        <li><strong>Datos de cuenta:</strong> nombre, dirección de correo electrónico y foto de perfil proporcionados a través de Google OAuth.</li>
                        <li><strong>Datos de negocio:</strong> la información que proporcionás durante el onboarding sobre tu empresa, productos, canales de venta y estrategia comercial.</li>
                        <li><strong>Datos de pago:</strong> procesados de forma segura a través de MercadoPago. No almacenamos datos de tarjetas de crédito.</li>
                        <li><strong>Datos de uso:</strong> información sobre cómo interactuás con la plataforma para mejorar nuestros servicios.</li>
                    </ul>

                    <h2>2. Cómo Usamos tu Información</h2>
                    <p>Utilizamos los datos recopilados para:</p>
                    <ul>
                        <li>Generar informes estratégicos personalizados mediante inteligencia artificial.</li>
                        <li>Procesar pagos y mantener tu cuenta.</li>
                        <li>Mejorar la calidad de nuestros análisis y servicios.</li>
                        <li>Comunicarnos contigo sobre tu cuenta o actualizaciones del servicio.</li>
                    </ul>

                    <h2>3. Inteligencia Artificial</h2>
                    <p>
                        Utilizamos modelos de IA (Google Gemini) para procesar la información de tu negocio y generar análisis estratégicos.
                        Los datos que proporcionás son enviados a estos servicios de IA exclusivamente para generar tu informe.
                        No utilizamos tus datos para entrenar modelos de IA de terceros.
                    </p>

                    <h2>4. Compartir Información</h2>
                    <p>No vendemos ni compartimos tu información personal con terceros, excepto:</p>
                    <ul>
                        <li><strong>Proveedores de servicio:</strong> MercadoPago (pagos), Google Cloud (IA), Supabase (infraestructura).</li>
                        <li><strong>Requerimientos legales:</strong> cuando sea necesario para cumplir con obligaciones legales.</li>
                    </ul>

                    <h2>5. Seguridad</h2>
                    <p>
                        Implementamos medidas de seguridad estándar de la industria, incluyendo encriptación en tránsito (HTTPS),
                        autenticación segura (OAuth 2.0) y políticas de acceso a nivel de fila (RLS) en nuestra base de datos.
                    </p>

                    <h2>6. Tus Derechos</h2>
                    <p>Tenés derecho a:</p>
                    <ul>
                        <li>Acceder a tus datos personales.</li>
                        <li>Solicitar la corrección de datos inexactos.</li>
                        <li>Solicitar la eliminación de tu cuenta y datos asociados.</li>
                        <li>Exportar tus datos en formato legible.</li>
                    </ul>

                    <h2>7. Retención de Datos</h2>
                    <p>
                        Conservamos tus datos mientras tu cuenta esté activa. Si solicitás la eliminación de tu cuenta,
                        eliminaremos tus datos personales dentro de los 30 días siguientes a la solicitud.
                    </p>

                    <h2>8. Contacto</h2>
                    <p>
                        Para consultas sobre privacidad, podés contactarnos en: <strong>soporte@buyersona.com</strong>
                    </p>
                </div>
            </div>
        </div>
    );
}
