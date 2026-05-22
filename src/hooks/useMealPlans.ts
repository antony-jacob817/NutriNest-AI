import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  meal_plan_id: string;
  recipe_id: string | null;
  day_of_week: string;
  meal_type: MealType;
  title: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  prep_time_minutes: number | null;
}

export interface MealPlan {
  id: string;
  family_id: string;
  week_start: string;
  status: string;
  ai_generated: boolean;
}

export interface DayMeals {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
  mealIds: Partial<Record<MealType, string>>;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function useMealPlans(familyId: string | null, isDemoMode: boolean) {
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMealPlans = useCallback(async () => {
    if (isDemoMode || !familyId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Get this week's start (Sunday)
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekStartStr = weekStart.toISOString().split('T')[0];

      // Find or get current meal plan
      const { data: planDataArray, error: planErr } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('family_id', familyId)
        .eq('week_start', weekStartStr)
        .order('created_at', { ascending: false })
        .limit(1);

      if (planErr) throw planErr;
      const planData = planDataArray && planDataArray.length > 0 ? planDataArray[0] : null;

      if (planData) {
        setMealPlan(planData);

        // Fetch meals for this plan
        const { data: mealData, error: mealErr } = await supabase
          .from('meals')
          .select('*')
          .eq('meal_plan_id', planData.id)
          .order('day_of_week');

        if (mealErr) throw mealErr;
        setMeals(mealData ?? []);
      } else {
        setMealPlan(null);
        setMeals([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [familyId, isDemoMode]);

  useEffect(() => {
    fetchMealPlans();
  }, [fetchMealPlans]);

  // Build week view
  const weekDays: DayMeals[] = DAYS.map(day => {
    const dayMeals = meals.filter(m => m.day_of_week === day);
    const mealIds: Partial<Record<MealType, string>> = {};
    const getMeal = (type: MealType): string => {
      const m = dayMeals.find(m => m.meal_type === type);
      if (m) mealIds[type] = m.id;
      return m?.title ?? '';
    };
    return {
      day,
      breakfast: getMeal('breakfast'),
      lunch: getMeal('lunch'),
      dinner: getMeal('dinner'),
      snack: getMeal('snack'),
      mealIds,
    };
  });

  const upsertMeal = async (dayOfWeek: string, mealType: MealType, title: string) => {
    if (!familyId) throw new Error('No family profile');

    let planId = mealPlan?.id;

    // Create or find plan atomically (safe even when called in parallel by AI generation)
    if (!planId) {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekStartStr = weekStart.toISOString().split('T')[0];

      // Try to find existing plan first
      const { data: existingPlanArray } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('family_id', familyId)
        .eq('week_start', weekStartStr)
        .order('created_at', { ascending: false })
        .limit(1);

      const existingPlan = existingPlanArray && existingPlanArray.length > 0 ? existingPlanArray[0] : null;

      if (existingPlan) {
        setMealPlan(existingPlan);
        planId = existingPlan.id;
      } else {
        const { data: newPlan, error: planErr } = await supabase
          .from('meal_plans')
          .insert({ family_id: familyId, week_start: weekStartStr, status: 'active', ai_generated: true })
          .select()
          .single();
        if (planErr) {
          // Another parallel call may have just inserted — fetch it
          const { data: racedPlanArray } = await supabase
            .from('meal_plans')
            .select('*')
            .eq('family_id', familyId)
            .eq('week_start', weekStartStr)
            .order('created_at', { ascending: false })
            .limit(1);
          const racedPlan = racedPlanArray && racedPlanArray.length > 0 ? racedPlanArray[0] : null;
          if (!racedPlan) throw planErr;
          setMealPlan(racedPlan);
          planId = racedPlan.id;
        } else {
          setMealPlan(newPlan);
          planId = newPlan.id;
        }
      }
    }

    const existing = meals.find(m => m.day_of_week === dayOfWeek && m.meal_type === mealType);

    if (existing) {
      const { data, error } = await supabase
        .from('meals')
        .update({ title })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      setMeals(prev => prev.map(m => m.id === existing.id ? data : m));
    } else {
      const { data, error } = await supabase
        .from('meals')
        .insert({ meal_plan_id: planId, day_of_week: dayOfWeek, meal_type: mealType, title })
        .select()
        .single();
      if (error) throw error;
      setMeals(prev => [...prev, data]);
    }
  };

  const deleteMeal = async (dayOfWeek: string, mealType: MealType) => {
    const existing = meals.find(m => m.day_of_week === dayOfWeek && m.meal_type === mealType);
    if (!existing) return;

    // Optimistic
    setMeals(prev => prev.filter(m => m.id !== existing.id));
    try {
      const { error } = await supabase.from('meals').delete().eq('id', existing.id);
      if (error) throw error;
    } catch (err: any) {
      // Roll back
      setMeals(prev => [...prev, existing]);
      throw err;
    }
  };

  return { mealPlan, meals, weekDays, isLoading, error, upsertMeal, deleteMeal, refetch: fetchMealPlans };
}
