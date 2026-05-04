import { GeminiService } from './gemini';
import { searchLocalDB } from '../data/foodDatabase';

export const FatSecretService = {
  searchFood: async (query: string) => {
    // ── Step 1: Search Local DB first (instant + accurate) ──
    const localResults = searchLocalDB(query);
    if (localResults.length >= 3) {
      console.log(`✅ Local DB hit for "${query}":`, localResults.length, 'results');
      return localResults;
    }

    // ── Step 2: Fallback to Gemini with an expert-level prompt ──
    try {
      const prompt = `You are a certified nutritionist with access to the USDA FoodData Central database and Egyptian food market knowledge.
The user is searching for: "${query}"

Return ONLY a valid JSON array of exactly 5 food items matching or related to the query.
Use scientifically accurate nutritional values per the specified portion size.
Include Egyptian/Arabic market products if relevant (e.g., Juhayna, Chipsy, local dishes).

JSON schema (no extra text, no markdown):
[
  {
    "name": "English food name",
    "nameAr": "الاسم بالعربية",
    "calories": <number, kcal per portion>,
    "protein": <number, grams>,
    "carbs": <number, grams>,
    "fats": <number, grams>,
    "portion": <number, grams or ml>
  }
]`;

      const response = await GeminiService.generateText(prompt);
      console.log('Gemini Search Response:', response);

      const arrayMatch = response.match(/\[[\s\S]*\]/);
      const objectMatch = response.match(/\{[\s\S]*?\}/);

      let rawResults: any[] = [];
      try {
        if (arrayMatch) {
          const cleaned = arrayMatch[0].replace(/,\s*([\]}])/g, '$1');
          rawResults = JSON.parse(cleaned);
        } else if (objectMatch) {
          const cleaned = objectMatch[0].replace(/,\s*([\]}])/g, '$1');
          rawResults = [JSON.parse(cleaned)];
        }
      } catch (parseErr) {
        console.warn('Parse failed, trying fallback...', parseErr);
        const fallbackStr = (arrayMatch ? arrayMatch[0] : objectMatch?.[0] || '')
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
        try {
          rawResults = arrayMatch ? JSON.parse(fallbackStr) : [JSON.parse(fallbackStr)];
        } catch {
          // Merge local results with empty AI results
          return localResults;
        }
      }

      const aiResults = rawResults.map((item: any) => ({
        ...item,
        name: item.name || item.food_name || item.title || 'Unknown Food',
        nameAr: item.nameAr || item.name_ar || item.arabicName || '',
        calories: Number(item.calories || item.kcal || 0),
        protein: Number(item.protein || item.protein_g || 0),
        carbs: Number(item.carbs || item.carbs_g || 0),
        fats: Number(item.fats || item.fats_g || 0),
        portion: Number(item.portion || item.serving_size || 100),
      }));

      // Merge: local first, then AI (avoid duplicates by name)
      const localNames = new Set(localResults.map(r => r.name.toLowerCase()));
      const unique = aiResults.filter(r => !localNames.has(r.name.toLowerCase()));
      return [...localResults, ...unique].slice(0, 8);
    } catch (err: any) {
      console.error('Gemini Search Error:', err);
      return localResults; // return whatever we found locally
    }
  },

  findByBarcode: async (barcode: string) => {
    try {
      const prompt = `You are a nutrition expert with knowledge of global and Egyptian food product barcodes.
Find the product with barcode: ${barcode}.

If you can identify it, return ONLY this JSON (no extra text):
{"name": "product name", "nameAr": "الاسم بالعربي", "calories": number, "protein": number, "carbs": number, "fats": number, "portion": number}

If not found, return: {"error": "not found"}`;

      const response = await GeminiService.generateText(prompt);
      const jsonMatch = response.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        if (data.error) return null;
        return {
          ...data,
          nameAr: data.nameAr || data.name_ar || data.arabicName || '',
        };
      }
      return null;
    } catch (err: any) {
      console.error('Gemini Barcode Error:', err);
      return null;
    }
  },

  getFoodDetails: async () => null,
};
