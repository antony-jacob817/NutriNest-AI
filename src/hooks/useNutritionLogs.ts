import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

export interface NutritionLog {
  id: string;
  member_id: string;
  log_date: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  sugar: number | null;
  water_intake_ml: number | null;
  notes: string | null;
}

export interface ChartData {
  day: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function useNutritionLogs(memberIds: string[], isDemoMode: boolean) {
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (isDemoMode || memberIds.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const dateStr = sevenDaysAgo.toISOString().split('T')[0];

      const { data, error: fetchErr } = await supabase
        .from('nutrition_logs')
        .select('*')
        .in('member_id', memberIds)
        .gte('log_date', dateStr)
        .order('log_date', { ascending: true });

      if (fetchErr) throw fetchErr;
      setLogs(data ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(memberIds), isDemoMode]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const logNutrition = async (memberId: string, logData: {
    log_date: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    water_intake_ml?: number;
    notes?: string;
  }) => {
    const existing = logs.find(l => l.member_id === memberId && l.log_date === logData.log_date);
    const payload = { member_id: memberId, ...logData };

    if (existing) {
      const { data, error } = await supabase
        .from('nutrition_logs')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      setLogs(prev => prev.map(l => l.id === existing.id ? data : l));
      return data as NutritionLog;
    } else {
      const { data, error } = await supabase
        .from('nutrition_logs')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      setLogs(prev => [...prev, data as NutritionLog]);
      return data as NutritionLog;
    }
  };

  // Aggregate by day across all members
  const dateMap = new Map<string, ChartData>();
  for (const log of logs) {
    const dayLabel = new Date(log.log_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
    if (!dateMap.has(log.log_date)) {
      dateMap.set(log.log_date, { day: dayLabel, calories: 0, protein: 0, carbs: 0, fat: 0 });
    }
    const entry = dateMap.get(log.log_date)!;
    entry.calories += log.calories;
    entry.protein += log.protein;
    entry.carbs += log.carbs;
    entry.fat += log.fats;
  }
  const chartData = Array.from(dateMap.values());

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(l => l.log_date === today);
  const todayCalories = todayLogs.reduce((s, l) => s + l.calories, 0);
  const todayProtein = todayLogs.reduce((s, l) => s + l.protein, 0);
  const todayCarbs = todayLogs.reduce((s, l) => s + l.carbs, 0);
  const todayWaterMl = todayLogs.reduce((s, l) => s + (l.water_intake_ml ?? 0), 0);

  const avgCalories = logs.length > 0
    ? Math.round(logs.reduce((s, l) => s + l.calories, 0) / logs.length)
    : 0;
  const avgProtein = logs.length > 0
    ? Math.round(logs.reduce((s, l) => s + l.protein, 0) / logs.length)
    : 0;
  const avgCarbs = logs.length > 0
    ? Math.round(logs.reduce((s, l) => s + l.carbs, 0) / logs.length)
    : 0;
  const avgFat = logs.length > 0
    ? Math.round(logs.reduce((s, l) => s + l.fats, 0) / logs.length)
    : 0;

  return {
    logs,
    chartData,
    todayCalories,
    todayProtein,
    todayCarbs,
    todayWaterMl,
    avgCalories,
    avgProtein,
    avgCarbs,
    avgFat,
    isLoading,
    error,
    logNutrition,
    refetch: fetchLogs,
  };
}
