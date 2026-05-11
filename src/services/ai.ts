import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
}

export const aiService = {
  async generateInsights(familyMembers: any[], nutritionLogs: any[]): Promise<any[]> {
    if (!aiClient) {
      console.error('[AI] VITE_GEMINI_API_KEY is not set. Cannot generate insights.');
      return [];
    }

    const prompt = `You are an expert nutritionist AI for a family health tracking app.

Family Members:
${JSON.stringify(familyMembers, null, 2)}

Nutrition Logs (last ${nutritionLogs.length} days):
${nutritionLogs.length > 0 ? JSON.stringify(nutritionLogs, null, 2) : 'No logs yet.'}

Generate exactly 4 personalized health and nutrition recommendations as a JSON array.
Even if data is sparse, give useful general advice based on whatever is available.

Return ONLY a raw JSON array like this (no markdown, no explanation):
[{"title":"Short title","description":"2-3 sentence advice","impact":"High","color":"green","action":"nutrition"},...]

Rules:
- impact: "High", "Medium", or "Low"
- color: "green" (positive/goal), "blue" (tip/hydration), "amber" (warning/deficiency)
- action: one of "family", "nutrition", "meal-planner", "grocery", "settings"
  Use "family" if advice is about completing profile or health goals
  Use "nutrition" if advice is about logging food, calories, macros, or water
  Use "meal-planner" if advice is about meal scheduling or recipes
  Use "grocery" if advice is about ingredients or shopping
  Use "settings" if advice is about account or preferences
- Make each recommendation specific to the family data provided`;

    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const raw = (response.text ?? '').trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      // Extract JSON array
      const start = raw.indexOf('[');
      const end = raw.lastIndexOf(']');
      if (start === -1 || end === -1) throw new Error('No JSON array in response');

      const parsed = JSON.parse(raw.slice(start, end + 1));
      if (!Array.isArray(parsed)) throw new Error('Response is not an array');

      return parsed.map((item: any, i: number) => ({
        id: i + 1,
        title: String(item.title ?? 'Recommendation'),
        description: String(item.description ?? ''),
        impact: ['High', 'Medium', 'Low'].includes(item.impact) ? item.impact : 'Medium',
        color: ['green', 'blue', 'amber'].includes(item.color) ? item.color : 'green',
        action: ['family', 'nutrition', 'meal-planner', 'grocery', 'settings'].includes(item.action)
          ? item.action
          : 'nutrition',
      }));
    } catch (err: any) {
      // Surface quota/rate-limit errors clearly
      const body = err?.message ?? '';
      const isQuota = body.includes('429') || body.includes('RESOURCE_EXHAUSTED') || body.includes('quota');
      if (isQuota) {
        throw new Error('NutriNest AI API rate limit reached. Please wait a minute and try again.');
      }
      console.error('[AI] generateInsights failed:', body);
      throw err;
    }
  },
  async generateMealPlan(
    familyMembers: any[],
    nutritionLogs: any[]
  ): Promise<Record<string, Record<string, string>>> {
    if (!aiClient) {
      console.error('[AI] VITE_GEMINI_API_KEY is not set.');
      return {};
    }

    const prompt = `You are a professional nutritionist. Create a healthy, balanced 7-day meal plan for this family.

Family Members:
${JSON.stringify(familyMembers, null, 2)}

Recent Nutrition Data (last ${nutritionLogs.length} days):
${nutritionLogs.length > 0 ? JSON.stringify(nutritionLogs, null, 2) : 'No logs yet — create a general healthy plan.'}

Rules:
- Respect dietary preferences and allergies of ALL family members
- Keep meals practical, affordable, and easy to prepare
- Vary meals across days (no repetition)
- Keep meal names short (3-6 words max), no descriptions

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "Sunday": {"breakfast": "Oats with Berries", "lunch": "Grilled Chicken Salad", "dinner": "Lentil Soup", "snack": "Apple Slices"},
  "Monday": {"breakfast": "...", "lunch": "...", "dinner": "...", "snack": "..."},
  "Tuesday": {"breakfast": "...", "lunch": "...", "dinner": "...", "snack": "..."},
  "Wednesday": {"breakfast": "...", "lunch": "...", "dinner": "...", "snack": "..."},
  "Thursday": {"breakfast": "...", "lunch": "...", "dinner": "...", "snack": "..."},
  "Friday": {"breakfast": "...", "lunch": "...", "dinner": "...", "snack": "..."},
  "Saturday": {"breakfast": "...", "lunch": "...", "dinner": "...", "snack": "..."}
}`;

    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const raw = (response.text ?? '').trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error('No JSON object in response');

      const parsed = JSON.parse(raw.slice(start, end + 1));
      return parsed;
    } catch (err: any) {
      const body = err?.message ?? '';
      const isQuota = body.includes('429') || body.includes('RESOURCE_EXHAUSTED') || body.includes('quota');
      if (isQuota) throw new Error('NutriNest AI API rate limit reached. Please wait a minute and try again.');
      console.error('[AI] generateMealPlan failed:', body);
      throw err;
    }
  },
};
