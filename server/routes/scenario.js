const express = require('express');
const router = express.Router();
const cache = require('../services/cache');
const { generateScenario } = require('../services/scenarioEngine');
const { analyzeCustomScenario } = require('../services/geminiService');

// Simple IP-based rate limiting (Phase 6.2)
const lastRequest = new Map();
const COOLDOWN = 15000; // 15 seconds

router.post('/', async (req, res) => {
    const { analysisId, revenueGrowth, cogsChange, marginTarget, horizon } = req.body;
    
    // Rate limit check
    const ip = req.ip;
    const now = Date.now();
    if (lastRequest.has(ip) && (now - lastRequest.get(ip) < COOLDOWN)) {
        return res.status(429).json({ error: 'Please wait 15 seconds between scenario runs.' });
    }
    lastRequest.set(ip, now);

    // Cache lookup (Phase 6.1)
    const cached = cache.get(analysisId);
    if (!cached) {
        return res.status(410).json({ error: 'Analysis session expired. Please re-upload your file.' });
    }

    const params = { revenueGrowth, cogsChange, marginTarget, horizon };
    
    try {
        // 1. Generate statistical result
        const scenarioResult = generateScenario(cached.forecast, params);
        
        // 2. Get AI narrative (Phase 6.1)
        const aiNarrative = await analyzeCustomScenario(cached.metrics, cached.forecast, scenarioResult, params);
        
        res.json({
            ...scenarioResult,
            aiNarrative
        });
    } catch (error) {
        console.error('Scenario API Error:', error);
        res.status(500).json({ error: 'Failed to generate scenario.' });
    }
});

module.exports = router;
