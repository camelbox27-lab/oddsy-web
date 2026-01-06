import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [react()],
    server: {
        headers: {
            // Console'dan erişimi zorlaştır
            'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseio.com https://*.googleapis.com https://cdn.tailwindcss.com https://fonts.googleapis.com https://fonts.gstatic.com data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseio.com https://*.googleapis.com https://cdn.tailwindcss.com; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; frame-src 'self' https://*.firebaseapp.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;",

            // Site kopyalamayı zorlaştır
            'X-Frame-Options': 'DENY',
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'strict-origin-when-cross-origin',

            // Tarayıcı güvenliği
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
        }
    }
})
