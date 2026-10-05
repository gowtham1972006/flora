import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // ── Fix: pin to port 3000 so window.location.origin === 'http://localhost:3000'
      // This ensures the OAuth redirectTo sent to Supabase is always
      // http://localhost:3000/auth/callback — matching the Supabase Redirect URLs
      // allowlist entry.  Without this, Vite defaults to 5173 and Supabase
      // rejects the redirect, falling back to the production Site URL.
      port: 3000,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
