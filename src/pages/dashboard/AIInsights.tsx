import { useState, useEffect, useCallback } from 'react';
import { Zap, ArrowRight, RefreshCw, Loader2, AlertCircle, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFamilyMembers } from '../../hooks/useFamilyMembers';
import { useNutritionLogs } from '../../hooks/useNutritionLogs';
import { aiService } from '../../services/ai';
import { supabase } from '../../services/supabaseClient';
import { aiRecommendations as mockRecommendations } from '../../data/mockData';

const colorStyles: Record<string, { bg: string; badge: string; dot: string }> = {
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800',
    badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-400',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800',
    badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-400',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800',
    badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-400',
  },
};

// Destination route map
const routeMap: Record<string, string> = {
  family: '/dashboard/family',
  nutrition: '/dashboard/nutrition',
  'meal-planner': '/dashboard/meal-planner',
  grocery: '/dashboard/grocery',
  settings: '/dashboard/settings',
};

const destinationLabel: Record<string, string> = {
  family: 'Family',
  nutrition: 'Nutrition',
  'meal-planner': 'Meal Planner',
  grocery: 'Grocery',
  settings: 'Settings',
};

// Broad keyword inference — used only as fallback when action not in DB
function inferAction(title: string, desc: string): string {
  const text = `${title} ${desc}`.toLowerCase();
  // Family / profile related
  if (/\b(profile|family|member|complet|health goal|height|weight|bmi|allergies?|age|activity|diet pref)\b/.test(text)) return 'family';
  // Meal planning
  if (/\b(meal plan|breakfast|lunch|dinner|snack|recipe|weekly plan|cooking|food prep|eat|dish|cuisine)\b/.test(text)) return 'meal-planner';
  // Grocery
  if (/\b(groceries|grocery|shopping|ingredient|pantry|buy|store|purchase)\b/.test(text)) return 'grocery';
  // Settings
  if (/\b(setting|preference|account|notification|theme)\b/.test(text)) return 'settings';
  // Nutrition (catch-all for calorie/macro/water/log tracking)
  return 'nutrition';
}

interface DisplayRec {
  id: string | number;
  title: string;
  description: string;
  impact: string;
  color: string;
  action?: string;
}

