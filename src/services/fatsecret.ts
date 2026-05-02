import { GeminiService } from './gemini';

export const FatSecretService = {
  searchFood: async (query: string) => {
    try {
      const prompt = `Search for nutritional information for "${query}". 
      Return a JSON array of 3-5 common variations/portions of this food.
      Each object must have: name, calories, protein, carbs, fats, portion (in grams).
      Example format: [{"name": "1 Large Egg", "calories": 70, "protein": 6, "carbs": 0.5, "fats": 5, "portion": 50}]
      Return ONLY the JSON array, no extra text.`;

      const response = await GeminiService.generateText(prompt);
      const jsonMatch = response.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (err: any) {
      console.error('Gemini Search Error:', err);
      return [];
    }
  },

  findByBarcode: async (barcode: string) => {
    try {
      const prompt = `Find the nutritional information for a product with barcode: ${barcode}. 
      If you can identify the product, return its details in JSON format.
      Fields: name, calories, protein, carbs, fats, portion (in grams).
      If not found, return {"error": "not found"}.
      Return ONLY the JSON, no extra text.`;

      const response = await GeminiService.generateText(prompt);
      const jsonMatch = response.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        if (data.error) return null;
        return data;
      }
      return null;
    } catch (err: any) {
      console.error('Gemini Barcode Error:', err);
      return null;
    }
  },

  getFoodDetails: async () => {
    return null;
  }
};
