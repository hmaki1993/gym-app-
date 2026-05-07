// import { GoogleGenerativeAI } from '@google/generative-ai';

// Build trigger: 2026-05-02 14:17
const getKeys = () => {
  const keys = [];
  // START WITH THE NEWEST KEY (#3)
  if (import.meta.env.VITE_GEMINI_KEY_3) keys.push(import.meta.env.VITE_GEMINI_KEY_3);
  if (import.meta.env.VITE_GEMINI_KEY_2) keys.push(import.meta.env.VITE_GEMINI_KEY_2);
  if (import.meta.env.VITE_GEMINI_KEY) keys.push(import.meta.env.VITE_GEMINI_KEY);
  if (import.meta.env.VITE_GEMINI_API_KEY && import.meta.env.VITE_GEMINI_API_KEY !== import.meta.env.VITE_GEMINI_KEY) 
    keys.push(import.meta.env.VITE_GEMINI_API_KEY);
  return keys.filter(k => k && k.trim().length > 0);
};

let currentKeyIndex = 0;
const rotateKey = () => {
  const keys = getKeys();
  if (keys.length > 1) {
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    console.log(`🔄 Rotating to API Key #${currentKeyIndex + 1}`);
  }
};

const getActiveKey = () => {
  const keys = getKeys();
  return keys[currentKeyIndex] || keys[0] || '';
};

console.log('Gemini API Keys found:', getKeys().length);

export const GeminiService = {
  listModels: async (): Promise<void> => {
    const key = getActiveKey();
    if (!key) return;
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${key.trim()}`);
      const data = await response.json();
      console.log('📋 Available Models for this Key:', data.models?.map((m: any) => m.name.replace('models/', '')));
    } catch (err) {
      console.error('Failed to list models:', err);
    }
  },

  analyzeMeal: async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<any> => {
    const key = getActiveKey();
    if (!key) throw new Error('API Key missing');

    try {
      console.log(`📡 Header Auth Analysis with Key: ${key.substring(0, 6)}...`);
      const prompt = `Analyze this food image. Return ONLY a valid JSON object: {"name":"food name","nameAr":"الاسم بالعربي","calories":number,"protein":number,"carbs":number,"fats":number,"portion":number}. Be highly accurate.`;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-goog-api-key': key.trim()
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: base64Image } }
            ]
          }]
        })
      });

      if (!response.ok) {
        const err = await response.json();
        console.error('Gemini API Error Response:', err);
        if (response.status === 429) rotateKey();
        throw new Error(err.error?.message || 'Gemini API Error');
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          name: parsed.name || 'Analyzed Meal',
          nameAr: parsed.nameAr || '',
          calories: Math.round(parsed.calories) || 0,
          protein: Math.round(parsed.protein) || 0,
          carbs: Math.round(parsed.carbs) || 0,
          fats: Math.round(parsed.fats) || 0,
          portion: Math.round(parsed.portion) || 300
        };
      }
      throw new Error('Invalid response format');
    } catch (err: any) {
      console.error('Gemini Direct Error:', err);
      if (err.message?.includes('429') || err.message?.includes('404')) rotateKey();
      throw err;
    }
  },

  generateText: async (prompt: string): Promise<string> => {
    const key = getActiveKey();
    if (!key) throw new Error('API Key missing');

    try {
      console.log(`📡 Header Auth Text with Key: ${key.substring(0, 6)}...`);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-goog-api-key': key.trim()
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        const err = await response.json();
        if (response.status === 429) rotateKey();
        throw new Error(err.error?.message || 'Gemini API Error');
      }

      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (err: any) {
      console.error('Gemini Direct Text Error:', err);
      if (err.message?.includes('429') || err.message?.includes('404')) rotateKey();
      throw err;
    }
  },

  translateExercise: async (name: string, muscleGroup?: string): Promise<{ en: string, ar: string }> => {
    const prompt = `Analyze this gym exercise: "${name}"${muscleGroup ? ` (targeted muscle: ${muscleGroup})` : ''}.
    The input might be in English, Arabic, or Franco-Arabic (slang).
    
    TASK:
    1. Identify the standard English name (e.g., "EZ Bar Bicep Curl").
    2. Provide a clear Arabic translation (e.g., "بايسبس بالبار الزجزاج").
    
    RULES:
    - If the input mentions a specific equipment (like "bar zegzag"), keep it in the name.
    - DO NOT map to a completely different exercise (e.g., don't turn a bicep move into a bench press).
    - If unsure, preserve the user's original words but format them nicely.
    
    Return ONLY a valid JSON object: {"en":"Standard Name", "ar":"الاسم بالعربي"}.`;
    
    try {
      const result = await GeminiService.generateText(prompt);
      const jsonMatch = result.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { en: name, ar: name };
    } catch (err) {
      console.error('Translation failed:', err);
      return { en: name, ar: name };
    }
  }
};

// Call immediately to diagnose
GeminiService.listModels();
