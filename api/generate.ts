// api/generate.ts (Secure Backend)
import { GoogleGenAI } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY in environment' });
  }

  const { action, familyMembers, nutritionLogs } = req.body;
  const aiClient = new GoogleGenAI({ apiKey });

  let prompt = '';

  // 1. Construct the prompt based on what the frontend asked for
  if (action === 'insights') {
    prompt = `You are an expert nutritionist AI for a family health tracking app.
Family Members: ${JSON.stringify(familyMembers, null, 2)}
Nutrition Logs (last ${nutritionLogs.length} days): ${nutritionLogs.length > 0 ? JSON.stringify(nutritionLogs, null, 2) : 'No logs yet.'}
Generate exactly 4 personalized health and nutrition recommendations as a JSON array.
Even if data is sparse, give useful general advice based on whatever is available.
Return ONLY a raw JSON array like this (no markdown, no explanation):
[{"title":"Short title","description":"2-3 sentence advice","impact":"High","color":"green","action":"nutrition"}]
Rules:
- impact: "High", "Medium", or "Low"
- color: "green", "blue", "amber"
- action: one of "family", "nutrition", "meal-planner", "grocery", "settings"`;
  } 
  else if (action === 'mealPlan') {
    prompt = `You are a professional nutritionist. Create a healthy, balanced 7-day meal plan for this family.
Family Members: ${JSON.stringify(familyMembers, null, 2)}
Recent Nutrition Data: ${nutritionLogs.length > 0 ? JSON.stringify(nutritionLogs, null, 2) : 'No logs yet — create a general healthy plan.'}
Rules:
- Respect dietary preferences and allergies
- Keep meals practical and affordable
- Return ONLY a valid JSON object (no markdown, no explanation):
{ "Sunday": {"breakfast": "...", "lunch": "...", "dinner": "...", "snack": "..."} }`;
  } 
  else {
    return res.status(400).json({ error: 'Invalid action type' });
  }

  // 2. Call Gemini securely
  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    // Send the raw text back to the frontend to be parsed
    res.status(200).json({ text: response.text });
  } catch (err: any) {
    console.error('AI Generation Error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate content' });
  }
}