import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';

export interface FamilyProfile {
  id: string;
  user_id: string;
  family_name: string | null;
  household_size: number;
  monthly_budget: number | null;
  preferred_cuisine: string | null;
  created_at: string;
}

export function useFamilyProfile(authUser: User | null, isDemoMode: boolean) {
  const [familyProfile, setFamilyProfile] = useState<FamilyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrCreate = useCallback(async () => {
    if (isDemoMode || !authUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('family_profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (fetchErr && fetchErr.code === 'PGRST116') {
        // Create default family profile
        const meta = authUser.user_metadata;
        const { data: created, error: createErr } = await supabase
          .from('family_profiles')
          .insert({
            user_id: authUser.id,
            family_name: meta?.full_name ? `${meta.full_name}'s Family` : 'My Family',
            household_size: parseInt(meta?.family_size ?? '1'),
          })
          .select()
          .single();

        if (createErr) {
          console.warn('Could not create family profile:', createErr.message);
        } else {
          setFamilyProfile(created);
        }
      } else if (!fetchErr) {
        setFamilyProfile(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [authUser, isDemoMode]);

  useEffect(() => {
    fetchOrCreate();
  }, [fetchOrCreate]);

  return { familyProfile, isLoading, error, refetch: fetchOrCreate };
}
