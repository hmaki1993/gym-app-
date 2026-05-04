export interface FoodItem {
  name: string;
  nameAr: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  portion: number;
  brand?: string;
  tags?: string[];
}

export const FOOD_DATABASE: FoodItem[] = [
  // ── EGGS ──
  { name: 'Boiled Egg', nameAr: 'بيضة مسلوقة', calories: 78, protein: 6.3, carbs: 0.6, fats: 5.3, portion: 50, tags: ['egg', 'بيض'] },
  { name: 'Fried Egg', nameAr: 'بيضة مقلية', calories: 90, protein: 6.3, carbs: 0.4, fats: 7, portion: 46, tags: ['egg', 'بيض'] },
  { name: 'Scrambled Eggs (2)', nameAr: 'بيض مخفوق (2)', calories: 182, protein: 12, carbs: 1.6, fats: 14, portion: 100, tags: ['egg', 'بيض'] },

  // ── CHICKEN ──
  { name: 'Grilled Chicken Breast', nameAr: 'صدر دجاج مشوي', calories: 165, protein: 31, carbs: 0, fats: 3.6, portion: 100, tags: ['chicken', 'دجاج'] },
  { name: 'Fried Chicken Breast', nameAr: 'صدر دجاج مقلي', calories: 220, protein: 28, carbs: 5, fats: 10, portion: 100, tags: ['chicken', 'دجاج'] },
  { name: 'Chicken Thigh (Grilled)', nameAr: 'فخدة دجاج مشوية', calories: 209, protein: 26, carbs: 0, fats: 11, portion: 100, tags: ['chicken', 'دجاج'] },
  { name: 'Chicken Liver', nameAr: 'كبدة دجاج', calories: 119, protein: 17, carbs: 0.7, fats: 5, portion: 100, tags: ['chicken', 'كبدة'] },
  { name: 'Grilled Kofta (Chicken)', nameAr: 'كفتة دجاج مشوية', calories: 185, protein: 22, carbs: 3, fats: 9, portion: 100, tags: ['kofta', 'كفتة', 'دجاج'] },

  // ── BEEF & MEAT ──
  { name: 'Grilled Beef (Lean)', nameAr: 'لحم بقري مشوي', calories: 215, protein: 26, carbs: 0, fats: 12, portion: 100, tags: ['beef', 'لحم'] },
  { name: 'Beef Kofta (Grilled)', nameAr: 'كفتة لحم مشوية', calories: 250, protein: 20, carbs: 5, fats: 17, portion: 100, tags: ['kofta', 'كفتة', 'لحم'] },
  { name: 'Beef Liver', nameAr: 'كبدة بقري', calories: 135, protein: 20, carbs: 3.9, fats: 3.6, portion: 100, tags: ['liver', 'كبدة'] },
  { name: 'Hawawshi', nameAr: 'حواوشي', calories: 310, protein: 18, carbs: 25, fats: 15, portion: 150, tags: ['hawawshi', 'حواوشي'] },

  // ── FISH & SEAFOOD ──
  { name: 'Tuna (Canned in Water)', nameAr: 'تونة في الماء', calories: 116, protein: 26, carbs: 0, fats: 0.8, portion: 100, tags: ['tuna', 'تونة', 'سمك'] },
  { name: 'Tuna (Canned in Oil)', nameAr: 'تونة في الزيت', calories: 198, protein: 24, carbs: 0, fats: 11, portion: 100, tags: ['tuna', 'تونة'] },
  { name: 'Grilled Fish (Seabass)', nameAr: 'قاروص مشوي', calories: 124, protein: 24, carbs: 0, fats: 2.7, portion: 100, tags: ['fish', 'سمك'] },
  { name: 'Grilled Tilapia', nameAr: 'بلطي مشوي', calories: 128, protein: 26, carbs: 0, fats: 2.7, portion: 100, tags: ['fish', 'سمك', 'بلطي'] },
  { name: 'Shrimp (Grilled)', nameAr: 'جمبري مشوي', calories: 99, protein: 24, carbs: 0.2, fats: 0.3, portion: 100, tags: ['shrimp', 'جمبري'] },

  // ── RICE & GRAINS ──
  { name: 'White Rice (Cooked)', nameAr: 'أرز أبيض مطبوخ', calories: 130, protein: 2.7, carbs: 28, fats: 0.3, portion: 100, tags: ['rice', 'أرز'] },
  { name: 'Brown Rice (Cooked)', nameAr: 'أرز بني مطبوخ', calories: 112, protein: 2.6, carbs: 24, fats: 0.9, portion: 100, tags: ['rice', 'أرز'] },
  { name: 'Egyptian Rice (Short Grain)', nameAr: 'أرز مصري', calories: 130, protein: 2.5, carbs: 28.5, fats: 0.2, portion: 100, tags: ['rice', 'أرز'] },
  { name: 'Oats (Cooked)', nameAr: 'شوفان مطبوخ', calories: 68, protein: 2.4, carbs: 12, fats: 1.4, portion: 100, tags: ['oats', 'شوفان'] },
  { name: 'Pasta (Cooked)', nameAr: 'مكرونة مطبوخة', calories: 131, protein: 5, carbs: 25, fats: 1.1, portion: 100, tags: ['pasta', 'مكرونة'] },
  { name: 'Bread (Baladi)', nameAr: 'عيش بلدي', calories: 255, protein: 9, carbs: 52, fats: 1.2, portion: 100, tags: ['bread', 'عيش', 'خبز'] },
  { name: 'Bread (Fino)', nameAr: 'فينو', calories: 270, protein: 8, carbs: 54, fats: 2.5, portion: 100, tags: ['bread', 'فينو', 'خبز'] },
  { name: 'Semolina (Cooked)', nameAr: 'سميد مطبوخ', calories: 119, protein: 4, carbs: 24, fats: 0.7, portion: 100, tags: ['semolina', 'سميد'] },

  // ── LEGUMES ──
  { name: 'Ful Medames', nameAr: 'فول مدمس', calories: 110, protein: 7.5, carbs: 18, fats: 0.5, portion: 100, tags: ['ful', 'فول'] },
  { name: 'Lentils (Cooked)', nameAr: 'عدس مطبوخ', calories: 116, protein: 9, carbs: 20, fats: 0.4, portion: 100, tags: ['lentils', 'عدس'] },
  { name: 'Chickpeas (Cooked)', nameAr: 'حمص مطبوخ', calories: 164, protein: 9, carbs: 27, fats: 2.6, portion: 100, tags: ['chickpeas', 'حمص'] },
  { name: 'Koshari', nameAr: 'كشري', calories: 170, protein: 6, carbs: 32, fats: 2.5, portion: 100, tags: ['koshari', 'كشري'] },
  { name: 'Falafel (3 pieces)', nameAr: 'طعمية (3 حبات)', calories: 285, protein: 13, carbs: 30, fats: 14, portion: 150, tags: ['falafel', 'طعمية'] },

  // ── DAIRY ──
  { name: 'Milk (Full Fat)', nameAr: 'لبن كامل الدسم', calories: 61, protein: 3.2, carbs: 4.8, fats: 3.3, portion: 100, tags: ['milk', 'لبن'] },
  { name: 'Milk (Skimmed)', nameAr: 'لبن خالي الدسم', calories: 34, protein: 3.4, carbs: 4.8, fats: 0.1, portion: 100, tags: ['milk', 'لبن'] },
  { name: 'Juhayna Milk (Full Fat)', nameAr: 'لبن جهينة كامل الدسم', calories: 61, protein: 3.2, carbs: 4.8, fats: 3.3, portion: 100, brand: 'Juhayna', tags: ['milk', 'لبن', 'جهينة'] },
  { name: 'Juhayna Yogurt', nameAr: 'زبادي جهينة', calories: 62, protein: 3.5, carbs: 6.5, fats: 2.2, portion: 100, brand: 'Juhayna', tags: ['yogurt', 'زبادي', 'جهينة'] },
  { name: 'Greek Yogurt', nameAr: 'زبادي يوناني', calories: 59, protein: 10, carbs: 3.6, fats: 0.4, portion: 100, tags: ['yogurt', 'زبادي'] },
  { name: 'Kiri Cheese (1 piece)', nameAr: 'جبنة كيري (1 قطعة)', calories: 60, protein: 2.5, carbs: 1.5, fats: 5, portion: 22, brand: 'Kiri', tags: ['cheese', 'جبن', 'كيري'] },
  { name: 'White Cheese (Domiati)', nameAr: 'جبنة بيضاء دمياطي', calories: 265, protein: 16, carbs: 0.5, fats: 22, portion: 100, tags: ['cheese', 'جبن'] },
  { name: 'Romy Cheese', nameAr: 'جبنة رومي', calories: 390, protein: 27, carbs: 0, fats: 30, portion: 100, tags: ['cheese', 'جبن', 'رومي'] },
  { name: 'Butter', nameAr: 'زبدة', calories: 717, protein: 0.9, carbs: 0.1, fats: 81, portion: 100, tags: ['butter', 'زبدة'] },

  // ── PROTEIN SUPPLEMENTS ──
  { name: 'Whey Protein Shake (1 scoop)', nameAr: 'بروتين واي (سكوب)', calories: 120, protein: 24, carbs: 3, fats: 1.5, portion: 30, tags: ['protein', 'whey', 'بروتين'] },
  { name: 'Casein Protein (1 scoop)', nameAr: 'بروتين كازين (سكوب)', calories: 110, protein: 24, carbs: 2, fats: 1, portion: 30, tags: ['protein', 'casein', 'بروتين'] },
  { name: 'Mass Gainer (1 scoop)', nameAr: 'ماس جينر (سكوب)', calories: 390, protein: 20, carbs: 70, fats: 5, portion: 100, tags: ['gainer', 'protein', 'بروتين'] },

  // ── VEGETABLES ──
  { name: 'Tomato', nameAr: 'طماطم', calories: 18, protein: 0.9, carbs: 3.9, fats: 0.2, portion: 100, tags: ['vegetable', 'طماطم'] },
  { name: 'Cucumber', nameAr: 'خيار', calories: 16, protein: 0.7, carbs: 3.6, fats: 0.1, portion: 100, tags: ['vegetable', 'خيار'] },
  { name: 'Potato (Boiled)', nameAr: 'بطاطس مسلوقة', calories: 87, protein: 1.9, carbs: 20, fats: 0.1, portion: 100, tags: ['potato', 'بطاطس'] },
  { name: 'Sweet Potato (Boiled)', nameAr: 'بطاطا حلوة مسلوقة', calories: 90, protein: 2, carbs: 21, fats: 0.1, portion: 100, tags: ['sweet potato', 'بطاطا'] },
  { name: 'Spinach (Cooked)', nameAr: 'سبانخ مطبوخة', calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4, portion: 100, tags: ['spinach', 'سبانخ'] },
  { name: 'Broccoli (Steamed)', nameAr: 'بروكلي مطهو', calories: 35, protein: 2.4, carbs: 7, fats: 0.4, portion: 100, tags: ['broccoli', 'بروكلي'] },
  { name: 'Molokhia', nameAr: 'ملوخية', calories: 43, protein: 4.8, carbs: 7.2, fats: 0.7, portion: 100, tags: ['molokhia', 'ملوخية'] },

  // ── FRUITS ──
  { name: 'Banana', nameAr: 'موز', calories: 89, protein: 1.1, carbs: 23, fats: 0.3, portion: 100, tags: ['fruit', 'موز'] },
  { name: 'Apple', nameAr: 'تفاح', calories: 52, protein: 0.3, carbs: 14, fats: 0.2, portion: 100, tags: ['fruit', 'تفاح'] },
  { name: 'Orange', nameAr: 'برتقال', calories: 47, protein: 0.9, carbs: 12, fats: 0.1, portion: 100, tags: ['fruit', 'برتقال'] },
  { name: 'Mango', nameAr: 'مانجو', calories: 60, protein: 0.8, carbs: 15, fats: 0.4, portion: 100, tags: ['fruit', 'مانجو'] },
  { name: 'Watermelon', nameAr: 'بطيخ', calories: 30, protein: 0.6, carbs: 7.6, fats: 0.2, portion: 100, tags: ['fruit', 'بطيخ'] },
  { name: 'Grapes', nameAr: 'عنب', calories: 69, protein: 0.7, carbs: 18, fats: 0.2, portion: 100, tags: ['fruit', 'عنب'] },
  { name: 'Dates', nameAr: 'بلح / تمر', calories: 282, protein: 2.5, carbs: 75, fats: 0.4, portion: 100, tags: ['dates', 'بلح', 'تمر'] },
  { name: 'Strawberry', nameAr: 'فراولة', calories: 32, protein: 0.7, carbs: 7.7, fats: 0.3, portion: 100, tags: ['fruit', 'فراولة'] },

  // ── NUTS & SEEDS ──
  { name: 'Peanut Butter (Natural)', nameAr: 'زبدة فول سوداني طبيعية', calories: 588, protein: 25, carbs: 20, fats: 50, portion: 100, tags: ['peanut butter', 'زبدة فول'] },
  { name: 'Almonds', nameAr: 'لوز', calories: 579, protein: 21, carbs: 22, fats: 50, portion: 100, tags: ['almonds', 'لوز', 'nuts'] },
  { name: 'Peanuts (Roasted)', nameAr: 'فول سوداني محمص', calories: 585, protein: 24, carbs: 21, fats: 50, portion: 100, tags: ['peanuts', 'فول سوداني'] },
  { name: 'Cashews', nameAr: 'كاجو', calories: 553, protein: 18, carbs: 30, fats: 44, portion: 100, tags: ['cashews', 'كاجو'] },
  { name: 'Sunflower Seeds', nameAr: 'بذور عباد الشمس', calories: 584, protein: 21, carbs: 20, fats: 51, portion: 100, tags: ['seeds', 'عباد الشمس'] },

  // ── OILS & FATS ──
  { name: 'Olive Oil (1 tbsp)', nameAr: 'زيت زيتون (ملعقة)', calories: 119, protein: 0, carbs: 0, fats: 14, portion: 14, tags: ['oil', 'زيت زيتون'] },
  { name: 'Sunflower Oil (1 tbsp)', nameAr: 'زيت عباد الشمس (ملعقة)', calories: 124, protein: 0, carbs: 0, fats: 14, portion: 14, tags: ['oil', 'زيت'] },

  // ── EGYPTIAN SNACKS & BRANDS ──
  { name: 'Chipsy (Regular, 1 bag)', nameAr: 'شيبسي (كيس عادي)', calories: 150, protein: 2, carbs: 16, fats: 9, portion: 28, brand: 'Chipsy', tags: ['chips', 'شيبسي', 'snack'] },
  { name: 'Halawa (Tahini)', nameAr: 'حلاوة طحينية', calories: 469, protein: 10, carbs: 55, fats: 25, portion: 100, tags: ['halawa', 'حلاوة'] },
  { name: 'Tahini (Sesame Paste)', nameAr: 'طحينة', calories: 595, protein: 17, carbs: 24, fats: 54, portion: 100, tags: ['tahini', 'طحينة'] },
  { name: 'Honey (1 tbsp)', nameAr: 'عسل (ملعقة)', calories: 64, protein: 0.1, carbs: 17, fats: 0, portion: 21, tags: ['honey', 'عسل'] },
  { name: 'Jam (Strawberry, 1 tbsp)', nameAr: 'مربى فراولة (ملعقة)', calories: 56, protein: 0.1, carbs: 14, fats: 0, portion: 20, tags: ['jam', 'مربى'] },
  { name: 'Biscuit Petit Beurre (4 pieces)', nameAr: 'بسكويت بتي بر (4 قطع)', calories: 180, protein: 3, carbs: 27, fats: 7, portion: 45, tags: ['biscuit', 'بسكويت'] },

  // ── FAST FOOD (Egypt) ──
  { name: 'Shawarma (Chicken)', nameAr: 'شاورما دجاج', calories: 320, protein: 25, carbs: 30, fats: 10, portion: 200, tags: ['shawarma', 'شاورما'] },
  { name: 'Shawarma (Meat)', nameAr: 'شاورما لحم', calories: 380, protein: 22, carbs: 30, fats: 16, portion: 200, tags: ['shawarma', 'شاورما'] },
  { name: 'Pizza Slice (Regular)', nameAr: 'شريحة بيتزا', calories: 272, protein: 11, carbs: 33, fats: 10, portion: 107, tags: ['pizza', 'بيتزا'] },

  // ── BEVERAGES ──
  { name: 'Orange Juice (Fresh)', nameAr: 'عصير برتقال طازج', calories: 45, protein: 0.7, carbs: 10, fats: 0.2, portion: 100, tags: ['juice', 'عصير'] },
  { name: 'Sugarcane Juice', nameAr: 'عصير قصب', calories: 73, protein: 0.4, carbs: 18, fats: 0.1, portion: 100, tags: ['juice', 'قصب'] },
  { name: 'Coffee (Black, no sugar)', nameAr: 'قهوة سوداء بدون سكر', calories: 2, protein: 0.3, carbs: 0, fats: 0, portion: 240, tags: ['coffee', 'قهوة'] },
  { name: 'Tea with Sugar (1 cup)', nameAr: 'شاي بالسكر (كوب)', calories: 35, protein: 0, carbs: 9, fats: 0, portion: 240, tags: ['tea', 'شاي'] },

  // ── SAUCES ──
  { name: 'Ketchup (1 tbsp)', nameAr: 'كاتشب (ملعقة)', calories: 19, protein: 0.2, carbs: 4.6, fats: 0.1, portion: 17, tags: ['ketchup', 'كاتشب'] },
  { name: 'Mayonnaise (1 tbsp)', nameAr: 'مايونيز (ملعقة)', calories: 94, protein: 0.1, carbs: 0.1, fats: 10, portion: 14, tags: ['mayo', 'مايونيز'] },
];

export function searchLocalDB(query: string): FoodItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const scored = FOOD_DATABASE.map(item => {
    let score = 0;
    const name = item.name.toLowerCase();
    const nameAr = item.nameAr.toLowerCase();
    const tagsStr = (item.tags || []).join(' ').toLowerCase();
    const brand = (item.brand || '').toLowerCase();

    if (name === q || nameAr === q) score += 100;
    else if (name.startsWith(q) || nameAr.startsWith(q)) score += 80;
    else if (name.includes(q) || nameAr.includes(q)) score += 60;
    else if (tagsStr.includes(q)) score += 40;
    else if (brand.includes(q)) score += 30;
    else {
      const words = q.split(' ');
      words.forEach(w => {
        if (w.length > 2 && (name.includes(w) || nameAr.includes(w) || tagsStr.includes(w))) score += 20;
      });
    }

    return { item, score };
  });

  return scored
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(x => x.item);
}
