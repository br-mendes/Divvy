import Link from 'next/link';

export const metadata = {
  title: 'Resetar senha - Divvy',
};

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Resetar senha</h1>
          <p className="text-sm text-gray-600 mt-2">
            Esta página foi restaurada como stub para corrigir o build. Você pode reimplementar o fluxo de reset depois.
          </p>

          <div className="mt-6 flex gap-3">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-md bg-black text-white px-4 py-2 text-sm hover:opacity-90"
            >
              Ir para login
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Voltar
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
