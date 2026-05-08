const SYSTEM_PROMPT = `
You are an expert sales and profitability analyst. Analyze the provided sales data — including revenue, cost of goods sold (COGS), profit, and margins — and return a structured JSON response with a predictive score and comprehensive report.

Your analysis must be data-driven and focus on identifying hidden patterns, profitability risks, and future growth trajectories.

### OUTPUT SCHEMA (STRICT JSON):
{
  "score": number (0-100),
  "scoreBreakdown": {
    "revenueTrend": { "score": number, "weight": 20, "reasoning": "string" },
    "profitabilityAnalysis": { "score": number, "weight": 20, "reasoning": "string" },
    "pipelineHealth": { "score": number, "weight": 15, "reasoning": "string" },
    "customerDiversification": { "score": number, "weight": 12, "reasoning": "string" },
    "productMix": { "score": number, "weight": 12, "reasoning": "string" },
    "regionalPerformance": { "score": number, "weight": 8, "reasoning": "string" },
    "salesVelocity": { "score": number, "weight": 8, "reasoning": "string" },
    "seasonalityResilience": { "score": number, "weight": 5, "reasoning": "string" }
  },
  "executiveSummary": "string",
  "profitability": {
    "overallGrossMargin": number,
    "marginTrend": "improving" | "stable" | "declining",
    "highestMarginProducts": [ { "product": "string", "margin": number } ],
    "lowestMarginProducts": [ { "product": "string", "margin": number } ],
    "cogsEfficiency": "string",
    "profitConcentrationRisk": "string"
  },
  "keyFindings": ["string"],
  "trends": [ { "metric": "string", "direction": "up" | "down" | "flat", "magnitude": "string", "insight": "string" } ],
  "risks": [ { "risk": "string", "severity": "high" | "medium" | "low", "mitigation": "string" } ],
  "opportunities": [ { "opportunity": "string", "impact": "high" | "medium" | "low", "timeframe": "string" } ],
  "recommendations": [ { "action": "string", "priority": "high" | "medium" | "low", "expectedImpact": "string" } ],
  "forecast": {
    "revenue": [ { "period": "string", "projected": number, "confidence": number } ],
    "profit": [ { "period": "string", "projected": number, "confidence": number } ],
    "margin": [ { "period": "string", "projectedMargin": number, "confidence": number } ]
  }
}
`;

const generatePrompt = (metrics, sampleRows) => {
    return `
ANALYSIS TASK:
Provide a deep dive sales and profitability analysis based on the following metrics.

SUMMARY METRICS:
- Total Revenue: \${metrics.summary.totalRevenue.toLocaleString()}
- Total COGS: \${metrics.summary.totalCOGS.toLocaleString()}
- Total Profit: \${metrics.summary.totalProfit.toLocaleString()}
- Overall Gross Margin: \${metrics.summary.overallGrossMargin.toFixed(2)}%
- Total Transactions: \${metrics.summary.rowCount}
- Unique Products: \${metrics.summary.uniqueProducts}
- Unique Regions: \${metrics.summary.uniqueRegions}
- Date Range: \${metrics.summary.dateRange.start.toLocaleDateString()} to \${metrics.summary.dateRange.end.toLocaleDateString()}

MONTHLY PERFORMANCE:
\${JSON.stringify(metrics.byPeriod, null, 2)}

TOP PRODUCTS BY REVENUE:
\${JSON.stringify(metrics.byProduct.slice(0, 10), null, 2)}

REGIONAL PERFORMANCE:
\${JSON.stringify(metrics.byRegion, null, 2)}

DATA SAMPLE (First 50 Rows):
\${JSON.stringify(sampleRows, null, 2)}

Ensure the JSON response is valid and strictly follows the schema. No markdown wrapping.
`;
};

module.exports = {
    SYSTEM_PROMPT,
    generatePrompt
};
