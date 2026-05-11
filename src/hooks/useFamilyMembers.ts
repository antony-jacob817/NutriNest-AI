import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

export interface FamilyMember {
  id: string;
  family_id: string;
  name: string;
  age: number | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: string | null;
  dietary_preference: string | null;
  calorie_goal: number | null;
  protein_goal: number | null;
  created_at: string;
  allergies?: string[];
}

export type MemberUpdate = Partial<Pick<FamilyMember,
  'name' | 'age' | 'gender' | 'height_cm' | 'weight_kg' |
  'activity_level' | 'dietary_preference' | 'calorie_goal' | 'protein_goal'
>>;

export function useFamilyMembers(familyId: string | null, isDemoMode: boolean) {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (isDemoMode || !familyId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('family_members')
        .select(`
          *,
          member_allergies (
            allergy_id,
            allergies ( name )
          )
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: true });

      if (fetchErr) throw fetchErr;

      const normalized = (data ?? []).map((m: any) => ({
        ...m,
        allergies: m.member_allergies
          ?.map((ma: any) => ma.allergies?.name)
          .filter(Boolean) ?? [],
      }));

      setMembers(normalized);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [familyId, isDemoMode]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // ── ADD ──────────────────────────────────────────────────────────────────
  const addMember = async (memberData: {
    name: string;
    age?: number;
    gender?: string;
    height_cm?: number;
    weight_kg?: number;
    dietary_preference?: string;
    calorie_goal?: number;
    protein_goal?: number;
    activity_level?: string;
  }) => {
    if (!familyId) throw new Error('No family profile found');

    const payload: Record<string, any> = {
      family_id: familyId,
      name: memberData.name,
    };
    // Only include optional fields if provided
    if (memberData.age !== undefined) payload.age = memberData.age;
    if (memberData.gender) payload.gender = memberData.gender;
    if (memberData.height_cm !== undefined) payload.height_cm = memberData.height_cm;
    if (memberData.weight_kg !== undefined) payload.weight_kg = memberData.weight_kg;
    if (memberData.dietary_preference) payload.dietary_preference = memberData.dietary_preference;
    if (memberData.calorie_goal !== undefined) payload.calorie_goal = memberData.calorie_goal;
    if (memberData.protein_goal !== undefined) payload.protein_goal = memberData.protein_goal;
    if (memberData.activity_level) payload.activity_level = memberData.activity_level;

    // Optimistic insert
    const tempId = `temp-${Date.now()}`;
    const optimistic: FamilyMember = {
      id: tempId,
      family_id: familyId,
      name: memberData.name,
      age: memberData.age ?? null,
      gender: memberData.gender ?? null,
      height_cm: memberData.height_cm ?? null,
      weight_kg: memberData.weight_kg ?? null,
      activity_level: memberData.activity_level ?? null,
      dietary_preference: memberData.dietary_preference ?? null,
      calorie_goal: memberData.calorie_goal ?? null,
      protein_goal: memberData.protein_goal ?? null,
      created_at: new Date().toISOString(),
      allergies: [],
    };
    setMembers(prev => [...prev, optimistic]);

    try {
      const { data, error: insertErr } = await supabase
        .from('family_members')
        .insert(payload)
        .select()
        .single();

      if (insertErr) throw insertErr;
      setMembers(prev => prev.map(m => m.id === tempId ? { ...data, allergies: [] } : m));
      return data as FamilyMember;
    } catch (err: any) {
      setMembers(prev => prev.filter(m => m.id !== tempId));
      setError(err.message);
      throw err;
    }
  };

  // ── UPDATE ────────────────────────────────────────────────────────────────
  const updateMember = async (id: string, updates: MemberUpdate) => {
    const prev = [...members];
    // Optimistic
    setMembers(m => m.map(mem => mem.id === id ? { ...mem, ...updates } : mem));

    try {
      const { data, error: updateErr } = await supabase
        .from('family_members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateErr) throw updateErr;
      setMembers(m => m.map(mem => mem.id === id ? { ...data, allergies: mem.allergies } : mem));
      return data as FamilyMember;
    } catch (err: any) {
      setMembers(prev);
      setError(err.message);
      throw err;
    }
  };

  // ── REMOVE ────────────────────────────────────────────────────────────────
  const removeMember = async (id: string) => {
    const prev = [...members];
    setMembers(m => m.filter(mem => mem.id !== id));
    try {
      const { error: delErr } = await supabase.from('family_members').delete().eq('id', id);
      if (delErr) throw delErr;
    } catch (err: any) {
      setMembers(prev);
      setError(err.message);
      throw err;
    }
  };

  return { members, isLoading, error, addMember, updateMember, removeMember, refetch: fetchMembers };
}
