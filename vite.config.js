import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function apiDevMiddleware() {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url.split('?')[0];
        if (!url.startsWith('/api/')) {
          return next();
        }

        // Map URL to module
        const routeMap = {
          '/api/auth/login': './api/auth/login.js',
          '/api/auth/logout': './api/auth/logout.js',
          '/api/auth/session': './api/auth/session.js',
          '/api/admin/upload': './api/admin/upload.js',
          '/api/admin/mutate': './api/admin/mutate.js'
        };

        const modulePath = routeMap[url];
        if (!modulePath) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: `Not found: ${url}` }));
          return;
        }

        // Collect body chunks
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        const rawBody = Buffer.concat(chunks).toString();
        let body = {};
        if (rawBody) {
          try {
            body = JSON.parse(rawBody);
          } catch {
            body = rawBody;
          }
        }
        req.body = body;

        // Enhance response with express-like methods
        res.status = function (code) {
          res.statusCode = code;
          return res;
        };
        res.json = function (data) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return res;
        };

        try {
          const mod = await server.ssrLoadModule(modulePath);
          await mod.default(req, res);
        } catch (err) {
          console.error('API middleware error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  // Populate process.env for api handlers during dev
  Object.assign(process.env, env);

  return {
    plugins: [react(), apiDevMiddleware()]
  };
});
