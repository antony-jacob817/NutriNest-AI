// src/ai.ts (Frontend)

export const aiService = {
  async generateInsights(familyMembers: any[], nutritionLogs: any[]): Promise<any[]> {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'insights', familyMembers, nutritionLogs }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const isQuota = errorData.error?.includes('429') || errorData.error?.includes('quota');
        if (isQuota) throw new Error('NutriNest AI API rate limit reached. Please wait a minute.');
        throw new Error(errorData.error || 'Failed to fetch insights');
      }

      const data = await response.json();
      
      // Clean and parse the JSON string returned by the backend
      const raw = (data.text ?? '').trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const start = raw.indexOf('[');
      const end = raw.lastIndexOf(']');
      if (start === -1 || end === -1) throw new Error('No JSON array in response');

      const parsed = JSON.parse(raw.slice(start, end + 1));
      
      return parsed.map((item: any, i: number) => ({
        id: i + 1,
        title: String(item.title ?? 'Recommendation'),
        description: String(item.description ?? ''),
        impact: ['High', 'Medium', 'Low'].includes(item.impact) ? item.impact : 'Medium',
        color: ['green', 'blue', 'amber'].includes(item.color) ? item.color : 'green',
        action: ['family', 'nutrition', 'meal-planner', 'grocery', 'settings'].includes(item.action) ? item.action : 'nutrition',
      }));

    } catch (err: any) {
      console.error('[AI] generateInsights failed:', err);
      throw err;
    }
  },

  async generateMealPlan(familyMembers: any[], nutritionLogs: any[]): Promise<Record<string, Record<string, string>>> {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mealPlan', familyMembers, nutritionLogs }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const isQuota = errorData.error?.includes('429') || errorData.error?.includes('quota');
        if (isQuota) throw new Error('NutriNest AI API rate limit reached. Please wait a minute.');
        throw new Error(errorData.error || 'Failed to fetch meal plan');
      }

      const data = await response.json();

      const raw = (data.text ?? '').trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error('No JSON object in response');

      return JSON.parse(raw.slice(start, end + 1));

    } catch (err: any) {
      console.error('[AI] generateMealPlan failed:', err);
      throw err;
    }
  },
};