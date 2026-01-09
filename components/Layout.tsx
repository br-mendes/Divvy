import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import DivvyLogo from './branding/DivvyLogo';
import { 
  LogOut, 
  LayoutDashboard,
  Settings 
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signOut, user } = useAuth();
  const router = useRouter();

  const isActive = (path: string) => router.pathname === path;

  // Extrair iniciais ou usar avatar
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const userAvatar = user?.user_metadata?.avatar_url;
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar for Desktop / Header for Mobile */}
      <aside className="bg-white border-b md:border-b-0 md:border-r border-gray-200 w-full md:w-64 flex-shrink-0">
        <div className="p-4 md:p-6 flex flex-row md:flex-col justify-between items-center md:items-stretch h-full">
          <div className="flex flex-row md:flex-col items-center md:items-start w-full gap-4 md:gap-8">
            <Link href="/" className="flex items-center gap-3 px-2">
              <DivvyLogo className="w-8 h-8" />
              <span className="text-xl font-bold text-gray-900">Divvy</span>
            </Link>

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

          <div className="flex md:flex-col gap-2 md:w-full border-t border-gray-100 md:border-none pt-0 md:pt-4">
            <Link href="/profile" className="hidden md:flex items-center gap-3 px-3 py-3 mb-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group">
               <div className="h-8 w-8 rounded-full bg-brand-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-brand-700 font-semibold border border-brand-200">
                  {userAvatar ? (
                    <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    userInitial
                  )}
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-medium text-gray-900 truncate group-hover:text-brand-700">{userName}</p>
                 <p className="text-xs text-gray-500 truncate">{user?.email}</p>
               </div>
            </Link>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
            >
              <LogOut size={20} />
              <span className="hidden md:inline">Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-64px)] md:h-screen">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};