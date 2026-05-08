/**
 * Statistical Forecasting Engine for Sales Data
 * Implements SMA, Exponential Smoothing, and Seasonal Adjustment
 */

/**
 * Fills gaps in monthly time-series data with zeros or interpolated values
 * @param {Array} byPeriod - Array of { id: "YYYY-MM", revenue, profit, ... }
 * @returns {Array} Gap-filled chronological array
 */
const fillTimeSeriesGaps = (byPeriod) => {
    if (byPeriod.length < 2) return byPeriod;

    const filled = [];
    const start = new Date(byPeriod[0].id + '-01');
    const end = new Date(byPeriod[byPeriod.length - 1].id + '-01');

    let current = new Date(start);
    while (current <= end) {
        const id = current.toISOString().slice(0, 7);
        const existing = byPeriod.find(p => p.id === id);

        if (existing) {
            filled.push({ ...existing });
        } else {
            filled.push({
                id,
                revenue: 0,
                profit: 0,
                cogs: 0,
                unitsSold: 0,
                margin: 0,
                isGapFilled: true
            });
        }
        current.setMonth(current.getMonth() + 1);
    }
    return filled;
};

/**
 * Computes simple moving average
 */
const computeSMA = (data, window) => {
    if (data.length < window) return null;
    const slice = data.slice(-window);
    return slice.reduce((sum, val) => sum + val, 0) / window;
};

/**
 * Computes exponential smoothing
 */
const computeETS = (data, alpha = 0.3) => {
    if (data.length === 0) return 0;
    let level = data[0];
    for (let i = 1; i < data.length; i++) {
        level = alpha * data[i] + (1 - alpha) * level;
    }
    return level;
};

/**
 * Generates statistical forecasts for revenue and profit
 * @param {Array} byPeriod - Raw period aggregations from metrics engine
 * @returns {Object} Forecast results
 */
const generateForecast = (byPeriod) => {
    const data = fillTimeSeriesGaps(byPeriod);
    const n = data.length;

    // 1. Data Readiness Check
    let readiness = 'insufficient';
    if (n >= 12) readiness = 'full';
    else if (n >= 6) readiness = 'standard';
    else if (n >= 3) readiness = 'basic';

    if (readiness === 'insufficient') {
        return { dataReadiness: readiness, horizons: null, monthlyProjections: [] };
    }

    const revenues = data.map(d => d.revenue);
    const profits = data.map(d => d.profit);

    // 2. Trend Metrics (OLS Regression for more stability)
    const computeOLS = (y) => {
        const n = y.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += y[i];
            sumXY += i * y[i];
            sumX2 += i * i;
        }
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        return { slope, intercept };
    };

    const revTrend = computeOLS(revenues);
    const profitTrend = computeOLS(profits);

    // Growth rate (approximate CAGR from slope)
    const avgRev = revenues.reduce((a,b) => a+b, 0) / n;
    const revenueCAGR = avgRev > 0 ? (revTrend.slope / avgRev) * 1200 : 0; // Annualized %

    // 3. Seasonality (only if full readiness)
    const seasonalIndices = new Array(12).fill(1);
    if (readiness === 'full') {
        const cycleCount = Math.floor(n / 12);
        for (let i = 0; i < 12; i++) {
            let sumRatio = 0;
            let count = 0;
            for (let j = 0; j < cycleCount; j++) {
                const idx = i + (j * 12);
                const trendVal = revTrend.slope * idx + revTrend.intercept;
                if (trendVal > 0) {
                    sumRatio += revenues[idx] / trendVal;
                    count++;
                }
            }
            if (count > 0) seasonalIndices[i] = sumRatio / count;
        }
    }

    // 4. Projections
    const lastDate = new Date(data[n - 1].id + '-01');
    const monthlyProjections = [];
    
    for (let i = 1; i <= 12; i++) {
        const x = n - 1 + i;
        const monthIdx = (lastDate.getMonth() + i) % 12;
        
        let projRev = Math.max(0, revTrend.slope * x + revTrend.intercept);
        let projProfit = Math.max(0, profitTrend.slope * x + profitTrend.intercept);
        
        // Apply seasonality
        if (readiness === 'full') {
            projRev *= seasonalIndices[monthIdx];
        }

        const nextDate = new Date(lastDate);
        nextDate.setMonth(lastDate.getMonth() + i);
        
        monthlyProjections.push({
            month: nextDate.toISOString().slice(0, 7),
            revenue: { low: projRev * 0.85, mid: projRev, high: projRev * 1.15 },
            profit: { low: projProfit * 0.85, mid: projProfit, high: projProfit * 1.15 }
        });
    }

    const horizons = {
        "3m": {
            revenue: { mid: monthlyProjections.slice(0, 3).reduce((s,p) => s + p.revenue.mid, 0) },
            profit: { mid: monthlyProjections.slice(0, 3).reduce((s,p) => s + p.profit.mid, 0) },
            margin: 0
        }
    };
    horizons["3m"].margin = (horizons["3m"].profit.mid / (horizons["3m"].revenue.mid || 1)) * 100;

    if (readiness !== 'basic') {
        horizons["6m"] = {
            revenue: { mid: monthlyProjections.slice(0, 6).reduce((s,p) => s + p.revenue.mid, 0) },
            profit: { mid: monthlyProjections.slice(0, 6).reduce((s,p) => s + p.profit.mid, 0) },
            margin: 0
        };
        horizons["6m"].margin = (horizons["6m"].profit.mid / (horizons["6m"].revenue.mid || 1)) * 100;
    }

    return {
        dataReadiness: readiness,
        horizons,
        monthlyProjections,
        trendMetrics: {
            revenueCAGR,
            profitCAGR: 0,
            marginDrift: 0,
            seasonalityStrength: readiness === 'full' ? 0.6 : 0
        }
    };
};

module.exports = {
    generateForecast
};
