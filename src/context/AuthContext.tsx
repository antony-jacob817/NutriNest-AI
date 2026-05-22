import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { authService } from '../services/auth';
import { supabase } from '../services/supabaseClient';
import type { DBUser } from '../hooks/useUserProfile';
import type { FamilyProfile } from '../hooks/useFamilyProfile';

type SubscriptionTier = 'free' | 'pro' | 'premium';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isBootstrapping: boolean;
  bootstrapError: string | null;
  isDemoMode: boolean;
  dbUser: DBUser | null;
  familyProfile: FamilyProfile | null;
  familyId: string | null;
  subscriptionTier: SubscriptionTier;
  isPro: boolean;
  isFree: boolean;
  updateDBUser: (updates: Partial<Pick<DBUser, 'full_name' | 'dark_mode'>>) => Promise<DBUser | undefined>;
  refreshBootstrap: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isBootstrapping: false,
  bootstrapError: null,
  isDemoMode: true,
  dbUser: null,
  familyProfile: null,
  familyId: null,
  subscriptionTier: 'free',
  isPro: false,
  isFree: true,
  updateDBUser: async () => undefined,
  refreshBootstrap: () => {},
});

// ─────────────────────────────────────────────────────────────────────────────
// STEP-BY-STEP BOOTSTRAP
// users → family_profiles → family_members (primary)
// Each step is fault-tolerant: it tries to read first, then create.
// ─────────────────────────────────────────────────────────────────────────────
async function bootstrapUser(user: User): Promise<{ dbUser: DBUser; familyProfile: FamilyProfile }> {
  const meta = user.user_metadata ?? {};

  // ── STEP 1: Ensure users row ──────────────────────────────────────────────
  let dbUser: DBUser | null = null;
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();           // maybeSingle() → null if 0 rows, no error

  if (existingUser) {
    dbUser = existingUser as DBUser;
  } else {
    // Row missing → create it
    const { data: newUser, error: insertErr } = await supabase
      .from('users')
      .insert({
        id: user.id,
        full_name: meta.full_name ?? null,
        email: user.email ?? null,
        subscription_tier: 'free',
        dark_mode: false,
      })
      .select()
      .maybeSingle();

    if (insertErr) {
      // RLS or other insert error — this is the most common failure point
      throw new Error(
        `Could not create user profile in database.\n` +
        `Supabase error: ${insertErr.message}\n` +
        `Code: ${insertErr.code}\n\n` +
        `LIKELY CAUSE: RLS policies not applied. Please run supabase_schema.sql in your Supabase SQL Editor.`
      );
    }
    dbUser = newUser as DBUser;
  }

  if (!dbUser) throw new Error('User record could not be established.');

  // ── STEP 2: Ensure family_profiles row ───────────────────────────────────
  let familyProfile: FamilyProfile | null = null;
  const { data: existingFP } = await supabase
    .from('family_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingFP) {
    familyProfile = existingFP as FamilyProfile;
  } else {
    const familyName = meta.full_name
      ? `${String(meta.full_name).split(' ')[0]}'s Family`
      : 'My Family';

    const { data: newFP, error: fpErr } = await supabase
      .from('family_profiles')
      .insert({ user_id: user.id, family_name: familyName, household_size: 1 })
      .select()
      .maybeSingle();

    if (fpErr) {
      throw new Error(
        `Could not create family profile.\n` +
        `Supabase error: ${fpErr.message}\n\n` +
        `LIKELY CAUSE: RLS policies not applied. Please run supabase_schema.sql in your Supabase SQL Editor.`
      );
    }
    familyProfile = newFP as FamilyProfile;
  }

  if (!familyProfile) throw new Error('Family profile could not be established.');

  // ── STEP 3: Ensure primary family_member (user themselves, name only) ─────
  const { data: existingMembers } = await supabase
    .from('family_members')
    .select('id')
    .eq('family_id', familyProfile.id)
    .limit(1);

  if (!existingMembers || existingMembers.length === 0) {
    const memberName = dbUser.full_name ?? meta.full_name ?? 'Me';
    const { error: memberErr } = await supabase
      .from('family_members')
      .insert({ family_id: familyProfile.id, name: memberName });

    if (memberErr) {
      // Non-fatal: the user can manually add themselves if this fails
      console.warn('[Bootstrap] Could not create primary family member:', memberErr.message);
    }
  }

  // ── STEP 4: Sync subscriptions table — exactly 1 row per user ───────────
  // Non-fatal: silently skipped if table doesn't exist or RLS blocks access.
  try {
    const planName = (dbUser as any).subscription_tier ?? 'free';
    // Delete any existing rows (handles duplicates and stale plans)
    await supabase.from('subscriptions').delete().eq('user_id', user.id);
    // Insert fresh row with current plan
    await supabase.from('subscriptions').insert({
      user_id: user.id,
      plan_name: planName,
      status: 'active',
    });
  } catch {
    // Non-fatal: subscriptionTier is always read from users.subscription_tier
  }

  return { dbUser, familyProfile };
}

// ─────────────────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [familyProfile, setFamilyProfile] = useState<FamilyProfile | null>(null);

  const isDemoMode = !user;

  const runBootstrap = useCallback(async (authUser: User) => {
    setIsBootstrapping(true);
    setBootstrapError(null);
    try {
      const { dbUser: du, familyProfile: fp } = await bootstrapUser(authUser);
      setDbUser(du);
      setFamilyProfile(fp);
    } catch (err: any) {
      const msg = err.message ?? 'Unknown bootstrap error';
      setBootstrapError(msg);
      console.error('[Bootstrap] ❌ Failed:', msg);
    } finally {
      setIsBootstrapping(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setDbUser(null);
      setFamilyProfile(null);
      setBootstrapError(null);
    }
  }, [user]);

  useEffect(() => {
    if (user) runBootstrap(user);
  }, [user, runBootstrap]);

  useEffect(() => {
    const init = async () => {
      try {
        const s = await authService.getSession();
        setSession(s);
        setUser(s?.user ?? null);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    init();

    const { data: listener } = authService.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const updateDBUser = async (updates: Partial<Pick<DBUser, 'full_name' | 'dark_mode'>>) => {
    if (!user) return undefined;
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    setDbUser(data as DBUser);
    return data as DBUser;
  };

  const subscriptionTier = (dbUser?.subscription_tier ?? 'free') as SubscriptionTier;

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isBootstrapping,
    bootstrapError,
    isDemoMode,
    dbUser,
    familyProfile,
    familyId: familyProfile?.id ?? null,
    subscriptionTier,
    isPro: subscriptionTier === 'pro' || subscriptionTier === 'premium',
    isFree: subscriptionTier === 'free',
    updateDBUser,
    refreshBootstrap: () => { if (user) runBootstrap(user); },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
