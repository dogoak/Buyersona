import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Language } from '../types';
import {
    LogOut, User, FileText, Settings, CreditCard, ChevronDown,
    Globe, BarChart3, Plus
} from 'lucide-react';
import { Isotype, FullLogo } from './BrandAssets';

interface AppHeaderProps {
    lang: Language;
    setLang: (l: Language) => void;
}

export default function AppHeader({ lang, setLang }: AppHeaderProps) {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Don't show on landing page (it has its own navbar)
    if (location.pathname === '/') return null;
    // Don't show on login page
    if (location.pathname === '/login') return null;

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const menuItems = [
        { label: 'Mis Reportes', icon: FileText, path: '/dashboard' },
        { label: 'Nuevo Análisis', icon: Plus, path: '/onboarding' },
        { label: 'Facturación', icon: CreditCard, path: '/dashboard/billing' },
        { label: 'Configuración', icon: Settings, path: '/dashboard/settings' },
    ];

    const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
    const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'Usuario';
    const userInitial = (userName?.[0] || 'U').toUpperCase();

    return (
        <nav className="px-4 sm:px-6 py-3 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
            {/* Left: Logo */}
            <button
                onClick={() => navigate(user ? '/dashboard' : '/')}
                className="flex items-center gap-2 hover:opacity-80 transition"
            >
                <Isotype className="h-7 w-7 text-slate-900 sm:hidden" />
                <FullLogo className="h-7 w-auto text-slate-900 hidden sm:block" />
            </button>

            {/* Right: User Actions */}
            <div className="flex items-center gap-2">
                {/* Language Switcher */}
                <button
                    onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
                    className="flex items-center text-slate-500 hover:text-indigo-600 transition text-sm font-semibold p-2 rounded-lg hover:bg-slate-50"
                    aria-label="Switch Language"
                >
                    <Globe size={16} className="mr-1" />
                    <span className="text-xs">{lang === 'en' ? 'ES' : 'EN'}</span>
                </button>

                {user ? (
                    /* Logged in: Avatar + Dropdown */
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
                        >
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={userName}
                                    className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-100"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-indigo-100">
                                    {userInitial}
                                </div>
                            )}
                            <span className="text-sm font-medium text-slate-700 hidden md:block max-w-[120px] truncate">
                                {userName.split(' ')[0]}
                            </span>
                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in-up z-50">
                                {/* User Info */}
                                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                                    <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>
                                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                </div>

                                {/* Menu Items */}
                                <div className="py-1">
                                    {menuItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = location.pathname === item.path;
                                        return (
                                            <button
                                                key={item.path}
                                                onClick={() => {
                                                    navigate(item.path);
                                                    setDropdownOpen(false);
                                                }}
                                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isActive
                                                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                    }`}
                                            >
                                                <Icon size={16} />
                                                {item.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Sign Out */}
                                <div className="border-t border-slate-100 py-1">
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut size={16} />
                                        Cerrar Sesión
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Not logged in */
                    <button
                        onClick={() => navigate('/login')}
                        className="text-sm font-semibold text-slate-600 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition"
                    >
                        Iniciar Sesión
                    </button>
                )}
            </div>
        </nav>
    );
}
