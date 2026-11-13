import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    // Compile-time switch for QA/debug hooks: `false` in production, so every
    // `__DEBUG__ && …` branch (and its strings) is removed from the bundle.
    __DEBUG__: JSON.stringify(mode === 'development' || loadEnv(mode, '.', 'VITE_').VITE_INTRO_DEBUG === '1'),
  },
}));
