import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Essential for GitHub Pages to resolve assets correctly
  build: {
    sourcemap: false, // Matches productionBrowserSourceMaps: false
  },
  optimizeDeps: {
    include: ['@supabase/supabase-js'], // Pre-bundle Supabase client
  },
});
