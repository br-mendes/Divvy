
import React from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import '../index.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Head>
        <title>Divvy App</title>
        <link rel="icon" href="https://i.ibb.co/qLBKgSVR/favicon.png" />
      </Head>
      <AuthProvider>
        <ThemeProvider>
          <Toaster 
            position="top-right" 
            toastOptions={{
              className: 'dark:bg-gray-800 dark:text-white',
              style: {
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#059669', // Green-600
                },
              },
              error: {
                style: {
                  background: '#dc2626', // Red-600
                },
              },
            }}
          />
          <Component {...pageProps} />
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
