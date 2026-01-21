import React from 'react';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { SpeedInsights } from '@vercel/speed-insights/react';
import '../index.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Component {...pageProps} />
      <SpeedInsights />
    </AuthProvider>
  );
}