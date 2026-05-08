const { GoogleGenAI } = require('@google/genai');
const { SYSTEM_PROMPT, generatePrompt } = require('../prompts/salesAnalysis');

const analyzeSalesData = async (metrics, sampleRows) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        throw new Error('Missing Gemini API Key. Please add it to your .env file.');
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    const prompt = generatePrompt(metrics, sampleRows);

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
        
        try {
            return JSON.parse(text);
        } catch (parseError) {
            console.error('Failed to parse Gemini response as JSON:', text);
            throw new Error('Gemini returned an invalid JSON response.');
        }
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new Error(`AI Analysis failed: ${error.message}`);
    }
};

module.exports = {
    analyzeSalesData
};
