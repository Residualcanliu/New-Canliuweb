import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
 plugins: [react()],
 resolve: { preserveSymlinks: true },
 server: { host:'127.0.0.1' },
 build: { chunkSizeWarningLimit:650, rollupOptions: { input: { personal:'personal.html' }, output: { manualChunks: { three:['three'] } } } }
});
