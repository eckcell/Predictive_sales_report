/**
 * Enriches the Gemini analysis with local metrics and metadata
 * @param {Object} aiAnalysis - The JSON returned from Gemini
 * @param {Object} metrics - Local computed metrics
 * @param {Object} cleaningResults - Info about anomalies/duplicates
 * @returns {Object} Final report object
 */
const buildFinalReport = (aiAnalysis, metrics, cleaningResults, forecast, scenarios, analysisId) => {
    return {
        apiVersion: 2,
        analysisId,
        ...aiAnalysis,
        forecast,
        scenarios,
        metadata: {
            analysisDate: new Date().toISOString(),
            dataSource: 'Excel Spreadsheet',
            metrics: {
                rowCount: metrics.summary.rowCount,
                anomaliesFound: cleaningResults.anomalies.length,
                duplicatesRemoved: cleaningResults.duplicateCount,
                currencyDetected: 'USD',
                byPeriod: metrics.byPeriod
            },
            summary: metrics.summary, // Pass back raw metrics for UI KPI cards
            raw: metrics // Full metrics for scenario fallback
        },
        anomalies: cleaningResults.anomalies
    };
};

module.exports = {
    buildFinalReport
};
