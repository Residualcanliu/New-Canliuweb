import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
 plugins: [react()],
 resolve: { preserveSymlinks: true },
 server: { host:'127.0.0.1', proxy: { '/api': { target:'http://127.0.0.1:8787', changeOrigin:true } } },
 build: { chunkSizeWarningLimit:650, rollupOptions: { input: { personal:'personal.html' } } }
});
