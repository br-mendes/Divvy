
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
        router.push('/dashboard');
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
            
            router.push('/dashboard');
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
