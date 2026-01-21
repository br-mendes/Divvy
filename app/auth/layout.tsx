import LogoAnimated from '@/components/common/LogoAnimated';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <LogoAnimated />
        </div>
      </header>
      <div className="flex items-center justify-center px-4 py-20">{children}</div>
    </div>
  );
}
