const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { parseExcel } = require('../services/excelParser');
const { cleanData } = require('../services/dataCleaner');
const { computeMetrics } = require('../services/metricsEngine');
const { analyzeSalesData } = require('../services/geminiService');
const { buildFinalReport } = require('../services/reportBuilder');

// Multer setup for file uploads
const upload = multer({
    dest: 'server/uploads/',
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
        
        // 4. Analyze with Gemini
        // We send summary metrics + first 50 rows for pattern context
        const aiAnalysis = await analyzeSalesData(metrics, cleanedRows.slice(0, 50));
        
        // 5. Build Final Report
        const report = buildFinalReport(aiAnalysis, metrics, { anomalies, duplicateCount });

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
