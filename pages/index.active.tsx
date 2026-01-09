import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import DivvyLogo from '../components/branding/DivvyLogo';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AnimatedTagline from '../components/home/AnimatedTagline';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <DivvyLogo className="w-8 h-8" animated={false} />
            <span className="text-2xl font-bold text-gray-900">Divvy</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard">
                <Button variant="primary">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline">Entrar</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary">Criar Conta</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
          <AnimatedTagline />
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Divida gastos com amigos e família de forma justa e automática.
        </p>
        <Link href={user ? '/dashboard' : '/signup'}>
          <Button variant="primary" size="lg">Começar Agora</Button>
        </Link>
      </section>
    </div>
  );
}