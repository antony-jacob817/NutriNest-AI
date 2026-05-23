import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  Moon, Sun, Bell, Shield, User, Loader2, Check,
  LogOut, Eye, EyeOff, Download, Trash2, X, AlertTriangle, Crown, Zap,
} from 'lucide-react';
import { authService } from '../../services/auth';
import { supabase } from '../../services/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { darkMode, toggleDarkMode } = useApp();
  const { user, isDemoMode, dbUser, updateDBUser, subscriptionTier, familyProfile, familyId, refreshBootstrap } = useAuth();
  const navigate = useNavigate();

  // ── Profile ───────────────────────────────────────────────────────────────
  const [nameValue, setNameValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (dbUser?.full_name) setNameValue(dbUser.full_name);
  }, [dbUser?.full_name]);

  // ── Change Password ───────────────────────────────────────────────────────
  const [showPwForm, setShowPwForm] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Export My Data ────────────────────────────────────────────────────────
  const [isExporting, setIsExporting] = useState(false);

  // ── Pricing Modal ──────────────────────────────────────────────────────────
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState<'pro' | 'premium' | null>(null);
  const [upgradeMsg, setUpgradeMsg] = useState('');

  // ── Delete Account ────────────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ── Cancel Plan ───────────────────────────────────────────────────────────
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelMsg, setCancelMsg] = useState('');
  const [cancelMemberCount, setCancelMemberCount] = useState(0);

  // ── Notifications (UI only) ───────────────────────────────────────────────
  const [notifications, setNotifications] = useState({
    mealReminders: true,
    groceryAlerts: true,
    weeklyReport: false,
  });

  const displayEmail = user?.email ?? (isDemoMode ? 'alex@example.com' : '—');
  const displayTier = isDemoMode ? 'Demo'
    : subscriptionTier === 'free' ? 'Free Plan'
    : `NutriNest ${subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} ✨`;
  const isPaidPlan = subscriptionTier === 'pro' || subscriptionTier === 'premium';

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleUpgrade = async (tier: 'pro' | 'premium') => {
    if (!user || isDemoMode) return;
    setIsUpgrading(tier);
    setUpgradeMsg('');
    try {
      const { error } = await supabase
        .from('users')
        .update({ subscription_tier: tier })
        .eq('id', user.id);
      if (error) throw error;

      await supabase.from('subscriptions').delete().eq('user_id', user.id);
      await supabase.from('subscriptions').insert({
        user_id: user.id,
        plan_name: tier,
        status: 'active',
      });

      await refreshBootstrap();

      const name = tier === 'pro' ? 'Family' : 'Premium';
      setUpgradeMsg(`✓ Upgraded to ${name} plan!`);
      setTimeout(() => { setUpgradeMsg(''); setShowPricingModal(false); }, 1800);
    } catch (err: any) {
      setUpgradeMsg(`✗ ${err.message || 'Upgrade failed. Please try again.'}`);
    } finally {
      setIsUpgrading(null);
    }
  };

  const handleOpenCancelModal = async () => {
    if (!user || !familyId) return;
    const { data } = await supabase
      .from('family_members').select('id').eq('family_id', familyId);
    setCancelMemberCount(data?.length ?? 0);
    setCancelError('');
    setCancelMsg('');
    setShowCancelModal(true);
  };

  const handleCancelPlan = async (forceRemove = false) => {
    if (!user || !familyId) return;
    setIsCancelling(true);
    setCancelError('');
    try {
      const newTier = subscriptionTier === 'premium' ? 'pro' : 'free';

      if (subscriptionTier === 'pro') {
        const { data: members } = await supabase
          .from('family_members').select('id')
          .eq('family_id', familyId).order('created_at', { ascending: true });
        const toDelete = members?.slice(1).map((m: any) => m.id) ?? [];
        if (toDelete.length > 0) {
          await supabase.from('family_members').delete().in('id', toDelete);
        }
      } else if (subscriptionTier === 'premium' && cancelMemberCount > 6 && forceRemove) {
        const { data: members } = await supabase
          .from('family_members').select('id')
          .eq('family_id', familyId).order('created_at', { ascending: true });
        const toDelete = members?.slice(6).map((m: any) => m.id) ?? [];
        if (toDelete.length > 0) {
          await supabase.from('family_members').delete().in('id', toDelete);
        }
      }

      const { error } = await supabase.from('users')
        .update({ subscription_tier: newTier }).eq('id', user.id);
      if (error) throw error;

      await supabase.from('subscriptions').delete().eq('user_id', user.id);
      await supabase.from('subscriptions').insert({
        user_id: user.id, plan_name: newTier, status: 'active',
      });

      await refreshBootstrap();
      setCancelMsg(newTier === 'free' ? '✓ Downgraded to Free plan.' : '✓ Downgraded to Family plan.');
      setTimeout(() => { setCancelMsg(''); setShowCancelModal(false); }, 1800);
    } catch (err: any) {
      setCancelError(err.message || 'Cancellation failed. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSaveName = async () => {
    if (!user || isDemoMode || !nameValue.trim()) return;
    setIsSaving(true); setSaveError('');
    try {
      await updateDBUser({ full_name: nameValue.trim() });
      if (familyId) {
        const { data: members } = await supabase
          .from('family_members').select('id')
          .eq('family_id', familyId).order('created_at', { ascending: true }).limit(1);
        if (members && members.length > 0)
          await supabase.from('family_members').update({ name: nameValue.trim() }).eq('id', members[0].id);
        const firstName = nameValue.trim().split(' ')[0];
        await supabase.from('family_profiles')
          .update({ family_name: `${firstName}'s Family` }).eq('id', familyId);
      }
      setSaved(true);
      refreshBootstrap();
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try { await authService.signOut(); navigate('/'); }
    catch (err) { console.error('Sign out failed', err); }
  };

  const handleChangePassword = async () => {
    if (!newPw || newPw !== confirmPw) {
      setPwMsg({ type: 'error', text: 'Passwords do not match.' }); return;
    }
    if (newPw.length < 8) {
      setPwMsg({ type: 'error', text: 'Password must be at least 8 characters.' }); return;
    }
    setPwSaving(true); setPwMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      setPwMsg({ type: 'success', text: 'Password updated successfully!' });
      setNewPw(''); setConfirmPw('');
      setTimeout(() => { setShowPwForm(false); setPwMsg(null); }, 2000);
    } catch (err: any) {
      setPwMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setPwSaving(false);
    }
  };

  const handleExportData = async () => {
    if (!user || isDemoMode) return;
    setIsExporting(true);
    try {
      const uid = user.id;
      const [profileRes, familyRes, membersRes, logsRes, plansRes, mealsRes, groceryRes, itemsRes, insightsRes] =
        await Promise.all([
          supabase.from('users').select('*').eq('id', uid).maybeSingle(),
          supabase.from('family_profiles').select('*').eq('user_id', uid),
          familyId ? supabase.from('family_members').select('*').eq('family_id', familyId) : Promise.resolve({ data: [] }),
          familyId ? supabase.from('nutrition_logs').select('*').in('member_id',
            (await supabase.from('family_members').select('id').eq('family_id', familyId)).data?.map((m: any) => m.id) ?? []
          ) : Promise.resolve({ data: [] }),
          familyId ? supabase.from('meal_plans').select('*').eq('family_id', familyId) : Promise.resolve({ data: [] }),
          familyId ? supabase.from('meals').select('*') : Promise.resolve({ data: [] }),
          familyId ? supabase.from('grocery_lists').select('*').eq('family_id', familyId) : Promise.resolve({ data: [] }),
          familyId ? supabase.from('grocery_items').select('*') : Promise.resolve({ data: [] }),
          familyId ? supabase.from('ai_recommendations').select('*').eq('family_id', familyId) : Promise.resolve({ data: [] }),
        ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        profile: profileRes.data,
        familyProfiles: familyRes.data,
        familyMembers: membersRes.data,
        nutritionLogs: logsRes.data,
        mealPlans: plansRes.data,
        meals: mealsRes.data,
        groceryLists: groceryRes.data,
        groceryItems: itemsRes.data,
        aiRecommendations: insightsRes.data,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nutrinest-ai-data-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') return;
    if (!user) return;
    setIsDeleting(true); setDeleteError('');
    try {
      const uid = user.id;
      let memberIds: string[] = [];
      if (familyId) {
        const { data: mems } = await supabase.from('family_members').select('id').eq('family_id', familyId);
        memberIds = mems?.map((m: any) => m.id) ?? [];
      }

      if (memberIds.length > 0) {
        await supabase.from('nutrition_logs').delete().in('member_id', memberIds);
        await supabase.from('member_allergies').delete().in('member_id', memberIds);
        await supabase.from('member_health_conditions').delete().in('member_id', memberIds);
      }

      if (familyId) {
        const { data: plans } = await supabase.from('meal_plans').select('id').eq('family_id', familyId);
        const planIds = plans?.map((p: any) => p.id) ?? [];
        if (planIds.length > 0) await supabase.from('meals').delete().in('meal_plan_id', planIds);

        const { data: lists } = await supabase.from('grocery_lists').select('id').eq('family_id', familyId);
        const listIds = lists?.map((l: any) => l.id) ?? [];
        if (listIds.length > 0) await supabase.from('grocery_items').delete().in('list_id', listIds);

        await supabase.from('meal_plans').delete().eq('family_id', familyId);
        await supabase.from('grocery_lists').delete().eq('family_id', familyId);
        await supabase.from('ai_recommendations').delete().eq('family_id', familyId);
        await supabase.from('family_members').delete().eq('family_id', familyId);
        await supabase.from('family_profiles').delete().eq('id', familyId);
      }

      await supabase.from('subscriptions').delete().eq('user_id', uid);
      await supabase.from('users').delete().eq('id', uid);

      await supabase.rpc('delete_user').then(({ error }) => {
        if (error) console.error('[DeleteAccount] RPC error:', error.message);
      });

      await supabase.auth.signOut();
      navigate('/', { replace: true });
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-2xl overflow-hidden pb-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account preferences and notifications.</p>
      </div>

      {/* Subscription Card Block */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6 w-full">
        {/* Adjusted to stack dynamically on small screens */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900 dark:text-white text-base">Subscription Plan</h2>
            <p className="text-sm text-gray-500 mt-1 truncate">
              Current plan:{' '}
              <span className={`font-bold ${isPaidPlan ? 'text-emerald-600' : 'text-gray-700 dark:text-gray-300'}`}>
                {displayTier}
              </span>
            </p>
            {!isDemoMode && familyProfile && (
              <p className="text-xs text-gray-400 mt-1 truncate">
                Family: <span className="font-medium">{familyProfile.family_name ?? 'My Family'}</span>
                {familyProfile.household_size ? ` · ${familyProfile.household_size} members` : ''}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto flex-shrink-0">
            {!isDemoMode && subscriptionTier !== 'premium' && (
              <button
                onClick={() => setShowPricingModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm w-full sm:w-auto"
              >
                <Crown size={14} className="flex-shrink-0" />
                <span>{subscriptionTier === 'free' ? 'View Plans' : 'Upgrade to Premium'}</span>
              </button>
            )}
            {!isDemoMode && isPaidPlan && (
              <button
                onClick={handleOpenCancelModal}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium rounded-xl transition-all w-full sm:w-auto"
              >
                Cancel Plan
              </button>
            )}
          </div>
        </div>
        {!isDemoMode && !isPaidPlan && (
          <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-50 dark:border-gray-800/40">
            Free plan: 1 family member · <button onClick={() => setShowPricingModal(true)} className="underline font-medium text-emerald-600">See Family & Premium plans</button> to unlock more.
          </p>
        )}
      </div>

      {/* Profile Settings Card Block */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6 w-full">
        <div className="flex items-center gap-3 mb-5">
          <User size={18} className="text-gray-400 flex-shrink-0" />
          <h2 className="font-semibold text-gray-900 dark:text-white text-base">Profile</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Full Name</label>
            <input
              type="text" value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              disabled={isDemoMode}
              placeholder={isDemoMode ? 'Alex Johnson' : 'Your name'}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Email Address</label>
            <input type="email" value={displayEmail} disabled
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-400 text-xs sm:text-sm cursor-not-allowed" />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
          </div>

          {saveError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg text-sm">{saveError}</div>
          )}
          {!isDemoMode && (
            <button 
              onClick={handleSaveName} 
              disabled={isSaving || !nameValue.trim()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors w-full sm:w-auto"
            >
              {saved ? <><Check size={14} /> Saved!</> : isSaving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Theme Configurations Block */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6 w-full">
        <div className="flex items-center gap-3 mb-4">
          {darkMode ? <Moon size={18} className="text-gray-400 flex-shrink-0" /> : <Sun size={18} className="text-gray-400 flex-shrink-0" />}
          <h2 className="font-semibold text-gray-900 dark:text-white text-base">Appearance</h2>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs sm:text-sm font-medium text-gray-990 dark:text-white">Dark Mode</div>
            <div className="text-[11px] sm:text-xs text-gray-400 mt-0.5 leading-normal">Switch between light and dark themes</div>
          </div>
          <button onClick={toggleDarkMode}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${darkMode ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${darkMode ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications Switch Grid Block */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6 w-full">
        <div className="flex items-center gap-3 mb-4">
          <Bell size={18} className="text-gray-400 flex-shrink-0" />
          <h2 className="font-semibold text-gray-900 dark:text-white text-base">Notifications</h2>
        </div>
        <div className="space-y-4 divide-y divide-gray-50 dark:divide-gray-800/40">
          {([
            { key: 'mealReminders' as const, label: 'Meal Reminders', desc: 'Get reminded to log your meals' },
            { key: 'groceryAlerts' as const, label: 'Grocery Alerts', desc: 'Alerts when your grocery list is ready' },
            { key: 'weeklyReport' as const, label: 'Weekly Report', desc: 'Weekly nutrition summary email' },
          ]).map(({ key, label, desc }, i) => (
            <div key={key} className={`flex items-center justify-between gap-4 ${i > 0 ? 'pt-3' : ''}`}>
              <div>
                <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{label}</div>
                <div className="text-[11px] sm:text-xs text-gray-400 mt-0.5 leading-normal">{desc}</div>
              </div>
              <button onClick={() => setNotifications(n => ({ ...n, [key]: !n[key] }))}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${notifications[key] ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${notifications[key] ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy & Security Controls Block */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6 w-full">
        <div className="flex items-center gap-3 mb-5">
          <Shield size={18} className="text-gray-400 flex-shrink-0" />
          <h2 className="font-semibold text-gray-900 dark:text-white text-base">Privacy & Security</h2>
        </div>
        <div className="space-y-3">
          {/* Password Reset Section */}
          <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden w-full">
            <button
              onClick={() => { setShowPwForm(v => !v); setPwMsg(null); setNewPw(''); setConfirmPw(''); }}
              disabled={isDemoMode}
              className="w-full text-left px-4 py-3 hover:bg-stone-50 dark:hover:bg-gray-800 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50 flex items-center justify-between gap-2"
            >
              <span>Change Password</span>
              <span className="text-xs text-gray-400 flex-shrink-0">{showPwForm ? 'Cancel ↑' : 'Open ↓'}</span>
            </button>

            {showPwForm && !isDemoMode && (
              <div className="px-4 pb-4 pt-2 border-t border-gray-50 dark:border-gray-800 space-y-3 bg-stone-50/50 dark:bg-gray-800/30 w-full">
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-400 mb-1">New Password</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Confirm Password</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {pwMsg && (
                  <div className={`p-3 rounded-lg text-xs font-medium break-words ${pwMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
                    {pwMsg.text}
                  </div>
                )}

                <button 
                  onClick={handleChangePassword} 
                  disabled={pwSaving || !newPw || !confirmPw}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors w-full sm:w-auto"
                >
                  {pwSaving ? <><Loader2 size={13} className="animate-spin" /> Updating…</> : <><Check size={13} /> Update Password</>}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleExportData}
            disabled={isDemoMode || isExporting}
            className="w-full text-left px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-stone-50 dark:hover:bg-gray-800 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isExporting
              ? <><Loader2 size={15} className="animate-spin text-emerald-500" /> Preparing export…</>
              : <><Download size={15} className="text-gray-400 flex-shrink-0" /> Export My Data</>}
          </button>

          {!isDemoMode && (
            <button 
              onClick={handleSignOut}
              className="w-full text-left px-4 py-3 rounded-xl border border-amber-100 dark:border-amber-900/30 hover:bg-amber-50 dark:hover:bg-amber-900/10 text-xs sm:text-sm font-medium text-amber-600 dark:text-amber-400 transition-colors flex items-center gap-2"
            >
              <LogOut size={15} className="flex-shrink-0" /> Sign Out
            </button>
          )}

          {!isDemoMode && (
            <button 
              onClick={() => { setShowDeleteModal(true); setDeleteInput(''); setDeleteError(''); }}
              className="w-full text-left px-4 py-3 rounded-xl border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10 text-xs sm:text-sm font-medium text-red-500 transition-colors flex items-center gap-2"
            >
              <Trash2 size={15} className="flex-shrink-0" /> Delete Account
            </button>
          )}
        </div>
      </div>

      {/* ── Delete Account Modal ───────────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sm:p-8 w-full max-w-sm shadow-2xl overflow-y-auto max-h-[calc(100vh-2rem)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-red-500 min-w-0">
                <AlertTriangle size={20} className="flex-shrink-0" />
                <h2 className="text-base sm:text-lg font-bold truncate">Delete Account</h2>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">
              This will permanently delete <strong>all your data</strong> — family members, meals, nutrition logs, grocery lists, and AI insights.
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-5 leading-normal">
              This action <strong className="text-red-500">cannot be undone</strong>.
            </p>

            <div className="mb-5">
              <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 mb-1.5">
                Type <span className="text-red-500 font-mono">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                placeholder="DELETE"
                className="w-full px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs rounded-lg break-words">{deleteError}</div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteInput !== 'DELETE' || isDeleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors"
              >
                {isDeleting ? <><Loader2 size={12} className="animate-spin" /> Deleting…</> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Pricing Modal Overlay Block ───────────────────────────────────────── */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
          {/* w-[calc(100%-2rem)] sets standard safety bounds on mobile rows */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sm:p-8 w-full max-w-2xl shadow-2xl relative overflow-y-auto max-h-[calc(100vh-2rem)] [scrollbar-width:thin]">
            <button onClick={() => setShowPricingModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
              <X size={20} />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 text-xs font-bold rounded-full mb-3">
                <Zap size={12} /> Upgrade NutriNest
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Choose Your Plan</h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Unlock more members and AI features for your family.</p>
            </div>

            {upgradeMsg && (
              <div className={`mb-5 p-3 rounded-xl text-xs sm:text-sm font-semibold text-center break-words ${
                upgradeMsg.startsWith('✓')
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-600'
              }`}>{upgradeMsg}</div>
            )}

            {/* Changed from flat columns to single stacked column layout on mobile viewports */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-stretch">
              {/* Family Plan */}
              <div className={`rounded-2xl border-2 p-5 sm:p-6 flex flex-col transition-all w-full ${
                subscriptionTier === 'pro'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-emerald-200 dark:border-emerald-800 hover:border-emerald-400'
              }`}>
                <div className="mb-1 flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Family</h3>
                  <div className="flex gap-1 flex-shrink-0">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-wide">Popular</span>
                    {subscriptionTier === 'pro' && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wide">Active</span>}
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-4 leading-normal">Everything a growing family needs.</p>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-5">
                  $12<span className="text-xs font-normal text-gray-500">/month</span>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  {['Up to 6 family members', 'AI meal planner', 'Smart grocery lists', 'Full nutrition dashboard', 'AI recommendations', 'Priority support'].map(f => (
                    <li key={f} className="flex items-center gap-2">
                      <Check size={13} className="text-emerald-500 flex-shrink-0" /><span className="truncate">{f}</span>
                    </li>
                  ))}
                </ul>
                {subscriptionTier === 'pro' ? (
                  <div className="w-full py-2.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold rounded-xl text-xs sm:text-sm text-center flex items-center justify-center gap-2 flex-shrink-0">
                    <Check size={14} /> Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade('pro')}
                    disabled={isUpgrading !== null || subscriptionTier === 'premium'}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 flex-shrink-0"
                  >
                    {isUpgrading === 'pro' ? <><Loader2 size={14} className="animate-spin" /> Upgrading…</> : 'Subscribe — $12/mo'}
                  </button>
                )}
              </div>

              {/* Premium Plan */}
              <div className={`rounded-2xl border-2 p-5 sm:p-6 flex flex-col transition-all w-full ${
                subscriptionTier === 'premium'
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                  : 'border-violet-200 dark:border-violet-800 hover:border-violet-400'
              }`}>
                <div className="mb-1 flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Premium</h3>
                  {subscriptionTier === 'premium' && <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-bold rounded-full uppercase tracking-wide flex-shrink-0">Active</span>}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-4 leading-normal">For health-focused families wanting the best.</p>
                <div className="text-2xl sm:text-3xl font-black text-violet-600 dark:text-violet-400 mb-5">
                  $24<span className="text-xs font-normal text-gray-500">/month</span>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  {['Unlimited family members', 'Everything in Family', 'Advanced analytics', 'Nutritionist consultations', 'Custom diet programs', 'Dedicated support'].map(f => (
                    <li key={f} className="flex items-center gap-2">
                      <Check size={13} className="text-violet-500 flex-shrink-0" /><span className="truncate">{f}</span>
                    </li>
                  ))}
                </ul>
                {subscriptionTier === 'premium' ? (
                  <div className="w-full py-2.5 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-semibold rounded-xl text-xs sm:text-sm text-center flex items-center justify-center gap-2 flex-shrink-0">
                    <Check size={14} /> Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade('premium')}
                    disabled={isUpgrading !== null}
                    className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 flex-shrink-0"
                  >
                    {isUpgrading === 'premium' ? <><Loader2 size={14} className="animate-spin" /> Upgrading…</> : 'Subscribe — $24/mo'}
                  </button>
                )}
              </div>
            </div>

            <p className="text-center text-[11px] text-gray-400 mt-5">
              Cancel anytime · Switch plans at any time
            </p>
          </div>
        </div>
      )}

      {/* ── Cancel Plan Modal ────────────────────────────────────────────── */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sm:p-8 w-full max-w-md shadow-2xl overflow-y-auto max-h-[calc(100vh-2rem)]">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-red-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">
                  {subscriptionTier === 'premium' ? 'Cancel Premium Plan' : 'Cancel Family Plan'}
                </h3>
                <p className="text-xs text-gray-500 truncate">
                  {subscriptionTier === 'premium' ? 'Downgrade to Family ($12/mo)' : 'Downgrade to Free'}
                </p>
              </div>
            </div>

            {cancelMsg ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-sm font-semibold text-center break-words">{cancelMsg}</div>
            ) : (
              <>
                {subscriptionTier === 'pro' && cancelMemberCount > 1 && (
                  <div className="mb-5 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 font-medium mb-1">
                      You have {cancelMemberCount} family members.
                    </p>
                    <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 leading-normal">
                      The Free plan allows only <strong>1 member</strong>. Cancelling will permanently remove <strong>{cancelMemberCount - 1} member{cancelMemberCount - 1 > 1 ? 's' : ''}</strong> from your family dashboard.
                    </p>
                  </div>
                )}

                {subscriptionTier === 'pro' && cancelMemberCount <= 1 && (
                  <p className="mb-5 text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    You'll be downgraded to the <strong>Free plan</strong>. Your single family member profile will be kept intact.
                  </p>
                )}

                {subscriptionTier === 'premium' && cancelMemberCount > 6 && (
                  <div className="mb-5 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 font-medium mb-1">
                      You have {cancelMemberCount} members — Family plan allows up to 6.
                    </p>
                    <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 leading-normal">
                      You need to remove <strong>{cancelMemberCount - 6} member{cancelMemberCount - 6 > 1 ? 's' : ''}</strong> first, or let us delete the most recently added ones automatically.
                    </p>
                  </div>
                )}

                {subscriptionTier === 'premium' && cancelMemberCount <= 6 && (
                  <p className="mb-5 text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    You'll be downgraded to the <strong>Family plan ($12/mo)</strong>. All {cancelMemberCount} of your family members will be preserved safely.
                  </p>
                )}

                {cancelError && (
                  <p className="mb-4 text-xs sm:text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl p-3 break-words">{cancelError}</p>
                )}

                <div className="flex flex-col gap-2">
                  {subscriptionTier === 'premium' && cancelMemberCount > 6 && (
                    <>
                      <button
                        onClick={() => { setShowCancelModal(false); navigate('/dashboard/family'); }}
                        className="w-full py-2.5 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-semibold rounded-xl text-xs sm:text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                      >
                        Manage Family Members manually
                      </button>
                      <button
                        onClick={() => handleCancelPlan(true)}
                        disabled={isCancelling}
                        className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        {isCancelling ? <><Loader2 size={12} className="animate-spin" /> Processing…</> : `Remove excess & downgrade`}
                      </button>
                    </>
                  )}

                  {!(subscriptionTier === 'premium' && cancelMemberCount > 6) && (
                    <button
                      onClick={() => handleCancelPlan(false)}
                      disabled={isCancelling}
                      className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      {isCancelling
                        ? <><Loader2 size={14} className="animate-spin" /> Processing…</>
                        : subscriptionTier === 'pro'
                          ? cancelMemberCount > 1 ? `Remove ${cancelMemberCount - 1} member${cancelMemberCount - 1 > 1 ? 's' : ''} & downgrade to Free` : 'Downgrade to Free'
                          : 'Downgrade to Family plan'}
                    </button>
                  )}

                  <button
                    onClick={() => setShowCancelModal(false)}
                    disabled={isCancelling}
                    className="w-full py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Keep my plan
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}