
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase'; // Make sure this import is here
import DivvyLogo from './branding/DivvyLogo';
import { 
  LogOut, 
  LayoutDashboard,
  Settings,
  User,
  Menu,
  X
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signOut, user } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [liveAvatar, setLiveAvatar] = useState<string | null>(null);

  const isActive = (path: string) => router.pathname === path;

  // Prioridade: Apelido > Nome Completo > Email
  const nickname = user?.user_metadata?.nickname;
  const fullName = user?.user_metadata?.full_name;
  const emailName = user?.email?.split('@')[0];
  
  const displayName = nickname || fullName || emailName || 'Usuário';
  const displayEmail = user?.email;

  // Use local state for avatar to ensure we show the latest DB version if available,
  // preventing divergence from the Profile page.
  useEffect(() => {
    let mounted = true;
    const fetchLiveProfile = async () => {
        if (!user) return;
        
        // 1. Start with session metadata as instant fallback
        setLiveAvatar(user.user_metadata?.avatar_url || null);

        // 2. Fetch reliable data from DB
        const { data } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single();
        
        if (mounted && data) {
            setLiveAvatar(data.avatar_url);
        }
    };

    fetchLiveProfile();
    return () => { mounted = false; };
  }, [user]);

  // Use liveAvatar if available, otherwise fall back to metadata or null
  const userAvatar = liveAvatar;
  const userInitial = displayName.charAt(0).toUpperCase();

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar for Desktop / Header for Mobile */}
      <aside className="bg-white border-b md:border-b-0 md:border-r border-gray-200 w-full md:w-64 flex-shrink-0 z-20 relative">
        <div className="p-4 md:p-6 flex flex-row md:flex-col justify-between items-center md:items-stretch h-full">
          
          {/* Header Row (Logo + Mobile Toggle) */}
          <div className="flex items-center justify-between w-full md:flex-col md:items-start md:justify-start gap-4 md:gap-8">
            <Link href="/" className="flex items-center gap-3 px-2">
              <DivvyLogo className="w-8 h-8" />
              <span className="text-xl font-bold text-gray-900">Divvy</span>
            </Link>

            <button 
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={toggleMenu}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Desktop Nav */}
            <nav className="hidden md:flex flex-col w-full gap-1">
              <Link
                href="/dashboard"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/dashboard') 
                    ? 'bg-brand-50 text-brand-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <LayoutDashboard size={20} />
                Dashboard
              </Link>
              <Link
                href="/profile"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/profile') 
                    ? 'bg-brand-50 text-brand-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Settings size={20} />
                Meu Perfil
              </Link>
            </nav>
          </div>

          {/* Desktop User Info & Logout */}
          <div className="hidden md:flex md:flex-col gap-2 md:w-full md:border-t border-gray-100 md:pt-4">
            <Link href="/profile" className="flex items-center gap-3 px-3 py-3 mb-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group">
               <div className="h-8 w-8 rounded-full bg-brand-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-brand-700 font-semibold border border-brand-200">
                  {userAvatar ? (
                    <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    userInitial
                  )}
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-medium text-gray-900 truncate group-hover:text-brand-700">{displayName}</p>
                 <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
               </div>
            </Link>

            <button
              onClick={() => signOut()}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
            >
              <LogOut size={20} />
              Sair
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-lg md:hidden flex flex-col p-4 gap-4 animate-fade-in-down z-50">
             {/* Mobile User Info */}
             <Link href="/profile" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg" onClick={toggleMenu}>
                <div className="h-10 w-10 rounded-full bg-brand-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-brand-700 font-semibold border border-brand-200">
                  {userAvatar ? (
                    <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    userInitial
                  )}
                </div>
                <div>
                   <p className="font-medium text-gray-900">{displayName}</p>
                   <p className="text-xs text-gray-500">Editar Perfil</p>
                </div>
             </Link>

             <nav className="flex flex-col gap-1">
                <Link
                  href="/dashboard"
                  onClick={toggleMenu}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/dashboard') 
                      ? 'bg-brand-50 text-brand-700' 
                      : 'text-gray-600 hover:bg-gray-50'
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
                      ? 'bg-brand-50 text-brand-700' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Settings size={20} />
                  Configurações
                </Link>
             </nav>
             
             <div className="border-t border-gray-100 pt-2">
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full"
                >
                  <LogOut size={20} />
                  Sair
                </button>
             </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-65px)] md:h-screen">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
