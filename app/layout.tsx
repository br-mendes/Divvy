import '../index.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Divvy',
  description: 'Divvy dashboard',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
