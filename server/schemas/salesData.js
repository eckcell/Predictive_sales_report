const { z } = require('zod');

const SalesRowSchema = z.object({
    date: z.date(),
    product: z.string().min(1),
    revenue: z.number().nonnegative(),
    unitsSold: z.number().int().nonnegative(),
    cogs: z.number().nonnegative(),
    profit: z.number(), // Can be negative if loss
    region: z.string().optional().default('Global'),
    salesRep: z.string().optional(),
    customerSegment: z.string().optional(),
    leadSource: z.string().optional(),
    dealStage: z.string().optional(),
    discount: z.number().optional().default(0),
    customerName: z.string().optional()
});

const SalesSummarySchema = z.object({
    totalRevenue: z.number(),
    totalCOGS: z.number(),
    totalProfit: z.number(),
    overallGrossMargin: z.number(),
    rowCount: z.number().int(),
    dateRange: z.object({
        start: z.date(),
        end: z.date()
    }),
    uniqueProducts: z.number().int(),
    uniqueRegions: z.number().int()
});

module.exports = {
    SalesRowSchema,
    SalesSummarySchema
};
