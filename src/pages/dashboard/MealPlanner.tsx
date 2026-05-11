import { useState } from 'react';
import { Pencil, Check, Loader2, Plus, X, Trash2, Sparkles, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMealPlans, MealType } from '../../hooks/useMealPlans';
import { useFamilyMembers } from '../../hooks/useFamilyMembers';
import { useNutritionLogs } from '../../hooks/useNutritionLogs';
import { aiService } from '../../services/ai';
import { weeklyMealPlan } from '../../data/mockData';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function MealPlanner() {
  const { isDemoMode, familyId } = useAuth();
  const { weekDays, isLoading, upsertMeal, deleteMeal } = useMealPlans(familyId, isDemoMode);
  const { members } = useFamilyMembers(familyId, isDemoMode);
  const memberIds = members.map(m => m.id);
  const { logs } = useNutritionLogs(memberIds, isDemoMode);

  const [editing, setEditing] = useState<{ day: string; type: MealType } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<{ day: string; type: MealType } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genSuccess, setGenSuccess] = useState(false);

  const startEdit = (day: string, type: MealType, current: string) => {
    setEditing({ day, type });
    setEditValue(current);
  };

  const saveEdit = async () => {
    if (!editing || isDemoMode) { setEditing(null); return; }
    if (!editValue.trim()) {
      await handleDelete(editing.day, editing.type);
      setEditing(null);
      return;
    }
    setIsSaving(true);
    try {
      await upsertMeal(editing.day, editing.type, editValue.trim());
    } catch (err) {
      console.error('Failed to save meal', err);
    } finally {
      setIsSaving(false);
      setEditing(null);
    }
  };

  const handleDelete = async (day: string, type: MealType) => {
    if (isDemoMode) return;
    setIsDeleting({ day, type });
    try { await deleteMeal(day, type); }
    catch (err) { console.error('Failed to delete meal', err); }
    finally { setIsDeleting(null); }
  };

  const handleAIGenerate = async () => {
    if (isDemoMode || !familyId) return;
    setIsGenerating(true);
    setGenError(null);
    setGenSuccess(false);
    try {
      const plan = await aiService.generateMealPlan(members, logs);
      // Save each meal to Supabase
      const allSaves: Promise<void>[] = [];
      for (const day of DAYS) {
        const dayPlan = plan[day];
        if (!dayPlan) continue;
        for (const type of ['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]) {
          if (dayPlan[type]) {
            allSaves.push(upsertMeal(day, type, dayPlan[type]));
          }
        }
      }
      await Promise.all(allSaves);
      setGenSuccess(true);
      setTimeout(() => setGenSuccess(false), 3000);
    } catch (err: any) {
      setGenError(err.message ?? 'AI generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const displayRows = isDemoMode
    ? weeklyMealPlan.map(d => ({
        day: d.day,
        breakfast: d.breakfast,
        lunch: d.lunch,
        dinner: d.dinner,
        snack: d.snack,
        mealIds: {},
      }))
    : weekDays;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Meal Planner</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isDemoMode
              ? "AI-generated plan tailored to your family's needs."
              : 'Click a meal to edit · Hover to delete · Or let AI plan the whole week.'}
          </p>
        </div>

        {!isDemoMode && (
          <div className="flex items-center gap-2">
            {/* AI Generate button */}
            <button
              onClick={handleAIGenerate}
              disabled={isGenerating || isLoading}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 ${
                genSuccess
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-sm'
              }`}
            >
              {isGenerating ? (
                <><Loader2 size={14} className="animate-spin" /> Generating…</>
              ) : genSuccess ? (
                <><Check size={14} /> Plan Ready!</>
              ) : (
                <><Sparkles size={14} /> AI Generate Plan</>
              )}
            </button>

            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-xl">
              <Plus size={12} /> Click any cell to add
            </div>
          </div>
        )}
      </div>

      {/* AI generation error */}
      {genError && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
          <span>{genError}</span>
          <button onClick={() => setGenError(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* AI generating overlay hint */}
      {isGenerating && (
        <div className="flex items-center gap-3 px-4 py-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/40 rounded-xl text-sm text-violet-700 dark:text-violet-300">
          <Sparkles size={15} className="animate-pulse flex-shrink-0" />
          Gemini is crafting a personalized weekly meal plan based on your family's profile and nutrition data…
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-50 dark:border-gray-800">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide w-24">Day</th>
                {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map(col => (
                  <th key={col} className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {displayRows.map(day => (
                <tr key={day.day} className="group hover:bg-stone-50 dark:hover:bg-gray-900/50 transition-colors">
                  <td className="py-4 px-4">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{day.day.slice(0, 3)}</span>
                  </td>
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(type => {
                    const isEditingThis = editing?.day === day.day && editing?.type === type && !isDemoMode;
                    const isDeletingThis = isDeleting?.day === day.day && isDeleting?.type === type;
                    const hasMeal = Boolean(day[type]);

                    return (
                      <td key={type} className="py-4 px-4">
                        {isEditingThis ? (
                          <div className="flex items-center gap-2">
                            <input
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              className="text-sm border border-emerald-300 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveEdit();
                                if (e.key === 'Escape') setEditing(null);
                              }}
                              placeholder={`Add ${type}…`}
                            />
                            {isSaving
                              ? <Loader2 size={14} className="animate-spin text-emerald-500 flex-shrink-0" />
                              : (
                                <>
                                  <button onClick={saveEdit} title="Save" className="text-emerald-600 hover:text-emerald-700 flex-shrink-0"><Check size={15} /></button>
                                  <button onClick={() => setEditing(null)} title="Cancel" className="text-gray-400 hover:text-gray-600 flex-shrink-0"><X size={15} /></button>
                                </>
                              )
                            }
                          </div>
                        ) : isDeletingThis ? (
                          <Loader2 size={14} className="animate-spin text-rose-400" />
                        ) : hasMeal ? (
                          <div className="flex items-center gap-2 group/cell">
                            <span
                              className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                              onClick={() => !isDemoMode && startEdit(day.day, type, day[type] ?? '')}
                            >
                              {day[type]}
                            </span>
                            {!isDemoMode && (
                              <div className="flex items-center gap-1 opacity-0 group-hover/cell:opacity-100 transition-opacity flex-shrink-0">
                                <button
                                  onClick={() => startEdit(day.day, type, day[type] ?? '')}
                                  title="Edit"
                                  className="text-gray-300 hover:text-emerald-500 transition-colors"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  onClick={() => handleDelete(day.day, type)}
                                  title="Delete"
                                  className="text-gray-300 hover:text-rose-500 transition-colors"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : !isDemoMode ? (
                          <span
                            className="text-sm text-gray-300 dark:text-gray-600 italic cursor-pointer hover:text-emerald-500 transition-colors"
                            onClick={() => startEdit(day.day, type, '')}
                          >
                            + Add {type}
                          </span>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isDemoMode && !isLoading && (
        <p className="text-center text-xs text-gray-400">
          Click a meal name to edit · Hover and click 🗑 to delete · Press Enter to save · Or use{' '}
          <span className="text-violet-500 font-medium">✨ AI Generate Plan</span> to fill the entire week automatically
        </p>
      )}
    </div>
  );
}
