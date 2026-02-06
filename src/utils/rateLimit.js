const rateLimitStore = new Map();

/**
 * Enhanced rate limiting with IP-like tracking
 * @param {string} userId - User identifier
 * @param {string} action - Action being performed
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} timeWindow - Time window in ms
 * @returns {object} - { allowed: boolean, remaining: number, retryAfter: number }
 */
export const checkRateLimit = (userId, action, maxRequests = 10, timeWindow = 60000) => {
    const key = `${userId}-${action}`;
    const now = Date.now();

    if (!rateLimitStore.has(key)) {
        rateLimitStore.set(key, {
            count: 1,
            timestamp: now,
            requests: [now]
        });
        return { allowed: true, remaining: maxRequests - 1, retryAfter: 0 };
    }

    const data = rateLimitStore.get(key);

    // Sliding window - filter old requests
    const recentRequests = data.requests.filter(t => now - t < timeWindow);

    // Time window expired - reset
    if (recentRequests.length === 0) {
        rateLimitStore.set(key, {
            count: 1,
            timestamp: now,
            requests: [now]
        });
        return { allowed: true, remaining: maxRequests - 1, retryAfter: 0 };
    }

    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
        const oldestRequest = Math.min(...recentRequests);
        const retryAfter = Math.ceil((oldestRequest + timeWindow - now) / 1000);
        return {
            allowed: false,
            remaining: 0,
            retryAfter: Math.max(0, retryAfter)
        };
    }

    // Allow request and update
    recentRequests.push(now);
    rateLimitStore.set(key, {
        count: recentRequests.length,
        timestamp: now,
        requests: recentRequests
    });

    return {
        allowed: true,
        remaining: maxRequests - recentRequests.length,
        retryAfter: 0
    };
};

/**
 * Reset rate limit for a user/action
 */
export const resetRateLimit = (userId, action) => {
    const key = `${userId}-${action}`;
    rateLimitStore.delete(key);
};

/**
 * Cleanup old entries (call periodically)
 */
export const cleanupRateLimits = () => {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    for (const [key, data] of rateLimitStore.entries()) {
        if (now - data.timestamp > maxAge) {
            rateLimitStore.delete(key);
        }
    }
};

// Auto cleanup every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);

/**
 * Get current rate limit status
 */
export const getRateLimitStatus = (userId, action, maxRequests = 10, timeWindow = 60000) => {
    const key = `${userId}-${action}`;
    const now = Date.now();

    if (!rateLimitStore.has(key)) {
        return { used: 0, remaining: maxRequests, resetIn: 0 };
    }

    const data = rateLimitStore.get(key);
    const recentRequests = data.requests.filter(t => now - t < timeWindow);

    return {
        used: recentRequests.length,
        remaining: Math.max(0, maxRequests - recentRequests.length),
        resetIn: recentRequests.length > 0
            ? Math.ceil((Math.min(...recentRequests) + timeWindow - now) / 1000)
            : 0
    };
};
