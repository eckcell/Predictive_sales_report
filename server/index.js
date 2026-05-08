const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Ensure uploads directory is not strictly needed for Vercel (/tmp is used)

// Routes
app.use('/api/analyze', require('./routes/analyze'));
app.use('/api/template', require('./routes/template'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server if not running in serverless environment
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Predictive Sales Server running at http://localhost:${PORT}`);
    });
}

// Export for Vercel
module.exports = app;
