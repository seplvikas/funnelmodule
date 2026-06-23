import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3010,
    strictPort: true,
    allowedHosts: ['funneldemo.surbhi.net', 'demo.surbhi.net', 'localhost', '127.0.0.1', '10.1.0.4'],
  },
  preview: {
    host: '0.0.0.0',
    port: 3010,
    strictPort: true,
    allowedHosts: ['funneldemo.surbhi.net', 'demo.surbhi.net', 'localhost', '127.0.0.1', '10.1.0.4'],
  },
});
