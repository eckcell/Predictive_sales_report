const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

const { parseExcel } = require('../services/excelParser');
const { cleanData } = require('../services/dataCleaner');
const { computeMetrics } = require('../services/metricsEngine');
const { analyzeSalesData } = require('../services/geminiService');
const { buildFinalReport } = require('../services/reportBuilder');
const { generateForecast } = require('../services/forecastEngine');
const { generateAllScenarios } = require('../services/scenarioEngine');
const cache = require('../services/cache');

// Multer setup for file uploads
const upload = multer({
    dest: os.tmpdir(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.xlsx' || ext === '.xls') {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
        }
    }
});

router.post('/', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;

    try {
        // 1. Parse Excel
        const rawRows = await parseExcel(filePath);
        
        // 2. Clean Data
        const { cleanedRows, anomalies, duplicateCount } = cleanData(rawRows);
        
        if (cleanedRows.length === 0) {
            throw new Error('No valid data rows found after cleaning.');
        }

        // 3. Compute Metrics
        const metrics = computeMetrics(cleanedRows);
        
        // 4. Generate Statistical Forecast (Phase 1)
        const forecast = generateForecast(metrics.byPeriod);
        
        // 5. Generate Scenarios (Phase 2)
        const scenarios = generateAllScenarios(forecast);

        // 6. Analyze with Gemini (Phase 3)
        const aiAnalysis = await analyzeSalesData(metrics, cleanedRows.slice(0, 20), forecast, scenarios);
        
        // 7. Store in Cache (Phase 4)
        const analysisId = cache.store(metrics, forecast);

        // 8. Build Final Report
        const report = buildFinalReport(aiAnalysis, metrics, { anomalies, duplicateCount }, forecast, scenarios, analysisId);

        res.json(report);
    } catch (error) {
        console.error('Analysis Route Error:', error);
        res.status(500).json({ 
            error: error.message || 'An unexpected error occurred during analysis.' 
        });
    } finally {
        // Always clean up the uploaded file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
});

module.exports = router;
