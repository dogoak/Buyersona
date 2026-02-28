import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { User, Globe, Save, Loader2, CheckCircle, Trash2, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
    const { user, signOut } = useAuth();
    const [fullName, setFullName] = useState('');
    const [language, setLanguage] = useState('es');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('profiles')
            .select('full_name, preferred_language')
            .eq('id', user.id)
            .single();

        if (data) {
            setFullName(data.full_name || '');
            setLanguage(data.preferred_language || 'es');
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setSaved(false);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    preferred_language: language
                })
                .eq('id', user.id);

            if (error) throw error;
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Error saving profile:', err);
        } finally {
            setSaving(false);
        }
    };

    const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Configuración</h1>
                <p className="text-slate-500 mt-1">Administrá tu perfil y preferencias</p>
            </div>

            {/* Profile Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <User size={20} className="text-indigo-600" />
                    Perfil
                </h2>

                <div className="flex items-start gap-6 mb-6">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="w-16 h-16 rounded-full object-cover ring-4 ring-indigo-50"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold ring-4 ring-indigo-50">
                            {(fullName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                        </div>
                    )}
                    <div className="flex-1">
                        <p className="text-sm text-slate-500 mb-1">Email</p>
                        <p className="text-slate-900 font-medium">{user?.email}</p>
                        <p className="text-xs text-slate-400 mt-1">Conectado con Google</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre completo</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition"
                            placeholder="Tu nombre"
                        />
                    </div>
                </div>
            </div>

            {/* Preferences Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Globe size={20} className="text-indigo-600" />
                    Preferencias
                </h2>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Idioma de los reportes</label>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white transition"
                    >
                        <option value="es">Español</option>
                        <option value="en">English</option>
                    </select>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : saved ? (
                        <CheckCircle size={18} />
                    ) : (
                        <Save size={18} />
                    )}
                    {saved ? 'Guardado' : 'Guardar cambios'}
                </button>
                {saved && (
                    <span className="text-sm text-emerald-600 font-medium animate-fade-in">
                        ✓ Cambios guardados correctamente
                    </span>
                )}
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-2xl border border-red-200 p-6">
                <h2 className="text-lg font-bold text-red-700 mb-2 flex items-center gap-2">
                    <AlertTriangle size={20} />
                    Zona de peligro
                </h2>
                <p className="text-sm text-slate-500 mb-4">
                    Al eliminar tu cuenta se borrarán permanentemente todos tus datos, reportes y pagos.
                </p>

                {!showDeleteConfirm ? (
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition"
                    >
                        <Trash2 size={14} />
                        Eliminar mi cuenta
                    </button>
                ) : (
                    <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                        <p className="text-sm text-red-700 font-medium mb-3">
                            ¿Estás seguro? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-white transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={async () => {
                                    // TODO: Implement account deletion
                                    alert('Funcionalidad de eliminación en desarrollo. Contactá soporte.');
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition"
                            >
                                Sí, eliminar mi cuenta
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
