
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class', // Habilita o modo escuro via classe CSS 'dark'
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8b5cf6',
        'primary-hover': '#7c3aed',
        'primary-active': '#6d28d9',
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        dark: {
          bg: '#111827',     // gray-900
          card: '#1f2937',   // gray-800
          border: '#374151', // gray-700
          text: '#f9fafb',   // gray-50
          muted: '#9ca3af',  // gray-400
        },
        light: '#f5f5f5',
      },
      screens: {
        xs: '320px',
        sm: '375px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
      animation: {
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
        'bounce-delay-1': 'bounce 1s infinite 200ms',
        'bounce-delay-2': 'bounce 1s infinite 400ms',
        'bounce-delay-3': 'bounce 1s infinite 600ms',
        'float': 'float 3s ease-in-out infinite',
        'draw-circle': 'draw-circle 0.5s ease-out forwards',
        'draw-check': 'draw-check 0.5s ease-out 0.5s forwards',
        'slide-in': 'slide-in 0.5s ease-out forwards',
        'fade-in-down': 'fade-in-down 0.5s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'draw-circle': {
          '0%': { strokeDasharray: '0, 100' },
          '100%': { strokeDasharray: '100, 100' },
        },
        'draw-check': {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        'slide-in': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
