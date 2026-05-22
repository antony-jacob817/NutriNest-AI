import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_name: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
}

export function useSubscription(authUser: User | null, subscriptionTierFromDB?: string) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!authUser) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) setSubscription(data[0]);
    } catch {
      // No subscription row is fine — tier comes from users.subscription_tier
    } finally {
      setIsLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // Primary source of truth is users.subscription_tier
  const tier = (subscriptionTierFromDB ?? 'free') as 'free' | 'pro' | 'premium';
  const isPro = tier === 'pro' || tier === 'premium';
  const isFree = tier === 'free';

  return { subscription, isLoading, isPro, isFree, tier };
}
