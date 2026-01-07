import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [react()],
    server: {
        headers: {
            'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseio.com https://*.firebasedatabase.app https://*.googleapis.com https://cdn.tailwindcss.com https://fonts.googleapis.com https://fonts.gstatic.com data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseio.com https://*.firebasedatabase.app https://*.googleapis.com https://cdn.tailwindcss.com; connect-src 'self' https://*.firebaseio.com https://*.firebasedatabase.app https://*.googleapis.com wss://*.firebaseio.com wss://*.firebasedatabase.app https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; frame-src 'self' https://*.firebaseapp.com; img-src 'self' data: https: blob:; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com;",
            'X-Frame-Options': 'DENY',
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
        },
        proxy: {
            '/api/firebase': {
                target: 'https://oddsy-778d7-default-rtdb.europe-west1.firebasedatabase.app',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/firebase/, '')
            }
        }
    }
})
