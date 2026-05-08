/**
 * Scenario Simulation Engine
 * Modifies base forecasts based on strategic parameters
 */

/**
 * Generates a modified forecast based on input parameters
 * @param {Object} baseForecast - Output from forecastEngine
 * @param {Object} params - { revenueGrowth, cogsChange, marginTarget, horizon }
 * @returns {Object} Scenario projection
 */
const generateScenario = (baseForecast, params) => {
    const { revenueGrowth = 0, cogsChange = 0, marginTarget = null, horizon = 12 } = params;
    
    const monthlyProjections = baseForecast.monthlyProjections.slice(0, horizon).map(p => {
        let rev = p.revenue.mid * (1 + revenueGrowth);
        let profit = p.profit.mid;
        
        // Apply COGS change
        // Original COGS = Revenue - Profit
        let originalCOGS = p.revenue.mid - p.profit.mid;
        let newCOGS = originalCOGS * (1 + cogsChange);
        
        let newProfit = rev - newCOGS;

        // Apply Margin Target Override if provided
        if (marginTarget !== null) {
            newProfit = rev * (marginTarget / 100);
        }

        // Bounds clamping (🔧 O8)
        if (rev < 0) rev = 0;
        const finalProfit = Math.max(-rev, newProfit); // Max loss is 100% of revenue? No, could be more. But let's keep it sane.

        return {
            month: p.month,
            revenue: { mid: rev },
            profit: { mid: finalProfit },
            margin: rev > 0 ? (finalProfit / rev) * 100 : 0
        };
    });

    const totalRevBase = baseForecast.monthlyProjections.slice(0, horizon).reduce((s, p) => s + p.revenue.mid, 0);
    const totalProfitBase = baseForecast.monthlyProjections.slice(0, horizon).reduce((s, p) => s + p.profit.mid, 0);
    const marginBase = (totalProfitBase / (totalRevBase || 1)) * 100;

    const totalRevNew = monthlyProjections.reduce((s, p) => s + p.revenue.mid, 0);
    const totalProfitNew = monthlyProjections.reduce((s, p) => s + p.profit.mid, 0);
    const marginNew = (totalProfitNew / (totalRevNew || 1)) * 100;

    return {
        monthlyProjections,
        impactSummary: {
            revenueChange: `$${(totalRevNew - totalRevBase).toLocaleString()} (${((totalRevNew / (totalRevBase || 1) - 1) * 100).toFixed(1)}%)`,
            profitChange: `$${(totalProfitNew - totalProfitBase).toLocaleString()} (${((totalProfitNew / (totalProfitBase || 1) - 1) * 100).toFixed(1)}%)`,
            marginShift: `${(marginNew - marginBase).toFixed(1)}pp`
        }
    };
};

/**
 * Generates the 5 pre-built scenario templates
 */
const generateAllScenarios = (baseForecast) => {
    if (!baseForecast || baseForecast.dataReadiness === 'insufficient') return null;

    return [
        {
            id: 'optimistic_growth',
            label: 'Optimistic Growth',
            ...generateScenario(baseForecast, { revenueGrowth: 0.15, cogsChange: 0.05 })
        },
        {
            id: 'market_downturn',
            label: 'Market Downturn',
            ...generateScenario(baseForecast, { revenueGrowth: -0.20, marginTarget: (baseForecast.horizons['3m'].margin - 3) })
        },
        {
            id: 'price_increase',
            label: 'Price Increase',
            // Revenue +10%, but volume -5% means net revenue is (1.1 * 0.95) - 1 = 4.5%
            // COGS would also drop by 5% due to volume decrease
            ...generateScenario(baseForecast, { revenueGrowth: 0.045, cogsChange: -0.05 })
        },
        {
            id: 'cost_optimization',
            label: 'Cost Optimization',
            ...generateScenario(baseForecast, { cogsChange: -0.12 })
        },
        {
            id: 'status_quo',
            label: 'Status Quo',
            ...generateScenario(baseForecast, {})
        }
    ];
};

module.exports = {
    generateScenario,
    generateAllScenarios
};
