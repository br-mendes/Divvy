import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Divvy – Divida Despesas de Forma Justa',
  description:
    'Aplicativo web para dividir despesas compartilhadas entre grupos. Sem confusão, sem atritos.',
  keywords: 'dividir despesas, grupos, transações, viagens, república',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Toaster position="bottom-right" />
        {children}
      </body>
    </html>
  );
}
