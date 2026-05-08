const { z } = require('zod');

const ScoreBreakdownSchema = z.object({
    revenueTrend: z.object({ score: z.number(), weight: z.number(), reasoning: z.string() }),
    profitabilityAnalysis: z.object({ score: z.number(), weight: z.number(), reasoning: z.string() }),
    pipelineHealth: z.object({ score: z.number(), weight: z.number(), reasoning: z.string() }),
    customerDiversification: z.object({ score: z.number(), weight: z.number(), reasoning: z.string() }),
    productMix: z.object({ score: z.number(), weight: z.number(), reasoning: z.string() }),
    regionalPerformance: z.object({ score: z.number(), weight: z.number(), reasoning: z.string() }),
    salesVelocity: z.object({ score: z.number(), weight: z.number(), reasoning: z.string() }),
    seasonalityResilience: z.object({ score: z.number(), weight: z.number(), reasoning: z.string() })
});

const ProfitabilitySchema = z.object({
    overallGrossMargin: z.number(),
    marginTrend: z.enum(['improving', 'stable', 'declining']),
    highestMarginProducts: z.array(z.object({ product: z.string(), margin: z.number() })),
    lowestMarginProducts: z.array(z.object({ product: z.string(), margin: z.number() })),
    cogsEfficiency: z.string(),
    profitConcentrationRisk: z.string()
});

const TrendSchema = z.object({
    metric: z.string(),
    direction: z.enum(['up', 'down', 'flat']),
    magnitude: z.string(),
    insight: z.string()
});

const RiskSchema = z.object({
    risk: z.string(),
    severity: z.enum(['high', 'medium', 'low']),
    mitigation: z.string()
});

const OpportunitySchema = z.object({
    opportunity: z.string(),
    impact: z.enum(['high', 'medium', 'low']),
    timeframe: z.string()
});

const RecommendationSchema = z.object({
    action: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
    expectedImpact: z.string()
});

const ForecastInterpretationSchema = z.object({
    shortTermOutlook: z.string(),
    longTermOutlook: z.string(),
    confidenceAssessment: z.string(),
    seasonalWarnings: z.array(z.string())
});

const ScenarioAnalysisSchema = z.object({
    scenarioId: z.string(),
    likelihood: z.enum(['low', 'medium', 'high']),
    narrativeSummary: z.string(),
    strategicImplications: z.array(z.string())
});

const CriticalThresholdsSchema = z.object({
    minimumMarginTarget: z.number(),
    revenueAtRisk: z.number()
});

const GeminiResponseSchema = z.object({
    score: z.number(),
    scoreBreakdown: ScoreBreakdownSchema,
    executiveSummary: z.string(),
    profitability: ProfitabilitySchema,
    keyFindings: z.array(z.string()),
    trends: z.array(TrendSchema),
    risks: z.array(RiskSchema),
    opportunities: z.array(OpportunitySchema),
    recommendations: z.array(RecommendationSchema),
    forecastInterpretation: ForecastInterpretationSchema.optional(),
    scenarioAnalysis: z.array(ScenarioAnalysisSchema).optional(),
    criticalThresholds: CriticalThresholdsSchema.optional()
});

module.exports = {
    GeminiResponseSchema
};