export default function AIInsights() {
  const { isDemoMode, familyId, user, bootstrapError, isBootstrapping } = useAuth();
  const navigate = useNavigate();
  const { members } = useFamilyMembers(familyId, isDemoMode);
  const memberIds = members.map(m => m.id);
  const { logs } = useNutritionLogs(memberIds, isDemoMode);

  const [insights, setInsights] = useState<DisplayRec[]>([]);
  const [topInsight, setTopInsight] = useState<DisplayRec | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string | number>>(new Set());

  const applyInsight = async (rec: DisplayRec) => {
    const action = rec.action ?? 'nutrition';
    const route = routeMap[action] ?? '/dashboard/nutrition';

    // Visual feedback first
    setAppliedIds(prev => new Set([...prev, rec.id]));
    setTimeout(() => {
      setInsights(prev => prev.filter(r => r.id !== rec.id));
      setAppliedIds(prev => { const s = new Set(prev); s.delete(rec.id); return s; });
      setTopInsight(prev => (prev?.id === rec.id ? null : prev));
      navigate(route);
    }, 700);

    // Mark as read in Supabase
    if (familyId && typeof rec.id === 'string') {
      await supabase.from('ai_recommendations').update({ is_read: true }).eq('id', rec.id);
    }
  };

  // Load cached insights from DB
  const loadCached = useCallback(async () => {
    if (isDemoMode) {
      setInsights(mockRecommendations as any);
      setTopInsight(mockRecommendations[0] as any);
      return;
    }
    if (!familyId) return; // Wait for bootstrap

    try {
      const { data } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(6);

      if (data && data.length > 0) {
        const mapped: DisplayRec[] = data.map((r: any, i: number) => ({
          id: r.id ?? i + 1,
          title: r.title,
          description: r.message,
          impact: r.priority ?? 'Medium',
          color: r.recommendation_type === 'warning' ? 'amber'
                : r.recommendation_type === 'tip' ? 'blue' : 'green',
          // Use stored action first, fall back to keyword inference for old rows
          action: r.action ?? inferAction(r.title ?? '', r.message ?? ''),
        }));
        setInsights(mapped);
        setTopInsight(mapped[0]);
      }
      // else: show empty state with "Generate" CTA
    } catch (err) {
      console.error('[AI] Failed to load cached insights:', err);
    }
  }, [isDemoMode, familyId]);

  useEffect(() => { loadCached(); }, [loadCached]);

  const generateInsights = async () => {
    if (isDemoMode || !user) return;
    setIsGenerating(true);
    setGenError(null);

    try {
      // Build context from whatever data we have
      const familyContext = members.map(m => ({
        name: m.name,
        age: m.age,
        dietary_preference: m.dietary_preference,
        calorie_goal: m.calorie_goal,
        protein_goal: m.protein_goal,
        activity_level: m.activity_level,
        allergies: m.allergies ?? [],
      }));

      const nutritionContext = logs.slice(-14).map(l => ({
        date: l.log_date,
        calories: l.calories,
        protein: l.protein,
        carbs: l.carbs,
        fats: l.fats,
        water_ml: l.water_intake_ml,
      }));

      // If we have no family data at all, still call AI with a generic prompt
      const contextToSend = familyContext.length > 0
        ? familyContext
        : [{ name: 'User', age: null, dietary_preference: null, calorie_goal: null, protein_goal: null, activity_level: null, allergies: [] }];

      const newInsights = await aiService.generateInsights(contextToSend, nutritionContext);

      if (newInsights.length === 0) {
        setGenError('AI returned no insights. Check browser console for details.');
        return;
      }

      // Save to Supabase if we have a familyId (now includes action column)
      if (familyId) {
        await supabase.from('ai_recommendations').delete().eq('family_id', familyId);
        const toInsert = newInsights.map((r: any) => {
          const action = r.action ?? inferAction(r.title ?? '', r.description ?? '');
          return {
            family_id: familyId,
            recommendation_type: r.color === 'amber' ? 'warning' : r.color === 'blue' ? 'tip' : 'health',
            title: r.title,
            message: r.description,
            priority: r.impact,
            action,          // ← stored so Apply routing survives page refresh
            is_read: false,
          };
        });
        await supabase.from('ai_recommendations').insert(toInsert);
      }

      const mapped: DisplayRec[] = newInsights.map((r: any, i: number) => ({
        id: i + 1,
        title: r.title,
        description: r.description,
        impact: r.impact,
        color: r.color,
        // Use AI-provided action if valid, otherwise infer from keywords
        action: r.action ?? inferAction(r.title ?? '', r.description ?? ''),
      }));
      setInsights(mapped);
      setTopInsight(mapped[0] ?? null);
    } catch (err: any) {
      console.error('[AI] generateInsights error:', err);
      setGenError(err.message ?? 'Failed to generate insights. See console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const displayRecs = isDemoMode ? (mockRecommendations as any[]) : insights;
  const isNotReady = !isDemoMode && (isBootstrapping || (bootstrapError !== null));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Recommendations</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isDemoMode
              ? "Personalized insights to optimize your family's nutrition."
              : 'Generated by NutriNest AI from your real family and nutrition data.'}
          </p>
        </div>
        <button
          onClick={generateInsights}
          disabled={isGenerating || isDemoMode || isNotReady}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {isGenerating ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          {isGenerating ? 'Generating…' : 'Generate Insights'}
        </button>
      </div>

      {/* Bootstrap error banner */}
      {!isDemoMode && bootstrapError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">Profile setup failed</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
              Run <code className="font-mono bg-red-100 dark:bg-red-900/40 px-1 rounded">supabase_schema.sql</code> in your Supabase SQL Editor, then refresh the page.
            </p>
          </div>
        </div>
      )}

      {/* Generation error */}
      {genError && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-300">{genError}</p>
        </div>
      )}

      {/* Top insight hero */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={18} />
            <span className="text-sm font-semibold">This Week's Top Insight</span>
          </div>
          {isGenerating ? (
            <div className="flex items-center gap-3">
              <Loader2 size={20} className="animate-spin" />
              <span>NutriNest AI is analyzing your family's nutrition data…</span>
            </div>
          ) : topInsight ? (
            <>
              <h2 className="text-xl font-bold mb-2">{topInsight.title}</h2>
              <p className="text-emerald-100 text-sm">{topInsight.description}</p>
              <div className="mt-4 text-sm font-semibold flex items-center gap-2">
                Impact: <span className="bg-white/20 px-2 py-0.5 rounded-lg">{topInsight.impact}</span>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-2">
                {isDemoMode ? 'Your family is hitting protein goals 3 out of 7 days' : 'No insights generated yet'}
              </h2>
              <p className="text-emerald-100 text-sm">
                {isDemoMode
                  ? 'Add a protein-rich snack like Greek yogurt or hard-boiled eggs to close the gap.'
                  : 'Click "Generate Insights" above to get personalized AI recommendations based on your data.'}
              </p>
              {!isDemoMode && !bootstrapError && (
                <button
                  onClick={generateInsights}
                  disabled={isGenerating}
                  className="mt-4 flex items-center gap-2 text-sm font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Generate Now <ArrowRight size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid md:grid-cols-2 gap-5">
        {isGenerating ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border p-6 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 animate-pulse">
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
            </div>
          ))
        ) : displayRecs.length === 0 ? (
          <div className="md:col-span-2 text-center py-12 border border-dashed rounded-2xl border-gray-200 dark:border-gray-800 text-gray-500">
            <Zap size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
              {isDemoMode ? 'AI Insights' : 'No insights yet'}
            </p>
            {!isDemoMode && (
              <>
                <p className="text-sm mb-4">
                  Click "Generate Insights" to get personalized recommendations from NutriNest AI.
                </p>
                <button
                  onClick={generateInsights}
                  disabled={isGenerating || isNotReady}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-2 mx-auto"
                >
                  <Zap size={14} />
                  Generate Insights
                </button>
              </>
            )}
          </div>
        ) : (
          displayRecs.map((rec: any) => {
            const style = colorStyles[rec.color] ?? colorStyles.green;
            const isApplied = appliedIds.has(rec.id);
            return (
              <div
                key={rec.id}
                className={`rounded-2xl border p-6 transition-all duration-500 ${isApplied ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100'} ${style.bg}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${style.badge}`}>
                      {rec.title}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${style.badge}`}>
                    {rec.impact}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  {rec.description}
                </p>
                <button
                  onClick={() => applyInsight(rec)}
                  className={`text-xs font-semibold flex items-center gap-1.5 transition-all px-3 py-1.5 rounded-lg ${
                    isApplied
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-white hover:bg-emerald-500 bg-white/50 dark:bg-gray-800/50'
                  }`}
                >
                  {isApplied
                    ? <><Check size={12} /> Applied!</>
                    : <>
                        Apply
                        <span className="opacity-60">→</span>
                        <span className="font-bold">
                          {destinationLabel[rec.action ?? 'nutrition'] ?? 'Nutrition'}
                        </span>
                        <ArrowRight size={11} />
                      </>}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Nutrition score */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Family Nutrition Score</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Balance', score: isDemoMode ? 82 : Math.min(100, logs.length * 12), color: 'emerald' },
            { label: 'Variety', score: isDemoMode ? 74 : Math.min(100, logs.length * 15), color: 'blue' },
            { label: 'Consistency', score: isDemoMode ? 68 : Math.min(100, logs.length * 14), color: 'amber' },
          ].map(({ label, score, color }) => (
            <div key={label} className="text-center">
              <div className={`text-3xl font-black mb-1 ${color === 'emerald' ? 'text-emerald-600' : color === 'blue' ? 'text-blue-600' : 'text-amber-600'}`}>
                {score}
              </div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{label}</div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${color === 'emerald' ? 'bg-emerald-500' : color === 'blue' ? 'bg-blue-500' : 'bg-amber-500'}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
