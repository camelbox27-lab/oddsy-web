/**
 * Enhanced Cache manager for Firebase data
 * Optimized for 500+ daily users
 */
class CacheManager {
    constructor(ttl = 5 * 60 * 1000, maxSize = 100) {
        this.cache = new Map();
        this.ttl = ttl;
        this.maxSize = maxSize;
    }

    set(key, value) {
        // LRU: Remove oldest if max size reached
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        const isExpired = Date.now() - item.timestamp > this.ttl;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }

        // Move to end for LRU
        this.cache.delete(key);
        this.cache.set(key, item);

        return item.value;
    }

    has(key) {
        return this.get(key) !== null;
    }

    clear() {
        this.cache.clear();
    }

    delete(key) {
        this.cache.delete(key);
    }

    // Cleanup expired entries
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > this.ttl) {
                this.cache.delete(key);
            }
        }
    }

    size() {
        return this.cache.size;
    }
}

// Singleton instances with optimized TTLs
export const dataCache = new CacheManager(5 * 60 * 1000, 200);  // 5 min, 200 items
export const oddsCache = new CacheManager(2 * 60 * 1000, 100);  // 2 min, 100 items
export const userCache = new CacheManager(10 * 60 * 1000, 50);  // 10 min, 50 items

// Auto cleanup every 5 minutes
setInterval(() => {
    dataCache.cleanup();
    oddsCache.cleanup();
    userCache.cleanup();
}, 5 * 60 * 1000);
