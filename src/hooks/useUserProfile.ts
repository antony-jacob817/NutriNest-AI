import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';

export interface DBUser {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  subscription_tier: 'free' | 'pro' | 'premium';
  dark_mode: boolean;
  created_at: string;
  updated_at: string;
}

export function useDBUser(authUser: User | null) {
  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrCreate = useCallback(async () => {
    if (!authUser) {
      setDbUser(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Try to fetch existing user row
      const { data, error: fetchErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (fetchErr && fetchErr.code === 'PGRST116') {
        // Row doesn't exist — create it
        const meta = authUser.user_metadata;
        const { data: created, error: createErr } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            full_name: meta?.full_name ?? null,
            email: authUser.email ?? null,
            subscription_tier: 'free',
            dark_mode: false,
          })
          .select()
          .single();

        if (createErr) {
          // If insert fails (e.g. RLS), log but don't crash
          console.warn('Could not create user row:', createErr.message);
          setDbUser(null);
        } else {
          setDbUser(created);
        }
      } else if (fetchErr) {
        console.warn('Could not fetch user row:', fetchErr.message);
        setDbUser(null);
      } else {
        setDbUser(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    fetchOrCreate();
  }, [fetchOrCreate]);

  const updateUser = async (updates: Partial<Pick<DBUser, 'full_name' | 'dark_mode'>>) => {
    if (!authUser) return;
    const { data, error: updateErr } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', authUser.id)
      .select()
      .single();
    if (updateErr) throw updateErr;
    setDbUser(data);
    return data as DBUser;
  };

  return { dbUser, isLoading, error, updateUser, refetch: fetchOrCreate };
}
