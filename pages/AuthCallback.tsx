import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase sometimes puts params in search (query) or hash depending on configuration
      // We check both for the 'code' parameter needed for PKCE flow
      
      // 1. Check React Router search params (after #)
      const searchParams = new URLSearchParams(location.search);
      let code = searchParams.get('code');
      
      // 2. Check Window search params (before #) - typical for OAuth redirects
      if (!code) {
        const windowParams = new URLSearchParams(window.location.search);
        code = windowParams.get('code');
      }

      // 3. Fallback: Parse hash manually if params are inside the hash string
      if (!code && window.location.hash.includes('code=')) {
         const hashParts = window.location.hash.split('?');
         if (hashParts.length > 1) {
            const hashQuery = new URLSearchParams(hashParts[1]);
            code = hashQuery.get('code');
         }
      }

      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          
          // Verify session is active
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
             toast.success('Autenticação verificada com sucesso!');
             navigate('/dashboard');
          } else {
             throw new Error('Sessão não estabelecida');
          }
        } catch (error: any) {
          console.error('Auth callback error:', error);
          toast.error('Erro na verificação: ' + (error.message || 'Desconhecido'));
          navigate('/login');
        }
      } else {
        // No code found. Check if we already have a session (implicit flow or established)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate('/dashboard');
        } else {
          // If accessing callback directly without code, redirect to login
          navigate('/login');
        }
      }
    };

    handleCallback();
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-700">Verificando autenticação...</h2>
      <p className="text-gray-500 mt-2">Aguarde enquanto confirmamos seus dados.</p>
    </div>
  );
};
