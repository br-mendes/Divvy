import Link from 'next/link';
import { AlertTriangle, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';
import StaticPageLayout from '../components/layout/StaticPageLayout';

export default function Custom500() {
  return (
    <StaticPageLayout>
      <div className="flex flex-col items-center justify-center px-4 text-center py-16">
        <div className="relative mb-8">
          <div className="absolute -inset-4 bg-red-500/20 blur-xl rounded-full"></div>
          <AlertTriangle size={80} className="text-red-500 relative z-10" />
        </div>

        <h1 className="text-5xl font-display font-black text-gray-900 dark:text-white mb-4 tracking-tight">Erro no servidor</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
          Tivemos um problema ao processar sua solicitação. Tente novamente em alguns instantes.
        </p>

        <Link href="/">
          <Button size="lg" className="shadow-xl shadow-brand-500/20">
            <Home size={20} className="mr-2" />
            Voltar para o Início
          </Button>
        </Link>
      </div>
    </StaticPageLayout>
  );
}
