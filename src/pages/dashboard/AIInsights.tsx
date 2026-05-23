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

function inferAction(title: string, desc: string): string {
  const text = `${title} ${desc}`.toLowerCase();
  if (/\b(profile|family|member|complet|health goal|height|weight|bmi|allergies?|age|activity|diet pref)\b/.test(text)) return 'family';
  if (/\b(meal plan|breakfast|lunch|dinner|snack|recipe|weekly plan|cooking|food prep|eat|dish|cuisine)\b/.test(text)) return 'meal-planner';
  if (/\b(groceries|grocery|shopping|ingredient|pantry|buy|store|purchase)\b/.test(text)) return 'grocery';
  if (/\b(setting|preference|account|notification|theme)\b/.test(text)) return 'settings';
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
  
  // Mobile Modal state manager
  const [selectedMobileRec, setSelectedMobileRec] = useState<DisplayRec | null>(null);

  const applyInsight = async (rec: DisplayRec) => {
    const action = rec.action ?? 'nutrition';
    const route = routeMap[action] ?? '/dashboard/nutrition';

    setAppliedIds(prev => new Set([...prev, rec.id]));
    
    // Auto-close open modal container gracefully if applying from within it
    setSelectedMobileRec(null);

    setTimeout(() => {
      setInsights(prev => prev.filter(r => r.id !== rec.id));
      setAppliedIds(prev => { const s = new Set(prev); s.delete(rec.id); return s; });
      setTopInsight(prev => (prev?.id === rec.id ? null : prev));
      navigate(route);
    }, 700);

    if (familyId && typeof rec.id === 'string') {
      await supabase.from('ai_recommendations').update({ is_read: true }).eq('id', rec.id);
    }
  };

  const loadCached = useCallback(async () => {
    if (isDemoMode) {
      setInsights(mockRecommendations as any);
      setTopInsight(mockRecommendations[0] as any);
      return;
    }
    if (!familyId) return;

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
          action: r.action ?? inferAction(r.title ?? '', r.message ?? ''),
        }));
        setInsights(mapped);
        setTopInsight(mapped[0]);
      }
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

      const contextToSend = familyContext.length > 0
        ? familyContext
        : [{ name: 'User', age: null, dietary_preference: null, calorie_goal: null, protein_goal: null, activity_level: null, allergies: [] }];

      const newInsights = await aiService.generateInsights(contextToSend, nutritionContext);

      if (newInsights.length === 0) {
        setGenError('AI returned no insights. Check browser console for details.');
        return;
      }

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
            action,
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
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">AI Recommendations</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isDemoMode
              ? "Personalized insights to optimize your family's nutrition."
              : 'Generated by NutriNest AI from your real family and nutrition data.'}
          </p>
        </div>
        <button
          onClick={generateInsights}
          disabled={isGenerating || isDemoMode || isNotReady}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors w-full sm:w-auto"
        >
          {isGenerating ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          {isGenerating ? 'Generating…' : 'Generate Insights'}
        </button>
      </div>

      {bootstrapError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">Profile setup failed</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 break-words">
              Run <code className="font-mono bg-red-100 dark:bg-red-900/40 px-1 rounded">supabase_schema.sql</code> in your Supabase SQL Editor, then refresh the page.
            </p>
          </div>
        </div>
      )}

      {genError && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-300 break-words">{genError}</p>
        </div>
      )}

      {/* Hero insight block */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={18} />
            <span className="text-xs sm:text-sm font-semibold">This Week's Top Insight</span>
          </div>
          {isGenerating ? (
            <div className="flex items-center gap-3 text-sm">
              <Loader2 size={20} className="animate-spin flex-shrink-0" />
              <span>NutriNest AI is analyzing your family's nutrition data…</span>
            </div>
          ) : topInsight ? (
            <>
              <h2 className="text-lg sm:text-xl font-bold mb-2">{topInsight.title}</h2>
              <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">{topInsight.description}</p>
              <div className="mt-4 text-xs sm:text-sm font-semibold flex items-center gap-2">
                Impact: <span className="bg-white/20 px-2 py-0.5 rounded-lg">{topInsight.impact}</span>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg sm:text-xl font-bold mb-2">
                {isDemoMode ? 'Your family is hitting protein goals 3 out of 7 days' : 'No insights generated yet'}
              </h2>
              <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
                {isDemoMode
                  ? 'Add a protein-rich snack like Greek yogurt or hard-boiled eggs to close the gap.'
                  : 'Click "Generate Insights" above to get personalized AI recommendations based on your data.'}
              </p>
              {!isDemoMode && !bootstrapError && (
                <button
                  onClick={generateInsights}
                  disabled={isGenerating}
                  className="mt-4 inline-flex items-center gap-2 text-xs sm:text-sm font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Generate Now <ArrowRight size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Recommendations Grid Layout 
          Converted from `grid-cols-1 md:grid-cols-2` to `grid-cols-2 md:grid-cols-2` 
          to enforce a stable 2-card-per-row framework on mobile screens.
      */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-5">
        {isGenerating ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border p-4 sm:p-6 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 animate-pulse">
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
            </div>
          ))
        ) : displayRecs.length === 0 ? (
          <div className="col-span-2 text-center py-12 border border-dashed rounded-2xl border-gray-200 dark:border-gray-800 text-gray-500 px-4">
            <Zap size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
              {isDemoMode ? 'AI Insights' : 'No insights yet'}
            </p>
            {!isDemoMode && (
              <>
                <p className="text-xs sm:text-sm mb-4">
                  Click "Generate Insights" to get personalized recommendations from NutriNest AI.
                </p>
                <button
                  onClick={generateInsights}
                  disabled={isGenerating || isNotReady}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl inline-flex items-center gap-2 mx-auto"
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
                onClick={() => {
                  // Only launch modal on mobile layouts (screens below md breakpoint)
                  if (window.innerWidth < 768) {
                    setSelectedMobileRec(rec);
                  }
                }}
                className={`rounded-2xl border p-3.5 sm:p-6 transition-all duration-500 flex flex-col justify-between cursor-pointer md:cursor-default ${
                  isApplied ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100'
                } ${style.bg}`}
              >
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 mb-2.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
                      <span className={`px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold truncate ${style.badge}`}>
                        {rec.title}
                      </span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold self-start sm:self-auto flex-shrink-0 ${style.badge}`}>
                      {rec.impact}
                    </span>
                  </div>
                  {/* line-clamp rules prevent overflow breaking your tight grid layout rows on mobile */}
                  <p className="text-[11px] sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3 line-clamp-3 md:line-clamp-none">
                    {rec.description}
                  </p>
                </div>
                
                {/* Desktop-only explicit block actions row */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    applyInsight(rec);
                  }}
                  className={`hidden md:flex text-[11px] font-semibold items-center justify-start gap-1.5 transition-all px-3 py-2 rounded-lg w-auto self-start ${
                    isApplied
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-white hover:bg-emerald-500 bg-white/50 dark:bg-gray-800/50'
                  }`}
                >
                  {isApplied ? (
                    <><Check size={12} /> Applied!</>
                  ) : (
                    <>
                      Apply <span className="opacity-60">→</span>
                      <span className="font-bold truncate max-w-[100px]">
                        {destinationLabel[rec.action ?? 'nutrition'] ?? 'Nutrition'}
                      </span>
                      <ArrowRight size={11} className="flex-shrink-0" />
                    </>
                  )}
                </button>
                
                {/* Visual indicator link strictly for mobile tap feedback */}
                <span className="md:hidden text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-auto flex items-center gap-0.5">
                  View & Apply <ArrowRight size={9} />
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Metrics breakdown matrix row */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6 w-full">
        <h2 className="font-semibold text-gray-900 dark:text-white text-base mb-4">Family Nutrition Score</h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { label: 'Balance', score: isDemoMode ? 82 : Math.min(100, logs.length * 12), color: 'emerald' },
            { label: 'Variety', score: isDemoMode ? 74 : Math.min(100, logs.length * 15), color: 'blue' },
            { label: 'Consistency', score: isDemoMode ? 68 : Math.min(100, logs.length * 14), color: 'amber' },
          ].map(({ label, score, color }) => (
            <div key={label} className="text-center">
              <div className={`text-xl sm:text-3xl font-black mb-1 ${color === 'emerald' ? 'text-emerald-600' : color === 'blue' ? 'text-blue-600' : 'text-amber-600'}`}>
                {score}
              </div>
              <div className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 truncate">{label}</div>
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

      {/* INTERACTIVE MOBILE DETAIL ACTION MODAL OVERLAY */}
      {selectedMobileRec && (() => {
        const style = colorStyles[selectedMobileRec.color] ?? colorStyles.green;
        const isApplied = appliedIds.has(selectedMobileRec.id);
        
        return (
          <div className="md:hidden fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
            {/* Click-away overlay wrapper */}
            <div className="absolute inset-0" onClick={() => setSelectedMobileRec(null)} />
            
            {/* Modal Box */}
            <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl p-5 shadow-2xl relative z-10 border border-gray-100 dark:border-gray-800 transform translate-y-0 transition-transform duration-300">
              <div className="flex items-center gap-2 mb-3 mt-1">
                <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${style.badge}`}>
                  {selectedMobileRec.title}
                </span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ml-auto ${style.badge}`}>
                  {selectedMobileRec.impact}
                </span>
              </div>

              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                {selectedMobileRec.title}
              </h3>
              
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                {selectedMobileRec.description}
              </p>

              <button
                onClick={() => applyInsight(selectedMobileRec)}
                className={`text-xs font-semibold flex items-center justify-center gap-2 transition-all px-4 py-3 rounded-xl w-full ${
                  isApplied
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/10'
                }`}
              >
                {isApplied ? (
                  <><Check size={14} /> Applied Successfully!</>
                ) : (
                  <>
                    Apply Action to {destinationLabel[selectedMobileRec.action ?? 'nutrition'] ?? 'Nutrition'}
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}