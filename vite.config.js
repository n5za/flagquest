import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 4096,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules\/(react|react-dom)\// },
            { name: 'supabase', test: /node_modules\/@supabase\// },
            { name: 'icons', test: /node_modules\/lucide-react\// },
            { name: 'vendor', test: /node_modules\// },
          ],
        },
      },
    },
  },
});
