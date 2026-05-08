/**
 * Computes aggregations and summary statistics for the sales data
 * @param {Array} rows - List of cleaned row objects
 * @returns {Object} Comprehensive metrics object
 */
const computeMetrics = (rows) => {
    if (rows.length === 0) return null;

    const summary = {
        totalRevenue: 0,
        totalCOGS: 0,
        totalProfit: 0,
        rowCount: rows.length,
        uniqueProducts: new Set(),
        uniqueRegions: new Set(),
        dateRange: {
            start: rows[0].date,
            end: rows[0].date
        }
    };

    const periodAgg = {}; // By YYYY-MM
    const productAgg = {};
    const regionAgg = {};

    rows.forEach(row => {
        // Summary
        summary.totalRevenue += row.revenue;
        summary.totalCOGS += row.cogs;
        summary.totalProfit += row.profit;
        summary.uniqueProducts.add(row.product);
        summary.uniqueRegions.add(row.region);
        
        if (row.date < summary.dateRange.start) summary.dateRange.start = row.date;
        if (row.date > summary.dateRange.end) summary.dateRange.end = row.date;

        // Period Aggregation
        const month = row.date.toISOString().slice(0, 7); // YYYY-MM
        if (!periodAgg[month]) {
            periodAgg[month] = { revenue: 0, cogs: 0, profit: 0, unitsSold: 0 };
        }
        periodAgg[month].revenue += row.revenue;
        periodAgg[month].cogs += row.cogs;
        periodAgg[month].profit += row.profit;
        periodAgg[month].unitsSold += row.unitsSold;

        // Product Aggregation
        if (!productAgg[row.product]) {
            productAgg[row.product] = { revenue: 0, cogs: 0, profit: 0, unitsSold: 0 };
        }
        productAgg[row.product].revenue += row.revenue;
        productAgg[row.product].cogs += row.cogs;
        productAgg[row.product].profit += row.profit;
        productAgg[row.product].unitsSold += row.unitsSold;

        // Region Aggregation
        if (!regionAgg[row.region]) {
            regionAgg[row.region] = { revenue: 0, profit: 0, margin: 0 };
        }
        regionAgg[row.region].revenue += row.revenue;
        regionAgg[row.region].profit += row.profit;
    });

    // Compute derived metrics
    summary.overallGrossMargin = (summary.totalProfit / summary.totalRevenue) * 100;
    summary.uniqueProducts = summary.uniqueProducts.size;
    summary.uniqueRegions = summary.uniqueRegions.size;

    // Format aggregations and add margins
    const formatAgg = (agg) => {
        return Object.entries(agg)
            .map(([key, val]) => ({
                id: key,
                ...val,
                margin: (val.profit / val.revenue) * 100
            }))
            .sort((a, b) => b.revenue - a.revenue);
    };

    return {
        summary,
        byPeriod: formatAgg(periodAgg).sort((a, b) => a.id.localeCompare(b.id)),
        byProduct: formatAgg(productAgg),
        byRegion: formatAgg(regionAgg)
    };
};

module.exports = {
    computeMetrics
};
