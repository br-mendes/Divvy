import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      // Pequeno delay para garantir que o Supabase Client processe o fragmento da URL (#access_token)
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error during auth callback:', error.message);
        toast.error('Erro na autenticação.');
        router.push('/login');
        return;
      }

      // Função helper para redirecionar
      const doRedirect = () => {
        // Verifica se existe um parâmetro 'next' na URL (passado pelo OAuth redirectTo)
        // O Supabase devolve os query params originais no retorno
        const nextParam = new URLSearchParams(window.location.search).get('next') || 
                          new URLSearchParams(window.location.hash.substring(1)).get('next'); // Fallback para hash fragment se necessário

        if (nextParam && nextParam.startsWith('/')) {
            router.push(decodeURIComponent(nextParam));
        } else {
            router.push('/dashboard');
        }
      };

      if (session) {
        // Garantir que o perfil existe
        try {
            const { data: profile } = await supabase.from('userprofiles').select('id').eq('id', session.user.id).maybeSingle();
            
            if (!profile) {
                await supabase.from('userprofiles').insert({
                    id: session.user.id,
                    email: session.user.email,
                    fullname: session.user.user_metadata?.full_name || '',
                    displayname: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuário',
                    createdat: new Date().toISOString(),
                    updatedat: new Date().toISOString()
                });
            }
        } catch (e) {
            console.error("Auto profile creation error", e);
        }

        toast.success('Login realizado com sucesso!');
        doRedirect();
      } else {
        // Se não houver sessão imediatamente, esperamos uma mudança de estado
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            subscription.unsubscribe();
            // Tenta criar o perfil também no listener
            supabase.from('userprofiles').select('id').eq('id', session.user.id).maybeSingle().then(({data: p}) => {
                if (!p) {
                    supabase.from('userprofiles').insert({
                        id: session.user.id,
                        email: session.user.email,
                        fullname: session.user.user_metadata?.full_name || '',
                        displayname: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuário',
                        createdat: new Date().toISOString(),
                        updatedat: new Date().toISOString()
                    });
                }
            });
            
            doRedirect();
          }
        });

        // Timeout de segurança
        const timeout = setTimeout(() => {
          subscription.unsubscribe();
          if (!session) router.push('/login');
        }, 5000);

        return () => {
          clearTimeout(timeout);
          subscription.unsubscribe();
        };
      }
    };

    if (router.isReady) {
      handleCallback();
    }
  }, [router.isReady, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-200 border-t-brand-600 mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-700">Finalizando acesso...</h2>
      <p className="text-gray-500 mt-2">Você será redirecionado em instantes.</p>
    </div>
  );
}