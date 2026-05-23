import { useState } from 'react';
import { Pencil, Check, Loader2, X, Trash2, Sparkles, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
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

  // Mobile column view management: 0 for Breakfast/Lunch, 1 for Dinner/Snack
  const [viewIndex, setViewIndex] = useState(0);

  // Swipe gesture touch tracking
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && viewIndex === 0) {
      setViewIndex(1);
    } else if (isRightSwipe && viewIndex === 1) {
      setViewIndex(0);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

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
      for (const day of DAYS) {
        const dayPlan = plan[day];
        if (!dayPlan) continue;
        for (const type of ['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]) {
          if (dayPlan[type]) {
            await upsertMeal(day, type, dayPlan[type]);
          }
        }
      }
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

  // Helper arrays to handle visibility filtering
  const columns = [
    { label: 'Breakfast', key: 'breakfast' },
    { label: 'Lunch', key: 'lunch' },
    { label: 'Dinner', key: 'dinner' },
    { label: 'Snack', key: 'snack' }
  ] as const;

  const isColVisible = (key: string) => {
    if (viewIndex === 0) return key === 'breakfast' || key === 'lunch';
    return key === 'dinner' || key === 'snack';
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Weekly Meal Planner</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isDemoMode
              ? "AI-generated plan tailored to your family's needs."
              : 'Click a meal to edit · Or let AI plan the whole week.'}
          </p>
        </div>

        {!isDemoMode && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleAIGenerate}
              disabled={isGenerating || isLoading}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 w-full sm:w-auto ${
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
          </div>
        )}
      </div>

      {genError && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs sm:text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
          <span className="flex-1 break-words">{genError}</span>
          <button onClick={() => setGenError(null)} className="flex-shrink-0 ml-2"><X size={14} /></button>
        </div>
      )}

      {isGenerating && (
        <div className="flex items-start gap-3 px-4 py-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/40 rounded-xl text-xs sm:text-sm text-violet-700 dark:text-violet-300">
          <Sparkles size={15} className="animate-pulse flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed">NutriNest AI is crafting a personalized weekly meal plan based on your family's profile and nutrition data…</span>
        </div>
      )}

      {/* Mobile Column Navigation Indicators */}
      <div className="flex md:hidden items-center justify-between bg-stone-50 dark:bg-gray-800/50 p-2 rounded-xl border border-gray-100 dark:border-gray-800">
        <button 
          onClick={() => setViewIndex(0)} 
          disabled={viewIndex === 0}
          className="p-1 disabled:opacity-20 text-gray-600 dark:text-gray-400"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {viewIndex === 0 ? "Breakfast & Lunch" : "Dinner & Snack"}
        </span>
        <button 
          onClick={() => setViewIndex(1)} 
          disabled={viewIndex === 1}
          className="p-1 disabled:opacity-20 text-gray-600 dark:text-gray-400"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
        </div>
      ) : (
        <div 
          className="w-full overflow-x-auto bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 [scrollbar-width:thin]"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <table className="w-full table-fixed md:min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-50 dark:border-gray-800 bg-stone-50/50 dark:bg-gray-800/30">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide w-16 md:w-20">Day</th>
                {columns.map(col => (
                  <th 
                    key={col.key} 
                    className={`text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide w-36 md:w-44 md:table-cell ${
                      isColVisible(col.key) ? 'table-cell' : 'hidden'
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {displayRows.map(day => (
                <tr key={day.day} className="group hover:bg-stone-50 dark:hover:bg-gray-900/50 transition-colors">
                  <td className="py-4 px-4 sticky left-0 bg-white dark:bg-gray-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{day.day.slice(0, 3)}</span>
                  </td>
                  {(columns).map(col => {
                    const type = col.key;
                    const isEditingThis = editing?.day === day.day && editing?.type === type && !isDemoMode;
                    const isDeletingThis = isDeleting?.day === day.day && isDeleting?.type === type;
                    const hasMeal = Boolean(day[type]);

                    return (
                      <td 
                        key={type} 
                        className={`py-4 px-4 align-top md:table-cell ${
                          isColVisible(type) ? 'table-cell' : 'hidden'
                        }`}
                      >
                        {isEditingThis ? (
                          <div className="flex items-center gap-1.5 w-full">
                            <input
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              className="text-xs border border-emerald-300 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full min-w-0"
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveEdit();
                                if (e.key === 'Escape') setEditing(null);
                              }}
                              placeholder={`Add ${type}…`}
                            />
                            {isSaving
                              ? <Loader2 size={12} className="animate-spin text-emerald-500 flex-shrink-0" />
                              : (
                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                  <button onClick={saveEdit} title="Save" className="text-emerald-600 hover:text-emerald-700 p-0.5"><Check size={14} /></button>
                                  <button onClick={() => setEditing(null)} title="Cancel" className="text-gray-400 hover:text-gray-600 p-0.5"><X size={14} /></button>
                                </div>
                              )
                            }
                          </div>
                        ) : isDeletingThis ? (
                          <Loader2 size={12} className="animate-spin text-rose-400" />
                        ) : hasMeal ? (
                          <div className="flex flex-col justify-between h-full min-w-0 gap-1.5 group/cell">
                            <span
                              className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors break-words leading-relaxed"
                              onClick={() => !isDemoMode && startEdit(day.day, type, day[type] ?? '')}
                            >
                              {day[type]}
                            </span>
                            {!isDemoMode && (
                              <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover/cell:opacity-100 transition-opacity mt-1 flex-shrink-0">
                                <button
                                  onClick={() => startEdit(day.day, type, day[type] ?? '')}
                                  title="Edit"
                                  className="text-gray-400 hover:text-emerald-500 transition-colors p-0.5"
                                >
                                  <Pencil size={11} />
                                </button>
                                <button
                                  onClick={() => handleDelete(day.day, type)}
                                  title="Delete"
                                  className="text-gray-400 hover:text-rose-500 transition-colors p-0.5"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : !isDemoMode ? (
                          <span
                            className="text-xs text-gray-300 dark:text-gray-600 italic cursor-pointer hover:text-emerald-500 transition-colors block py-1"
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
        <p className="text-center text-[10px] sm:text-xs text-gray-400 leading-normal px-2">
          {/* Enhanced helper message for mobile users */}
          <span className="md:hidden block mb-1 text-emerald-500 font-medium">← Swipe left or right on the grid to change meals →</span>
          Click a meal name to edit · Press Enter to save · Or use{' '}
          <span className="text-violet-500 font-medium whitespace-nowrap">✨ AI Generate Plan</span> to fill the entire week automatically.
        </p>
      )}
    </div>
  );
}