import { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Plus, Loader2, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFamilyMembers } from '../../hooks/useFamilyMembers';
import { useNutritionLogs } from '../../hooks/useNutritionLogs';
import { nutritionData } from '../../data/mockData';

export default function Nutrition() {
  const { isDemoMode, familyId } = useAuth();
  const { members } = useFamilyMembers(familyId, isDemoMode);
  const memberIds = members.map(m => m.id);

  const { chartData, avgCalories, avgProtein, avgCarbs, avgFat, isLoading, logNutrition } = useNutritionLogs(memberIds, isDemoMode);

  const [showLogForm, setShowLogForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');
  const [logForm, setLogForm] = useState({
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    water_intake_ml: '',
  });

  const displayChart = isDemoMode ? nutritionData.map(d => ({ ...d, fat: d.fat })) : chartData;

  const handleLogSubmit = async () => {
    if (!logForm.calories) return;
    if (members.length > 1 && !selectedMember) return;

    const memberId = selectedMember || memberIds[0];
    if (!memberId) return;

    setIsSaving(true);
    try {
      await logNutrition(memberId, {
        log_date: new Date().toISOString().split('T')[0],
        calories: parseInt(logForm.calories, 10) || 0,
        protein: parseInt(logForm.protein, 10) || 0,
        carbs: parseInt(logForm.carbs, 10) || 0,
        fats: parseInt(logForm.fats, 10) || 0,
        water_intake_ml: parseInt(logForm.water_intake_ml, 10) || 0,
      });
      setSaved(true);
      setLogForm({ calories: '', protein: '', carbs: '', fats: '', water_intake_ml: '' });
      setTimeout(() => { setSaved(false); setShowLogForm(false); }, 1500);
    } catch (err: any) {
      console.error('Failed to log nutrition:', err.message ?? err);
    } finally {
      setIsSaving(false);
    }
  };

  const stats = isDemoMode
    ? [
        { label: 'Avg. Calories', value: '2,014', sub: '-3% vs last week', pos: false },
        { label: 'Avg. Protein', value: '86g', sub: '+5% vs last week', pos: true },
        { label: 'Avg. Carbs', value: '216g', sub: '-2% vs last week', pos: false },
        { label: 'Avg. Fat', value: '67g', sub: '+1% vs last week', pos: true },
      ]
    : [
        { label: 'Avg. Calories', value: avgCalories > 0 ? avgCalories.toLocaleString() : '—', sub: avgCalories > 0 ? 'This week' : 'No data yet', pos: true },
        { label: 'Avg. Protein', value: avgProtein > 0 ? `${avgProtein}g` : '—', sub: avgProtein > 0 ? 'This week' : 'No data yet', pos: true },
        { label: 'Avg. Carbs', value: avgCarbs > 0 ? `${avgCarbs}g` : '—', sub: avgCarbs > 0 ? 'This week' : 'No data yet', pos: true },
        { label: 'Avg. Fat', value: avgFat > 0 ? `${avgFat}g` : '—', sub: avgFat > 0 ? 'This week' : 'No data yet', pos: true },
      ];

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Nutrition Analytics</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Weekly breakdown of your family's nutrient intake.</p>
        </div>
        {!isDemoMode && (
          <button
            onClick={() => setShowLogForm(!showLogForm)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors w-full sm:w-auto"
          >
            <Plus size={15} /> Log Today
          </button>
        )}
      </div>

      {/* Log Form Block Panel */}
      {showLogForm && !isDemoMode && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 p-4 sm:p-6 w-full">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-base">Log Today's Nutrition</h3>

          {members.length > 1 && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Family Member</label>
              <select 
                value={selectedMember} 
                onChange={e => setSelectedMember(e.target.value)}
                className="w-full sm:max-w-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select member…</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          )}

          {/* Input matrix layout stacks vertically on mobile screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { field: 'calories', label: 'Calories (kcal)', placeholder: '2000' },
              { field: 'protein', label: 'Protein (g)', placeholder: '80' },
              { field: 'carbs', label: 'Carbs (g)', placeholder: '250' },
              { field: 'fats', label: 'Fats (g)', placeholder: '65' },
              { field: 'water_intake_ml', label: 'Water (ml)', placeholder: '2000' },
            ].map(({ field, label, placeholder }) => (
              <div key={field} className="w-full">
                <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
                <input
                  type="number"
                  placeholder={placeholder}
                  value={logForm[field as keyof typeof logForm]}
                  onChange={e => setLogForm(f => ({ ...f, [field]: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
            <button 
              onClick={() => setShowLogForm(false)}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-600 dark:text-gray-400 w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              onClick={handleLogSubmit}
              disabled={isSaving || !logForm.calories || (members.length > 1 && !selectedMember)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 w-full sm:w-auto order-1 sm:order-2"
            >
              {saved ? <><Check size={14} /> Saved!</> : isSaving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save Entry'}
            </button>
          </div>
        </div>
      )}

      {/* Summary Analytics Horizontal Scroll Wrapper for Mobile View */}
      <div className="w-full overflow-x-auto pb-2 -mb-2 md:pb-0 md:mb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-nowrap md:grid md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-max md:min-w-0">
          {stats.map(stat => (
            <div 
              key={stat.label} 
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-5 w-[140px] sm:w-[180px] md:w-auto flex-shrink-0 min-w-0"
            >
              <div className="text-[10px] sm:text-xs font-medium text-gray-400 mb-1 sm:mb-2 truncate">{stat.label}</div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1 truncate">{stat.value}</div>
              <div className={`text-[10px] sm:text-xs font-medium truncate ${stat.pos ? 'text-emerald-500' : 'text-rose-400'}`}>{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Macros bar chart tracking */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6 w-full overflow-hidden">
        <h2 className="font-semibold text-gray-900 dark:text-white text-base mb-1">Weekly Macronutrients</h2>
        <p className="text-xs text-gray-400 mb-5">Protein, carbohydrates, and fat breakdown per day</p>
        {isLoading ? (
          <div className="h-[260px] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={24} /></div>
        ) : displayChart.length === 0 ? (
          <div className="h-[260px] flex items-center justify-center text-sm text-gray-400 italic text-center px-4">No data yet. Use "Log Today" to record nutrition.</div>
        ) : (
          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayChart} barGap={3} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={35} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="protein" name="Protein (g)" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="carbs" name="Carbs (g)" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                <Bar dataKey="fat" name="Fat (g)" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Calorie trend view tracking line layout */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6 w-full overflow-hidden">
        <h2 className="font-semibold text-gray-900 dark:text-white text-base mb-1">Calorie Trend</h2>
        <p className="text-xs text-gray-400 mb-5">Daily calorie intake across the week</p>
        {isLoading ? (
          <div className="h-[220px] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={24} /></div>
        ) : displayChart.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-gray-400 italic text-center px-4">No calorie data yet.</div>
        ) : (
          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayChart} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: 11 }}
                  formatter={(v) => [`${v} kcal`, 'Calories']} />
                <Line type="monotone" dataKey="calories" stroke="#10b981" strokeWidth={2}
                  dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}