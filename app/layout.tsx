import '../index.css';

export const metadata = {
  title: 'Divvy',
  description: 'Divvy app dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
