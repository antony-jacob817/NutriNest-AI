import { Flame, Beef, Wheat, Droplets, Users, Loader2, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NutritionCard from '../../components/dashboard/NutritionCard';
import { useAuth } from '../../context/AuthContext';
import { useFamilyMembers } from '../../hooks/useFamilyMembers';
import { useNutritionLogs } from '../../hooks/useNutritionLogs';
import { useMealPlans } from '../../hooks/useMealPlans';
import { supabase } from '../../services/supabaseClient';
import { nutritionData, weeklyMealPlan, familyMembers as mockFamily, aiRecommendations } from '../../data/mockData';

const colorMap: Record<string, string> = {
  green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
  amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
  blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
};

const avatarColors = [
  'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
];

export default function Overview() {
  const { user, isDemoMode, dbUser, familyId } = useAuth();
  const navigate = useNavigate();

  const { members, isLoading: familyLoading } = useFamilyMembers(familyId, isDemoMode);
  const memberIds = members.map(m => m.id);
  const { chartData, todayCalories, todayProtein, todayCarbs, todayWaterMl, isLoading: nutritionLoading } = useNutritionLogs(memberIds, isDemoMode);
  const { weekDays, isLoading: mealsLoading } = useMealPlans(familyId, isDemoMode);

  const displayName = isDemoMode
    ? 'there'
    : (dbUser?.full_name?.split(' ')[0] ?? user?.user_metadata?.full_name?.split(' ')[0] ?? 'there');

  const displayFamily = isDemoMode ? mockFamily : members;
  const displayChart = isDemoMode ? nutritionData : chartData;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayMeals = isDemoMode
    ? weeklyMealPlan[0]
    : weekDays.find(d => d.day === today);

  const cal = isDemoMode ? '1,840' : (todayCalories > 0 ? todayCalories.toString() : '0');
  const pro = isDemoMode ? '82' : (todayProtein > 0 ? todayProtein.toString() : '0');
  const crb = isDemoMode ? '210' : (todayCarbs > 0 ? todayCarbs.toString() : '0');
  const wtr = isDemoMode ? '1.8' : (todayWaterMl > 0 ? (todayWaterMl / 1000).toFixed(1) : '0');

  const isLoading = familyLoading || nutritionLoading || mealsLoading;

  const [savedRecs, setSavedRecs] = useState<any[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);

  useEffect(() => {
    if (isDemoMode) return;
    if (!familyId) return;
    setRecsLoading(true);
    supabase
      .from('ai_recommendations')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        setSavedRecs(data ?? []);
        setRecsLoading(false);
      });
  }, [familyId, isDemoMode]);

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Good morning, {displayName} 👋
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Here's your family's nutrition overview for today.</p>
      </div>

      {/* NUTRITION CARDS WRAPPER
         - Swaps grid for flex track row layout on mobile viewports (`flex overflow-x-auto sm:grid`)
         - Uses negative layout margin tricks (`-mx-4 px-4`) so cards scroll elegantly flush to screen edges
         - Hidden native platform scrollbars maintained
      */}
      <div className="flex overflow-x-auto sm:overflow-x-visible snap-x snap-mandatory sm:snap-none sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pb-3 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="shrink-0 w-[145px] sm:w-auto snap-center">
          <NutritionCard label="Calories" value={cal} unit="kcal"
            progress={isDemoMode ? 84 : Math.min(100, Math.round(parseInt(cal) / 22))}
            color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" icon={<Flame size={16} />} />
        </div>
        <div className="shrink-0 w-[145px] sm:w-auto snap-center">
          <NutritionCard label="Protein" value={pro} unit="g"
            progress={isDemoMode ? 91 : Math.min(100, Math.round(parseInt(pro) / 0.9))}
            color="bg-blue-50 dark:bg-blue-900/20 text-blue-600" icon={<Beef size={16} />} />
        </div>
        <div className="shrink-0 w-[145px] sm:w-auto snap-center">
          <NutritionCard label="Carbs" value={crb} unit="g"
            progress={isDemoMode ? 72 : Math.min(100, Math.round(parseInt(crb) / 2.7))}
            color="bg-amber-50 dark:bg-amber-900/20 text-amber-600" icon={<Wheat size={16} />} />
        </div>
        <div className="shrink-0 w-[145px] sm:w-auto snap-center">
          <NutritionCard label="Water" value={wtr} unit="L"
            progress={isDemoMode ? 60 : Math.min(100, Math.round(parseFloat(wtr) / 0.025))}
            color="bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600" icon={<Droplets size={16} />} />
        </div>
      </div>

      {/* Main interactive visualization block split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6 w-full overflow-hidden">
          <h2 className="font-semibold text-gray-900 dark:text-white text-base">Weekly Calories</h2>
          <p className="text-xs text-gray-400 mb-5">Combined daily calorie intake across all members</p>
          {isLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <Loader2 className="animate-spin text-emerald-500" size={24} />
            </div>
          ) : displayChart.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-gray-400 italic text-center px-4">
              No nutrition data yet. Log meals in the Nutrition tab to see your chart.
            </div>
          ) : (
            <div className="w-full h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayChart} margin={{ left: -20, right: 10 }}>
                  <defs>
                    <linearGradient id="calGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: 11 }}
                    formatter={(val) => [`${val} kcal`, 'Calories']} />
                  <Area type="monotone" dataKey="calories" stroke="#10b981" strokeWidth={2} fill="url(#calGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6 w-full">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 text-base">Today's Meals</h2>
          {mealsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="animate-spin text-emerald-500" size={20} />
            </div>
          ) : !todayMeals || (!isDemoMode && !todayMeals.breakfast && !todayMeals.lunch && !todayMeals.dinner && !todayMeals.snack) ? (
            <div className="text-sm text-gray-500 italic p-4 text-center border border-dashed rounded-xl border-gray-200 dark:border-gray-800">
              No meals for today. Head to Meal Planner to add meals.
            </div>
          ) : (
            <div className="space-y-4">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(type => {
                const meal = todayMeals[type];
                if (!meal) return null;
                return (
                  <div key={type} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{type}</div>
                      <div className="text-sm text-gray-900 dark:text-white break-words">{meal}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Profile Mapping Grid Elements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6 w-full">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 text-base">Family Members</h2>
          {familyLoading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="animate-spin text-emerald-500" size={20} />
            </div>
          ) : displayFamily.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-500 border border-dashed rounded-xl border-gray-200 dark:border-gray-800">
              <Users size={24} className="mx-auto mb-2 text-gray-300" />
              No family members yet. Add them in the Family tab.
            </div>
          ) : (
            <div className="space-y-3">
              {displayFamily.map((member: any, i: number) => (
                <div key={member.id} className="flex items-center justify-between gap-3 border-b border-gray-50 dark:border-gray-800/40 pb-2 last:border-none last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${avatarColors[i % 4]}`}>
                      {member.name?.charAt(0)?.toUpperCase() ?? 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{member.name}</div>
                      <div className="text-xs text-gray-400 truncate">
                        {member.dietary_preference ?? member.role ?? 'Member'}
                        {member.age ? ` · Age ${member.age}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {member.calorie_goal ?? (member.calories ?? null) ?? '—'}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {(member.calorie_goal || member.calories) ? 'kcal/day' : 'goal not set'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6 w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white text-base">AI Recommendations</h2>
            <button
              onClick={() => navigate('/dashboard/insights')}
              className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex-shrink-0"
            >
              View All <ArrowRight size={12} />
            </button>
          </div>

          {isDemoMode ? (
            <div className="space-y-3">
              {aiRecommendations.slice(0, 3).map(rec => (
                <div key={rec.id} className={`p-3 rounded-xl ${colorMap[rec.color] ?? colorMap.green} bg-opacity-50`}>
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold uppercase tracking-wide mb-0.5 truncate">{rec.title}</div>
                      <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">{rec.description}</div>
                    </div>
                    <span className="text-[10px] font-bold whitespace-nowrap bg-white/40 dark:bg-black/20 px-1.5 py-0.5 rounded-md flex-shrink-0">{rec.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : recsLoading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="animate-spin text-emerald-500" size={20} />
            </div>
          ) : savedRecs.length > 0 ? (
            <div className="space-y-3">
              {savedRecs.map((r: any) => {
                const color = r.recommendation_type === 'warning' ? 'amber'
                  : r.recommendation_type === 'tip' ? 'blue' : 'green';
                const impact = r.priority ?? 'Medium';
                const routeMap: Record<string, string> = {
                  family: '/dashboard/family',
                  nutrition: '/dashboard/nutrition',
                  'meal-planner': '/dashboard/meals',
                  grocery: '/dashboard/grocery',
                  settings: '/dashboard/settings',
                };
                const action = r.action ?? 'nutrition';
                const applyRoute = routeMap[action] ?? '/dashboard/nutrition';

                return (
                  <div key={r.id} className={`p-3 rounded-xl border ${colorMap[color] ?? colorMap.green}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold uppercase tracking-wide mb-0.5 truncate">{r.title}</div>
                        <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">{r.message}</div>
                      </div>
                      <span className={`text-[10px] font-bold whitespace-nowrap px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        impact === 'High' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        : impact === 'Low' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>{impact}</span>
                    </div>
                    <button
                      onClick={() => navigate(applyRoute)}
                      className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex"
                    >
                      Apply <ArrowRight size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic p-4 text-center border border-dashed rounded-xl border-gray-200 dark:border-gray-800">
              No recommendations yet.{' '}
              <button onClick={() => navigate('/dashboard/insights')} className="font-semibold text-emerald-600 hover:underline">
                Go to AI Insights
              </button>{' '}to generate them.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}