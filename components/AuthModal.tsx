import React, { useState } from 'react';
import { translations } from '../utils/translations';
import { Language } from '../types';
import { X, Mail, Lock, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  lang: Language;
  mode: 'login' | 'register';
  onClose: () => void;
  onSuccess: () => void;
  onSwitchMode: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ lang, mode, onClose, onSuccess, onSwitchMode }) => {
  const t = translations[lang].auth;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => {
        onSuccess();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative animate-fade-in-up">
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
        >
            <X size={24} />
        </button>

        <div className="p-8">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    {mode === 'login' ? t.login_title : t.register_title}
                </h2>
                <p className="text-sm text-indigo-600 bg-indigo-50 inline-block px-3 py-1 rounded-full font-medium">
                    {t.mock_notice}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.email}</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="email" 
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.password}</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="password" 
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <button 
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 flex items-center justify-center"
                >
                    {mode === 'login' ? t.submit_login : t.submit_register}
                    <ArrowRight size={18} className="ml-2" />
                </button>
            </form>

            <div className="mt-6 text-center">
                <button 
                    onClick={onSwitchMode}
                    className="text-sm text-slate-500 hover:text-indigo-600 font-medium transition"
                >
                    {mode === 'login' ? t.switch_to_register : t.switch_to_login}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};