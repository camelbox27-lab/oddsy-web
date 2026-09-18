import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { createServer } from 'node:http'

function apiDevPlugin() {
    return {
        name: 'api-dev',
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                if (!req.url.startsWith('/api/')) return next();
                try {
                    const name = req.url.split('/api/')[1].split('?')[0];
                    const mod = await import(`./api/${name}.js?t=${Date.now()}`);
                    const handler = mod.default;
                    const chunks = [];
                    req.on('data', c => chunks.push(c));
                    req.on('end', async () => {
                        if (chunks.length) req.body = JSON.parse(Buffer.concat(chunks).toString());
                        const mockRes = {
                            _status: 200, _headers: {}, _body: '',
                            status(c) { this._status = c; return this; },
                            setHeader(k, v) { this._headers[k] = v; return this; },
                            json(d) { this._body = JSON.stringify(d); this._done = true; },
                            send(d) { this._body = d; this._done = true; },
                            end(d) { if (d) this._body = d; this._done = true; },
                        };
                        await handler(req, mockRes);
                        res.writeHead(mockRes._status, { 'Content-Type': 'application/json', ...mockRes._headers });
                        res.end(mockRes._body);
                    });
                } catch (e) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
        }
    };
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), apiDevPlugin()],
    server: {
        port: 5173,
        host: true
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
        minify: 'esbuild',
        rollupOptions: {
            external: ['@capacitor/app', '@capacitor/push-notifications', '@capacitor/core'],
            output: {
                manualChunks: {
                    'vendor': ['react', 'react-dom'],
                    'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/database'],
                    'ui': ['lucide-react', 'sweetalert2']
                },
                chunkFileNames: 'assets/js/[name]-[hash].js',
                entryFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
            }
        },
        chunkSizeWarningLimit: 1000,
        cssCodeSplit: true,
        assetsInlineLimit: 4096
    },
    define: {
        'process.env': {}
    },
    resolve: {
        alias: {
            '@': '/src'
        }
    },
    optimizeDeps: {
        include: ['react', 'react-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore']
    }
})
