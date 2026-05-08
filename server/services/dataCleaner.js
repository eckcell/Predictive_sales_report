const { SalesRowSchema } = require('../schemas/salesData');

/**
 * Cleans and validates raw data from Excel
 * @param {Array} rawRows - Array of objects from parser
 * @returns {Object} { cleanedRows, anomalies }
 */
const cleanData = (rawRows) => {
    const cleanedRows = [];
    const anomalies = [];

    rawRows.forEach((row, index) => {
        try {
            // Coerce types if needed
            const coercedRow = {
                ...row,
                date: row.date instanceof Date ? row.date : new Date(row.date),
                revenue: Number(row.revenue),
                unitsSold: Number(row.unitsSold),
                cogs: Number(row.cogs),
                profit: Number(row.profit),
                discount: row.discount ? Number(row.discount) : 0
            };

            // Validate with Zod
            const validated = SalesRowSchema.parse(coercedRow);
            
            // Logic check: Margin compression or anomalies
            if (validated.revenue < validated.cogs) {
                anomalies.push({
                    row: index + 2,
                    reason: 'Negative margin: COGS exceeds revenue',
                    data: validated
                });
            }

            cleanedRows.push(validated);
        } catch (err) {
            anomalies.push({
                row: index + 2,
                reason: `Validation failed: ${err.message}`,
                data: row
            });
        }
    });

    // Deduplication (simple check based on date, product, and revenue)
    const seen = new Set();
    const uniqueRows = cleanedRows.filter(row => {
        const key = `${row.date.getTime()}-${row.product}-${row.revenue}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    return {
        cleanedRows: uniqueRows,
        anomalies,
        duplicateCount: cleanedRows.length - uniqueRows.length
    };
};

module.exports = {
    cleanData
};
