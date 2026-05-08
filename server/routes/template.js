const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

router.get('/', (req, res) => {
    const templatePath = path.join(__dirname, '../templates/sample_sales.xlsx');
    
    if (fs.existsSync(templatePath)) {
        res.download(templatePath, 'Predictive_Sales_Template.xlsx');
    } else {
        res.status(404).json({ error: 'Template file not found. Please contact support.' });
    }
});

module.exports = router;
