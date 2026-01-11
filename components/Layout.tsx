
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import DivvyLogo from './branding/DivvyLogo';
import Notifications from './ui/Notifications';
import { 
  LogOut, 
  LayoutDashboard,
  Settings,
  User,
  Menu,
  X,
  Moon,
  Sun
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Local state for live profile data
  const [liveProfile, setLiveProfile] = useState<{
      avatar_url?: string | null;
      full_name?: string | null;
      nickname?: string | null;
  } | null>(null);

  const isActive = (path: string) => router.pathname === path;

  useEffect(() => {
    let mounted = true;
    const fetchLiveProfile = async () => {
        if (!user) return;
        
        // 1. Initial fallback from session
        setLiveProfile({
            avatar_url: user.user_metadata?.avatar_url,
            full_name: user.user_metadata?.full_name,
            nickname: user.user_metadata?.nickname
        });

        // 2. Fetch authoritative data from DB
        const { data } = await supabase
            .from('profiles')
            .select('avatar_url, full_name, nickname')
            .eq('id', user.id)
            .single();
        
        if (mounted && data) {
            setLiveProfile(data);
        }
    };

    fetchLiveProfile();
    return () => { mounted = false; };
  }, [user]);

  const getDisplayName = () => {
      if (liveProfile?.nickname) return liveProfile.nickname;
      if (liveProfile?.full_name) return liveProfile.full_name;
      if (user?.user_metadata?.nickname) return user.user_metadata.nickname;
      if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
      return user?.email?.split('@')[0] || 'Usuário';
  };

  const displayName = getDisplayName();
  const displayEmail = user?.email;
  const userAvatar = liveProfile?.avatar_url || user?.user_metadata?.avatar_url;
  const userInitial = displayName.charAt(0).toUpperCase();

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex flex-col md:flex-row">
      {/* Sidebar for Desktop / Header for Mobile */}
      <aside className="bg-white dark:bg-gray-800 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 w-full md:w-64 flex-shrink-0 z-20 relative transition-colors duration-200">
        <div className="p-4 md:p-6 flex flex-row md:flex-col justify-between items-center md:items-stretch h-full">
          
          {/* Header Row (Logo + Mobile Toggle) */}
          <div className="flex items-center justify-between w-full md:flex-col md:items-start md:justify-start gap-4 md:gap-8">
            <Link href="/" className="flex items-center gap-3 px-2">
              <DivvyLogo className="w-8 h-8" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Divvy</span>
            </Link>

            <div className="flex items-center gap-2 md:hidden">
              <Notifications />
              <button 
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                onClick={toggleMenu}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex flex-col w-full gap-1">
              <Link
                href="/dashboard"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/dashboard') 
                    ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <LayoutDashboard size={20} />
                Dashboard
              </Link>
              <Link
                href="/profile"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/profile') 
                    ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Settings size={20} />
                Meu Perfil
              </Link>
            </nav>
          </div>

          {/* Desktop User Info & Logout */}
          <div className="hidden md:flex md:flex-col gap-2 md:w-full md:border-t border-gray-100 dark:border-gray-700 md:pt-4">
             {/* Toggle Theme Desktop */}
             <button
                onClick={toggleTheme}
                className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full"
             >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
             </button>

             {/* Desktop Notification bell */}
            <div className="px-3 mb-2 flex justify-between items-center">
               <span className="text-xs font-semibold text-gray-400 uppercase">Notificações</span>
               <Notifications />
            </div>

            <Link href="/profile" className="flex items-center gap-3 px-3 py-3 mb-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer group">
               <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-900 flex-shrink-0 overflow-hidden flex items-center justify-center text-brand-700 dark:text-brand-300 font-semibold border border-brand-200 dark:border-brand-700">
                  {userAvatar ? (
                    <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    userInitial
                  )}
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-brand-700 dark:group-hover:text-brand-400">{displayName}</p>
                 <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{displayEmail}</p>
               </div>
            </Link>

            <button
              onClick={() => signOut()}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors w-full"
            >
              <LogOut size={20} />
              Sair
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-lg md:hidden flex flex-col p-4 gap-4 animate-fade-in-down z-50">
             {/* Mobile User Info */}
             <Link href="/profile" className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg" onClick={toggleMenu}>
                <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900 flex-shrink-0 overflow-hidden flex items-center justify-center text-brand-700 dark:text-brand-300 font-semibold border border-brand-200 dark:border-brand-700">
                  {userAvatar ? (
                    <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    userInitial
                  )}
                </div>
                <div>
                   <p className="font-medium text-gray-900 dark:text-gray-100">{displayName}</p>
                   <p className="text-xs text-gray-500 dark:text-gray-400">Editar Perfil</p>
                </div>
             </Link>

             <nav className="flex flex-col gap-1">
                <Link
                  href="/dashboard"
                  onClick={toggleMenu}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/dashboard') 
                      ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <LayoutDashboard size={20} />
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  onClick={toggleMenu}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/profile') 
                      ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Settings size={20} />
                  Configurações
                </Link>
                
                <button
                    onClick={() => { toggleTheme(); toggleMenu(); }}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full text-left"
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
                </button>
             </nav>
             
             <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
                >
                  <LogOut size={20} />
                  Sair
                </button>
             </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-65px)] md:h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
