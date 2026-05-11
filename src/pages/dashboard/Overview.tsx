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

  const { members, isLoading: familyLoading } = useFamilyMembers(familyId, isDemoMode);
  const memberIds = members.map(m => m.id);
  const { chartData, todayCalories, todayProtein, todayCarbs, todayWaterMl, isLoading: nutritionLoading } = useNutritionLogs(memberIds, isDemoMode);
  const { weekDays, isLoading: mealsLoading } = useMealPlans(familyId, isDemoMode);

  const displayName = isDemoMode
    ? 'there'
    : (dbUser?.full_name?.split(' ')[0] ?? user?.user_metadata?.full_name?.split(' ')[0] ?? 'there');

  const displayFamily = isDemoMode ? mockFamily : members;
  const displayChart = isDemoMode ? nutritionData : chartData;

  // Today's meals from real week planner
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayMeals = isDemoMode
    ? weeklyMealPlan[0]
    : weekDays.find(d => d.day === today);

  // Nutrition stats
  const cal = isDemoMode ? '1,840' : (todayCalories > 0 ? todayCalories.toString() : '0');
  const pro = isDemoMode ? '82' : (todayProtein > 0 ? todayProtein.toString() : '0');
  const crb = isDemoMode ? '210' : (todayCarbs > 0 ? todayCarbs.toString() : '0');
  const wtr = isDemoMode ? '1.8' : (todayWaterMl > 0 ? (todayWaterMl / 1000).toFixed(1) : '0');

  const isLoading = familyLoading || nutritionLoading || mealsLoading;

  // ── AI Recommendations from DB ───────────────────────────────────────────
  const navigate = useNavigate();
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Good morning, {displayName} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Here's your family's nutrition overview for today.</p>
      </div>

      {/* Nutrition stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <NutritionCard label="Calories" value={cal} unit="kcal"
          progress={isDemoMode ? 84 : Math.min(100, Math.round(parseInt(cal) / 22))}
          color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" icon={<Flame size={16} />} />
        <NutritionCard label="Protein" value={pro} unit="g"
          progress={isDemoMode ? 91 : Math.min(100, Math.round(parseInt(pro) / 0.9))}
          color="bg-blue-50 dark:bg-blue-900/20 text-blue-600" icon={<Beef size={16} />} />
        <NutritionCard label="Carbs" value={crb} unit="g"
          progress={isDemoMode ? 72 : Math.min(100, Math.round(parseInt(crb) / 2.7))}
          color="bg-amber-50 dark:bg-amber-900/20 text-amber-600" icon={<Wheat size={16} />} />
        <NutritionCard label="Water" value={wtr} unit="L"
          progress={isDemoMode ? 60 : Math.min(100, Math.round(parseFloat(wtr) / 0.025))}
          color="bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600" icon={<Droplets size={16} />} />
      </div>

      {/* Chart + Today's Meals */}
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Weekly Calories</h2>
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
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={displayChart}>
                <defs>
                  <linearGradient id="calGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: 12 }}
                  formatter={(val) => [`${val} kcal`, 'Calories']} />
                <Area type="monotone" dataKey="calories" stroke="#10b981" strokeWidth={2} fill="url(#calGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Today's Meals</h2>
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
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{type}</div>
                      <div className="text-sm text-gray-900 dark:text-white">{meal}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Family + AI recommendations */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Family Members</h2>
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
                <div key={member.id} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${avatarColors[i % 4]}`}>
                    {member.name?.charAt(0)?.toUpperCase() ?? 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</div>
                    <div className="text-xs text-gray-400">
                      {member.dietary_preference ?? member.role ?? 'Member'}
                      {member.age ? ` · Age ${member.age}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {member.calorie_goal ?? (member.calories ?? null) ?? '—'}
                      {(member.calorie_goal || member.calories) ? '' : ''}
                    </div>
                    <div className="text-xs text-gray-400">
                      {(member.calorie_goal || member.calories) ? 'kcal/day' : 'goal not set'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">AI Recommendations</h2>
            <button
              onClick={() => navigate('/dashboard/ai-insights')}
              className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
            >
              View All <ArrowRight size={12} />
            </button>
          </div>

          {isDemoMode ? (
            <div className="space-y-3">
              {aiRecommendations.slice(0, 3).map(rec => (
                <div key={rec.id} className={`flex items-start gap-3 p-3 rounded-xl ${colorMap[rec.color] ?? colorMap.green} bg-opacity-50`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold uppercase tracking-wide mb-0.5">{rec.title}</div>
                    <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{rec.description}</div>
                  </div>
                  <span className="text-xs font-bold whitespace-nowrap">{rec.impact}</span>
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
                return (
                  <div key={r.id} className={`flex items-start gap-3 p-3 rounded-xl border ${colorMap[color] ?? colorMap.green}`}>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold uppercase tracking-wide mb-0.5">{r.title}</div>
                      <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">{r.message}</div>
                    </div>
                    <span className={`text-xs font-bold whitespace-nowrap px-2 py-0.5 rounded-full ${
                      impact === 'High' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      : impact === 'Low' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>{impact}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic p-4 text-center border border-dashed rounded-xl border-gray-200 dark:border-gray-800">
              No recommendations yet.{' '}
              <button onClick={() => navigate('/dashboard/ai-insights')} className="font-semibold text-emerald-600 hover:underline">
                Go to AI Insights
              </button>{' '}to generate them.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
