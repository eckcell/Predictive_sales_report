const { GoogleGenAI } = require('@google/genai');
const { SYSTEM_PROMPT, generatePrompt } = require('../prompts/salesAnalysis');

const analyzeSalesData = async (metrics, sampleRows, forecast, scenarios) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        throw new Error('Missing Gemini API Key. Please add it to your .env file.');
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    const prompt = generatePrompt(metrics, sampleRows, forecast, scenarios);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: 'application/json',
                temperature: 0.2, // Low temperature for consistent analysis
            }
        });

        const text = response.text;
        let parsedData;
        
        try {
            parsedData = JSON.parse(text);
        } catch (parseError) {
            console.error('Failed to parse Gemini response as JSON:', text);
            throw new Error('Gemini returned an invalid JSON response.');
        }

        const { GeminiResponseSchema } = require('../schemas/geminiResponse');
        const validation = GeminiResponseSchema.safeParse(parsedData);

        if (!validation.success) {
            console.warn('Gemini response validation failed:', validation.error);
            // We could return partial data or a modified version, 
            // but for now let's just ensure critical fields exist.
            return parsedData; 
        }

        return validation.data;
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new Error(`AI Analysis failed: ${error.message}`);
    }
};

const analyzeCustomScenario = async (metrics, forecast, scenarioResult, params) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        throw new Error('Missing API Key');
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    const prompt = `
STRATEGIC "WHAT-IF" ANALYSIS:
The user has proposed a custom business scenario with these adjustments:
- Revenue Growth: ${params.revenueGrowth * 100}%
- COGS Change: ${params.cogsChange * 100}%
- Margin Target: ${params.marginTarget || 'N/A'}%

STATISTICAL OUTCOME:
- Projected Revenue Change: ${scenarioResult.impactSummary.revenueChange}
- Projected Profit Change: ${scenarioResult.impactSummary.profitChange}
- Projected Margin Shift: ${scenarioResult.impactSummary.marginShift}

TASK:
Provide a concise (2-3 sentence) strategic interpretation of this specific scenario. 
Focus on achievability, risks, and one key action item.
Do not repeat the numbers. Just provide the narrative.
`;

    try {
        const response = await ai.models.generateContent({
            systemInstructions: "You are a senior business strategist. Provide sharp, qualitative insights.",
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });
        return response.text;
    } catch (error) {
        return "Analysis unavailable for this scenario.";
    }
};

module.exports = {
    analyzeSalesData,
    analyzeCustomScenario
};
