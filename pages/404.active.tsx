
import Link from 'next/link';
import { Button } from '../components/ui/Button';
import { Home, Map } from 'lucide-react';

export default function Custom404() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-dark-950 px-4 text-center">
      <div className="relative mb-8">
        <div className="absolute -inset-4 bg-brand-500/20 blur-xl rounded-full"></div>
        <Map size={80} className="text-brand-600 dark:text-brand-400 relative z-10" />
      </div>
      
      <h1 className="text-6xl font-black text-gray-900 dark:text-white mb-4 tracking-tighter">404</h1>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Página não encontrada</h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
        Ops! Parece que você se perdeu nas contas. A página que você está procurando não existe ou foi movida.
      </p>
      
      <Link href="/">
        <Button size="lg" className="shadow-xl shadow-brand-500/20">
          <Home size={20} className="mr-2" />
          Voltar para o Início
        </Button>
      </Link>
    </div>
  );
}
