import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = (import.meta.env.VITE_GEMINI_KEY || import.meta.env.VITE_GEMINI_API_KEY) as string || '';

console.log('Gemini API Key loaded:', API_KEY ? 'YES (Starts with ' + API_KEY.substring(0, 4) + ')' : 'NO');

export const GeminiService = {
  analyzeMeal: async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    portion: number;
  }> => {
    if (!API_KEY) throw new Error('API Key missing');

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      // Switched to 'gemini-flash-latest' which is the most reliable model for free tier keys
      const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

      const prompt = `Analyze this food image. Return ONLY a valid JSON object: {"name":"food name","calories":number,"protein":number,"carbs":number,"fats":number,"portion":number}. Be highly accurate.`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Image
          }
        }
      ]);

      const text = result.response.text().trim();
      const jsonMatch = text.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          name: parsed.name || 'Analyzed Meal',
          calories: Math.round(parsed.calories) || 0,
          protein: Math.round(parsed.protein) || 0,
          carbs: Math.round(parsed.carbs) || 0,
          fats: Math.round(parsed.fats) || 0,
          portion: Math.round(parsed.portion) || 300
        };
      }
      throw new Error('Invalid response format');
    } catch (err: any) {
      console.error('Gemini Flash Error:', err);
      // Last resort fallback
      if (err.message?.includes('429') || err.message?.includes('404')) {
         throw new Error('الـ API مشغول حالياً، جرب كمان دقيقة');
      }
      throw err;
    }
  },
  generateText: async (prompt: string): Promise<string> => {
    if (!API_KEY) throw new Error('API Key missing');
    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err: any) {
      console.error('Gemini Text Error:', err);
      throw err;
    }
  }
};
