'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Button from '@/components/common/Button';
import LogoAnimated from '@/components/common/LogoAnimated';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <LogoAnimated />
          <div className="flex gap-3">
            {user ? (
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login"><Button variant="outline">Entrar</Button></Link>
                <Link href="/auth/signup"><Button>Criar Conta</Button></Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">

          {/* Left Column: Text */}
          <div className="space-y-6">
            <div className="inline-block bg-purple-100 px-3 py-1 rounded-full text-purple-700 text-sm font-semibold">
               Gestão inteligente de despesas
            </div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight">
              Divida despesas <br/>
              <span className="text-[#6366f1]">sem perder amigos</span>
            </h1>
            <p className="text-xl text-gray-600">
              Viagens, repúblicas ou jantares. O Divvy calcula quem deve quem para que você não precise se preocupar.
            </p>
            <div className="flex gap-4 pt-2">
              <Link href={user ? "/dashboard" : "/auth/signup"}>
                <Button size="lg">{user ? 'Ir para Dashboard' : 'Começar Agora'}</Button>
              </Link>
              <Button variant="outline" size="lg">Saiba Mais</Button>
            </div>
          </div>

          {/* Right Column: Animation Placeholder */}
          <div className="hidden md:flex justify-center">
            {/* 
               AREA DE ANIMAÇÃO SOLICITADA 
               - Transição: Recibo -> Gráfico
            */}
            <div className="relative w-full h-96 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl border-2 border-dashed border-indigo-200 flex flex-col items-center justify-center overflow-hidden">
               <div className="absolute inset-0 flex items-center justify-center opacity-10">
                 <span className="text-9xl"></span>
               </div>

               <div className="z-10 text-center p-6 bg-white/80 rounded-xl backdrop-blur-md shadow-lg transform hover:scale-105 transition duration-500">
                 <div className="text-5xl mb-2 animate-bounce"> ⟳ </div>
                 <p className="font-bold text-indigo-600">Processando Divisão...</p>
                 <p className="text-xs text-gray-500 mt-1">Animação: Recibo rasgando virando gráfico</p>
               </div>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER SIMPLE */}
      <footer className="bg-gray-900 text-white py-8 text-center mt-20">
        <p>© 2026 Divvy. Todos os direitos reservados.</p>
      </footer>

    </div>
  );
}
