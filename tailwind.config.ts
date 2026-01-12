
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
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
          950: '#030303', // Fundo Absoluto
          900: '#080808', // Camada 1
          800: '#0f0f12', // Cards
          700: '#1a1a1f', // Bordas
          600: '#2d2d35', // Hover
          500: '#71717a', // Texto Mudo
        }
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
      },
      keyframes: {
        glow: {
          '0%': { filter: 'drop-shadow(0 0 2px #8b5cf6)' },
          '100%': { filter: 'drop-shadow(0 0 10px #8b5cf6)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
};

export default config;
