const rateLimitStore = new Map();

export const checkRateLimit = (userId, action, maxRequests = 10, timeWindow = 60000) => {
    const key = `${userId}-${action}`;
    const now = Date.now();

    if (!rateLimitStore.has(key)) {
        rateLimitStore.set(key, { count: 1, timestamp: now });
        return true;
    }

    const data = rateLimitStore.get(key);

    // Zaman penceresi dolmuşsa sıfırla
    if (now - data.timestamp > timeWindow) {
        rateLimitStore.set(key, { count: 1, timestamp: now });
        return true;
    }

    // Limit aşıldı mı?
    if (data.count >= maxRequests) {
        return false;
    }

    // Sayacı artır
    data.count++;
    return true;
};
