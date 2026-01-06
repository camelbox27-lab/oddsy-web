import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Console'u production'da devre dışı bırak
if (import.meta.env.PROD) {
    console.log = () => { };
    console.error = () => { };
    console.warn = () => { };
    console.info = () => { };
    console.debug = () => { };

    // Sağ tık engelleme
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U engelleme
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'J') ||
            (e.ctrlKey && e.key === 'U')) {
            e.preventDefault();
        }
    });
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
