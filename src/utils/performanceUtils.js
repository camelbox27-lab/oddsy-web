/**
 * Performance utilities for high-traffic handling
 */

// Debounce: Delays execution until user stops triggering
export const debounce = (fn, delay = 300) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

// Throttle: Limits execution frequency
export const throttle = (fn, limit = 1000) => {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Request queue for Firebase to prevent rate limiting
class RequestQueue {
    constructor(maxConcurrent = 5, delayBetween = 100) {
        this.queue = [];
        this.running = 0;
        this.maxConcurrent = maxConcurrent;
        this.delayBetween = delayBetween;
    }

    async add(promiseFn) {
        return new Promise((resolve, reject) => {
            this.queue.push({ promiseFn, resolve, reject });
            this.process();
        });
    }

    async process() {
        if (this.running >= this.maxConcurrent || this.queue.length === 0) return;

        const { promiseFn, resolve, reject } = this.queue.shift();
        this.running++;

        try {
            const result = await promiseFn();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            this.running--;
            setTimeout(() => this.process(), this.delayBetween);
        }
    }
}

export const requestQueue = new RequestQueue(5, 100);

// Memory leak prevention - cleanup listener registry
class ListenerRegistry {
    constructor() {
        this.listeners = new Map();
    }

    register(id, unsubscribe) {
        // Cleanup existing listener with same ID
        if (this.listeners.has(id)) {
            this.listeners.get(id)();
        }
        this.listeners.set(id, unsubscribe);
    }

    unregister(id) {
        if (this.listeners.has(id)) {
            this.listeners.get(id)();
            this.listeners.delete(id);
        }
    }

    unregisterAll() {
        for (const [id, unsubscribe] of this.listeners) {
            unsubscribe();
        }
        this.listeners.clear();
    }

    count() {
        return this.listeners.size;
    }
}

export const listenerRegistry = new ListenerRegistry();

// Connection state monitor
export const connectionMonitor = {
    isOnline: navigator.onLine,
    listeners: [],

    init() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.notify();
        });
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.notify();
        });
    },

    onStatusChange(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    },

    notify() {
        this.listeners.forEach(l => l(this.isOnline));
    }
};

// Initialize connection monitor
connectionMonitor.init();

// Retry mechanism for failed requests
export const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(r => setTimeout(r, delay * (i + 1)));
        }
    }
};
