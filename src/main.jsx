import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { listenerRegistry, connectionMonitor } from './utils/performanceUtils';

// Production optimizations
if (import.meta.env.PROD) {
    // Keep console.error and console.warn for debugging production issues
    console.log = () => { };
    console.info = () => { };
    console.debug = () => { };
}

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
    if (import.meta.env.DEV) {
        console.error('Uncaught error:', event.error);
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled rejection:', event.reason);
});

// Cleanup all listeners on page unload to prevent memory leaks
window.addEventListener('beforeunload', () => {
    listenerRegistry.unregisterAll();
});

// Handle visibility change - pause/resume operations
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden - could pause expensive operations
    } else {
        // Page is visible again - resume operations
    }
});

// Performance monitoring
if (import.meta.env.DEV) {
    // Log performance metrics in dev
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            if (perfData) {
                console.log('Page load time:', Math.round(perfData.loadEventEnd - perfData.startTime), 'ms');
            }
        }, 0);
    });
}

// Render application
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
