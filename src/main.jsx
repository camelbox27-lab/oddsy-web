import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { listenerRegistry, connectionMonitor } from './utils/performanceUtils';

// Production optimizations
if (import.meta.env.PROD) {
    // Disable verbose console in production (keep error for debugging)
    console.log = () => { };
    console.warn = () => { };
    console.info = () => { };
    console.debug = () => { };

    // Prevent right-click context menu
    document.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
    if (import.meta.env.DEV) {
        console.error('Uncaught error:', event.error);
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    if (import.meta.env.DEV) {
        console.error('Unhandled rejection:', event.reason);
    }
    // Prevent default logging in production
    if (import.meta.env.PROD) {
        event.preventDefault();
    }
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
