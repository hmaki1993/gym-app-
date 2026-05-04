import { GeminiService } from './gemini';

export const FatSecretService = {
  searchFood: async (query: string) => {
    try {
      const prompt = `Search food: "${query}". Return a JSON array of exactly 5 objects. Schema for each object: {"name": string, "nameAr": string (Arabic), "calories": number, "protein": number, "carbs": number, "fats": number, "portion": number}.`;

      const response = await GeminiService.generateText(prompt);
      console.log('Gemini Search Response:', response);
      
      // Try to find an array first, then an object
      const arrayMatch = response.match(/\[[\s\S]*?\]/);
      const objectMatch = response.match(/\{[\s\S]*?\}/);
      
      let rawResults = [];
      try {
        if (arrayMatch) {
          const cleaned = arrayMatch[0].replace(/,\s*([\]}])/g, '$1'); // Remove trailing commas
          rawResults = JSON.parse(cleaned);
        } else if (objectMatch) {
          const cleaned = objectMatch[0].replace(/,\s*([\]}])/g, '$1');
          rawResults = [JSON.parse(cleaned)];
        }
      } catch (parseErr) {
        console.warn('Initial parse failed, trying fallback cleaning...', parseErr);
        // Fallback: simple string cleanup
        const fallbackStr = (arrayMatch ? arrayMatch[0] : objectMatch?.[0] || '')
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
          .trim();
        try {
          rawResults = arrayMatch ? JSON.parse(fallbackStr) : [JSON.parse(fallbackStr)];
        } catch (finalErr) {
          console.error('Final JSON parse failed:', finalErr);
          return [];
        }
      }

      if (rawResults.length > 0) {
        return rawResults.map((item: any) => {
          const normalized = {
            ...item,
            name: item.name || item.food_name || item.title || 'Unknown Food',
            nameAr: item.nameAr || item.name_ar || item.arabicName || item.arabic_name || '',
            calories: Number(item.calories || item.kcal || item.calories_kcal || 0),
            protein: Number(item.protein || item.protein_g || 0),
            carbs: Number(item.carbs || item.carbs_g || 0),
            fats: Number(item.fats || item.fats_g || 0),
            portion: Number(item.portion || item.serving_size || 100)
          };
          return normalized;
        });
      }
      console.warn('No valid JSON found in response');
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
      Fields: name, nameAr (Arabic translation), calories, protein, carbs, fats, portion (in grams).
      If not found, return {"error": "not found"}.
      Return ONLY the JSON, no extra text.`;

      const response = await GeminiService.generateText(prompt);
      const jsonMatch = response.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        if (data.error) return null;
        return {
          ...data,
          nameAr: data.nameAr || data.name_ar || data.arabicName || data.arabic_name || ''
        };
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
