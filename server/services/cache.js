const crypto = require('crypto');

/**
 * Simple in-memory cache for analysis results
 * TTL: 30 minutes
 */
class AnalysisCache {
    constructor() {
        this.cache = new Map();
        this.TTL = 30 * 60 * 1000;
        
        // Auto-cleanup
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    store(metrics, forecast) {
        const id = crypto.randomUUID();
        this.cache.set(id, {
            metrics,
            forecast,
            timestamp: Date.now()
        });
        return id;
    }

    get(id) {
        const entry = this.cache.get(id);
        if (!entry) return null;
        
        if (Date.now() - entry.timestamp > this.TTL) {
            this.cache.delete(id);
            return null;
        }
        
        return entry;
    }

    cleanup() {
        const now = Date.now();
        for (const [id, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.TTL) {
                this.cache.delete(id);
            }
        }
    }
}

module.exports = new AnalysisCache();
