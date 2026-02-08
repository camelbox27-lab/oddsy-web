// Listener registry for managing event listener cleanup
export const listenerRegistry = {
    _listeners: new Map(),

    register(key, unsubscribe) {
        // Unregister existing listener with same key first
        if (this._listeners.has(key)) {
            this.unregister(key);
        }
        this._listeners.set(key, unsubscribe);
    },

    unregister(key) {
        const unsub = this._listeners.get(key);
        if (unsub && typeof unsub === 'function') {
            unsub();
        }
        this._listeners.delete(key);
    },

    unregisterAll() {
        this._listeners.forEach((unsub) => {
            if (typeof unsub === 'function') {
                unsub();
            }
        });
        this._listeners.clear();
    }
};

// Connection monitor for tracking online/offline status
export const connectionMonitor = {
    _isOnline: navigator.onLine,

    isOnline() {
        return this._isOnline;
    },

    start() {
        window.addEventListener('online', () => { this._isOnline = true; });
        window.addEventListener('offline', () => { this._isOnline = false; });
    }
};

// Debounce utility
export function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Throttle utility
export function throttle(fn, limit = 300) {
    let inThrottle = false;
    return function (...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => { inThrottle = false; }, limit);
        }
    };
}
