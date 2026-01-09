import type { Config } from 'tailwindcss';

const config: Config = {
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
        dark: '#1f2121',
        light: '#f5f5f5',
      },
      screens: {
        xs: '320px',
        sm: '375px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
    },
  },
  plugins: [],
};

export default config;