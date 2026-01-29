import Link from 'next/link';
import LogoAnimated from '@/components/common/LogoAnimated';
import StaticPageLinks from '@/components/common/StaticPageLinks';
import Button from '@/components/common/Button';

interface StaticPageLayoutProps {
  children: React.ReactNode;
}

export default function StaticPageLayout({ children }: StaticPageLayoutProps) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <LogoAnimated />
          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="outline" size="md">Entrar</Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="primary" size="md">Criar Conta</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12 sm:py-16">{children}</main>

      <footer className="py-12 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <StaticPageLinks className="text-gray-600" />
          <p className="mt-6 text-xs text-gray-400">© 2026 Divvy. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
