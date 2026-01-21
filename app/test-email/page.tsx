"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { sendConfirmationEmail } from '@/lib/email';
import { getURL } from '@/lib/getURL';
import { Button } from '@/components/ui/Button';
import DivvyLogo from '@/components/branding/DivvyLogo';

export default function TestEmail() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTestEmail = async () => {
    setLoading(true);
    setResult(null);

    try {
      const testEmail = 'brunoafonso.mendes@gmail.com';
      const testLink = `${getURL()}/auth/callback?test=true`;

      console.log('Testing email sending to:', testEmail);

      const response = await sendConfirmationEmail(testEmail, testLink);

      setResult({
        success: true,
        message: 'Email de teste enviado com sucesso!',
        details: {
          to: testEmail,
          timestamp: new Date().toISOString(),
          link: testLink,
          providerResponse: response,
        },
      });
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex flex-col items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-lg bg-white dark:bg-dark-900 p-8 rounded-lg shadow-md border border-gray-200 dark:border-dark-800">
        <div className="flex items-center gap-3 mb-6">
          <DivvyLogo className="w-10 h-10" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teste de Integração de Email</h1>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Esta página valida a integração com o Resend.
        </p>

        <div className="bg-gray-100 dark:bg-dark-800 p-4 rounded-md mb-6 font-mono text-sm border border-gray-200 dark:border-dark-700 text-gray-800 dark:text-gray-200">
          <p className="mb-1"><span className="text-gray-500">Para:</span> brunoafonso.mendes@gmail.com</p>
          <p><span className="text-gray-500">Link:</span> {getURL()}/auth/callback?test=true</p>
        </div>

        <Button
          onClick={handleTestEmail}
          isLoading={loading}
          disabled={loading}
          fullWidth
        >
          Enviar Email de Teste
        </Button>

        {result && (
          <div className={`mt-6 p-4 rounded-md border ${result.success ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'}`}>
            <h3 className="font-bold flex items-center gap-2">
              {result.success ? '✅ Sucesso' : '❌ Erro'}
            </h3>
            <p className="mt-1 mb-2">{result.message || result.error}</p>
            {result.success && (
              <pre className="text-xs overflow-auto p-2 bg-white/50 dark:bg-black/20 rounded border border-green-100 dark:border-green-900">
                {JSON.stringify(result.details, null, 2)}
              </pre>
            )}
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-gray-100 dark:border-dark-800 text-center">
          <Link href="/" className="text-brand-600 dark:text-brand-400 hover:underline text-sm">Voltar para Home</Link>
        </div>
      </div>
    </div>
  );
}
