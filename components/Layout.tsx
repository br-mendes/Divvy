
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import DivvyLogo from './branding/DivvyLogo';
import Notifications from './ui/Notifications';
import StaticPageLinks from './common/StaticPageLinks';
import { 
  LogOut, 
  LayoutDashboard,
  Settings,
  Menu,
  X,
  Moon,
  Sun,
  User,
  Bell,
  ShieldCheck
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signOut, user, session } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [liveProfile, setLiveProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    let mounted = true;
    const fetchLiveProfile = async () => {
        if (!user || !session?.access_token) return;
        
        // Set initial from metadata to avoid flicker
        if (mounted) {
            setLiveProfile({ 
                avatarurl: user.user_metadata?.avatar_url, 
                fullname: user.user_metadata?.full_name 
            });
        }
        
        try {
            // Fetch fresh data from secure API to avoid RLS recursion
            const res = await fetch('/api/user/me', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            
            if (res.ok) {
                const data = await res.json();
                if (mounted && data) {
                    setLiveProfile(data);
                    if (data.is_super_admin || user.email === 'falecomdivvy@gmail.com') {
                        setIsAdmin(true);
                    }
                }
            }
        } catch (e) {
            console.error("Layout profile fetch error", e);
        }
        
        // Fallback admin check
        if (user.email === 'falecomdivvy@gmail.com' && mounted) {
            setIsAdmin(true);
        }
    };
    fetchLiveProfile();
    return () => { mounted = false; };
  }, [user, session]);

  const displayName = liveProfile?.displayname || liveProfile?.fullname || user?.email?.split('@')[0] || 'Usuário';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 transition-colors duration-300 flex flex-col md:flex-row overflow-hidden">
      
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-dark-900 border-r border-gray-200 dark:border-dark-700 flex-shrink-0">
        <div className="p-6 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <DivvyLogo className="w-8 h-8" />
            <span className="text-xl font-bold dark:text-white">Divvy</span>
          </Link>
          <Notifications />
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <Link href="/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/dashboard') ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}>
            <LayoutDashboard size={20} /> <span className="font-medium">Dashboard</span>
          </Link>
          <Link href="/profile" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/profile') ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}>
            <User size={20} /> <span className="font-medium">Meu Perfil</span>
          </Link>
          
          {isAdmin && (
            <Link href="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/admin') ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}>
                <ShieldCheck size={20} /> <span className="font-medium">Admin</span>
            </Link>
          )}
        </nav>

        <div className="p-4 mt-auto border-t border-gray-100 dark:border-dark-700">
          <button onClick={toggleTheme} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800 transition-all">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            <span className="font-medium">{theme === 'light' ? 'Escuro' : 'Claro'}</span>
          </button>
          <button onClick={() => signOut()} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all mt-1">
            <LogOut size={20} /> <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Header Mobile */}
      <header className="md:hidden flex items-center justify-between px-4 h-16 bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-700 sticky top-0 z-50">
        <Link href="/dashboard" className="flex items-center gap-2">
          <DivvyLogo className="w-6 h-6" />
          <span className="font-bold">Divvy</span>
        </Link>
        <div className="flex items-center gap-3">
          <Notifications />
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-gray-50 dark:bg-dark-800 rounded-lg text-gray-600 dark:text-gray-300">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Menu Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white dark:bg-dark-950 md:hidden animate-fade-in-down">
          <div className="flex flex-col h-full pt-20 px-6 gap-2">
            <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-4 p-4 rounded-2xl text-lg font-bold ${isActive('/dashboard') ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600' : 'text-gray-600 dark:text-gray-400'}`}>
               <LayoutDashboard size={24} /> Dashboard
            </Link>
            <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-4 p-4 rounded-2xl text-lg font-bold ${isActive('/profile') ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600' : 'text-gray-600 dark:text-gray-400'}`}>
               <User size={24} /> Perfil
            </Link>
            {isAdmin && (
                <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-4 p-4 rounded-2xl text-lg font-bold ${isActive('/admin') ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600' : 'text-gray-600 dark:text-gray-400'}`}>
                    <ShieldCheck size={24} /> Painel Admin
                </Link>
            )}
            <button onClick={toggleTheme} className="flex items-center gap-4 p-4 rounded-2xl text-lg font-bold text-gray-600 dark:text-gray-400">
               {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />} Tema {theme === 'light' ? 'Escuro' : 'Claro'}
            </button>
            <button onClick={() => { signOut(); setIsMobileMenuOpen(false); }} className="flex items-center gap-4 p-4 rounded-2xl text-lg font-bold text-red-500 mt-auto mb-10">
               <LogOut size={24} /> Sair da conta
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-dark-950 transition-colors duration-300 scroll-smooth">
        <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-10">
          {children}
          <footer className="mt-12 border-t border-gray-200 dark:border-dark-800 pt-6">
            <StaticPageLinks
              className="text-sm text-gray-500 dark:text-gray-400"
              linkClassName="hover:text-brand-600 dark:hover:text-brand-400"
            />
            <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">© 2026 Divvy. Todos os direitos reservados.</p>
          </footer>
        </div>
      </main>
    </div>
  );
};
