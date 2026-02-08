/**
 * Simple in-memory data cache with TTL support.
 */
class DataCache {
    constructor() {
        this._cache = new Map();
    }

    get(key) {
        const entry = this._cache.get(key);
        if (!entry) return null;
        if (entry.expiry && Date.now() > entry.expiry) {
            this._cache.delete(key);
            return null;
        }
        return entry.value;
    }

    set(key, value, ttlMs = 5 * 60 * 1000) {
        this._cache.set(key, {
            value,
            expiry: ttlMs ? Date.now() + ttlMs : null
        });
    }

    delete(key) {
        this._cache.delete(key);
    }

    clear() {
        this._cache.clear();
    }
}

export const dataCache = new DataCache();
