'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthDebuggerProps {
  children: React.ReactNode;
}

export default function AuthDebugger({ children }: AuthDebuggerProps) {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<string>('Checking...');
  const [lastEvent, setLastEvent] = useState<string>('None');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data: { session } } = await fetch('/api/auth/session').then(r => r.json());
        setAuthStatus(session ? `Authenticated as ${session.user?.email}` : 'Not authenticated');
        setLastEvent('Initial check');
      } catch (error) {
        setAuthStatus(`Error: ${error}`);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, [router]);

  if (process.env.NODE_ENV === 'production') {
    return <>{children}</>;
  }

  return (
    <div>
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 p-2 rounded text-xs max-w-xs z-50">
          <div>Auth: {authStatus}</div>
          <div>Last Event: {lastEvent}</div>
        </div>
      )}
      {children}
    </div>
  );
}