import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
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
