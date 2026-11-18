import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function apiDevMiddleware(): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const urlPath = req.url.split('?')[0];

        try {
          if (urlPath === '/api/plan') {
            const { default: handler } = await import('./api/plan');
            return handler(req, res);
          }
          if (urlPath === '/api/explain') {
            const { default: handler } = await import('./api/explain');
            return handler(req, res);
          }
          if (urlPath === '/api/chat') {
            const { default: handler } = await import('./api/chat');
            return handler(req, res);
          }
          if (urlPath === '/api/vision') {
            const { default: handler } = await import('./api/vision');
            return handler(req, res);
          }
        } catch (err) {
          console.error('Error in local API handler:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Internal API Server Error', details: (err as Error).message }));
          return;
        }

        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables for local dev server
  const env = loadEnv(mode, process.cwd(), '');
  for (const [key, value] of Object.entries(env)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }

  return {
    plugins: [
      react(),
      apiDevMiddleware(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) {
                return 'vendor-charts';
              }
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              return 'vendor-core';
            }
          },
        },
      },
    },
  };
});
