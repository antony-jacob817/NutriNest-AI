import { useState } from 'react';
import { Plus, Trash2, X, Loader2, Crown, Pencil, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFamilyMembers, MemberUpdate } from '../../hooks/useFamilyMembers';
import { familyMembers as mockMembers } from '../../data/mockData';

const avatarColors = [
  'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
];

const EMPTY_FORM = {
  name: '',
  age: '',
  gender: 'Male',
  dietary_preference: '',
  calorie_goal: '',
  protein_goal: '',
  activity_level: 'Moderate',
};

// ── Inline editable field ────────────────────────────────────────────────────
function EditableField({
  label,
  value,
  placeholder,
  type = 'text',
  options,
  onSave,
}: {
  label: string;
  value: string | number | null;
  placeholder: string;
  type?: string;
  options?: string[];
  onSave: (v: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ''));
  const [saving, setSaving] = useState(false);

  const commit = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setDraft(String(value ?? ''));
    setEditing(false);
  };

  return (
    <div className="bg-stone-50 dark:bg-gray-800 rounded-xl p-3">
      <div className="text-xs font-medium text-gray-400 mb-1">{label}</div>
      {editing ? (
        <div className="flex items-center gap-1.5">
          {options ? (
            <select
              value={draft}
              onChange={e => setDraft(e.target.value)}
              className="flex-1 text-sm bg-white dark:bg-gray-700 border border-emerald-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
            >
              {options.map(o => <option key={o}>{o}</option>)}
            </select>
          ) : (
            <input
              type={type}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
              autoFocus
              className="flex-1 text-sm bg-white dark:bg-gray-700 border border-emerald-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
            />
          )}
          {saving
            ? <Loader2 size={14} className="animate-spin text-emerald-500 flex-shrink-0" />
            : (
              <>
                <button onClick={commit} className="text-emerald-600 hover:text-emerald-700 flex-shrink-0"><Check size={14} /></button>
                <button onClick={cancel} className="text-gray-400 hover:text-gray-600 flex-shrink-0"><X size={14} /></button>
              </>
            )
          }
        </div>
      ) : (
        <div
          onClick={() => { setDraft(String(value ?? '')); setEditing(true); }}
          className="flex items-center gap-1.5 cursor-pointer group/field"
        >
          <span className={`font-bold text-sm ${value ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600 font-normal italic'}`}>
            {value !== null && value !== '' ? String(value) : placeholder}
          </span>
          <Pencil size={11} className="opacity-0 group-hover/field:opacity-100 text-gray-400 flex-shrink-0 transition-opacity" />
        </div>
      )}
    </div>
  );
}

// ── Member card ──────────────────────────────────────────────────────────────
function MemberCard({
  member,
  index,
  isPrimary,
  isDemoMode,
  primaryDisplayName,
  onUpdate,
  onRemove,
}: {
  member: any;
  index: number;
  isPrimary: boolean;
  isDemoMode: boolean;
  primaryDisplayName?: string;
  onUpdate: (id: string, updates: MemberUpdate) => Promise<void>;
  onRemove: (id: string) => void;
}) {
  const save = (field: keyof MemberUpdate) => async (val: string) => {
    let parsed: any = val;
    if (field === 'age' || field === 'calorie_goal' || field === 'protein_goal') {
      parsed = val === '' ? null : parseInt(val);
    }
    if (field === 'height_cm' || field === 'weight_kg') {
      parsed = val === '' ? null : parseFloat(val);
    }
    if (val === '' || val === null) parsed = null;
    await onUpdate(member.id, { [field]: parsed });
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border p-6 ${isPrimary ? 'border-emerald-200 dark:border-emerald-800/50' : 'border-gray-100 dark:border-gray-800'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0 ${avatarColors[index % 4]}`}>
            {member.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {isDemoMode ? (
                <h3 className="font-bold text-gray-900 dark:text-white">{member.name}</h3>
              ) : isPrimary ? (
                // Primary member name is always sourced from users.full_name (AuthContext)
                // so it instantly reflects Settings changes without a DB re-fetch
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {primaryDisplayName ?? member.name}
                </h3>
              ) : (
                <h3 className="font-bold text-gray-900 dark:text-white">{member.name}</h3>
              )}
              {isPrimary && (
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-full">
                  You
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {member.gender ?? member.role ?? 'Member'}
              {member.age ? ` · Age ${member.age}` : ''}
            </p>
          </div>
        </div>
        {!isDemoMode && !isPrimary && (
          <button
            onClick={() => onRemove(member.id)}
            className="text-gray-300 hover:text-red-400 transition-colors mt-1"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {isDemoMode ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-stone-50 dark:bg-gray-800 rounded-xl p-3">
            <div className="text-xs font-medium text-gray-400 mb-1">Daily Calories</div>
            <div className="font-bold text-gray-900 dark:text-white text-sm">{member.calories ?? 2000} kcal</div>
          </div>
          <div className="bg-stone-50 dark:bg-gray-800 rounded-xl p-3">
            <div className="text-xs font-medium text-gray-400 mb-1">Goal</div>
            <div className="font-bold text-gray-900 dark:text-white text-sm">{member.goal ?? 'Maintenance'}</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {/* For the primary member, name is locked (managed via Settings) */}
          {!isPrimary && (
            <EditableField label="Name" value={member.name} placeholder="Name" onSave={save('name')} />
          )}
          <EditableField label="Age" value={member.age} placeholder="Tap to set" type="number" onSave={save('age')} />
          <EditableField label="Gender" value={member.gender} placeholder="Select" options={['Male', 'Female', 'Other', 'Prefer not to say']} onSave={save('gender')} />
          <EditableField label="Calorie Goal (kcal)" value={member.calorie_goal} placeholder="e.g. 2000" type="number" onSave={save('calorie_goal')} />
          <EditableField label="Protein Goal (g)" value={member.protein_goal} placeholder="e.g. 80" type="number" onSave={save('protein_goal')} />
          <EditableField label="Height (cm)" value={member.height_cm} placeholder="e.g. 170" type="number" onSave={save('height_cm')} />
          <EditableField label="Weight (kg)" value={member.weight_kg} placeholder="e.g. 65" type="number" onSave={save('weight_kg')} />
          <EditableField
            label="Activity Level"
            value={member.activity_level}
            placeholder="Select"
            options={['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active']}
            onSave={save('activity_level')}
          />
          <EditableField label="Diet Preference" value={member.dietary_preference} placeholder="e.g. Vegetarian" onSave={save('dietary_preference')} />
        </div>
      )}

      {/* Allergies */}
      {member.allergies && member.allergies.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-medium text-gray-400 mb-2">Allergies</div>
          <div className="flex flex-wrap gap-1">
            {member.allergies.map((a: string) => (
              <span key={a} className="px-2 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs rounded-lg font-medium">
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {!isDemoMode && (
        <p className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-50 dark:border-gray-800">
          {isPrimary
            ? <>Your name is managed in <span className="font-semibold text-emerald-600">Settings → Profile</span>. Click any other field to edit.</>           
            : 'Click any field to edit · Changes save instantly'}
        </p>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function Family() {
  const { isDemoMode, familyId, subscriptionTier, isBootstrapping, bootstrapError, refreshBootstrap, dbUser } = useAuth();
  const { members: dbMembers, isLoading, error, addMember, updateMember, removeMember } = useFamilyMembers(familyId, isDemoMode);

  const members = isDemoMode ? mockMembers : dbMembers;
  const primaryMemberId = !isDemoMode && members.length > 0 ? members[0].id : null;

  // ── Tier-based member limits ──────────────────────────────────────────────
  // Free: 1 | Family/Pro: 6 | Premium: unlimited
  const maxMembers = subscriptionTier === 'premium' ? Infinity
    : subscriptionTier === 'pro' ? 6
    : 1; // free
  const atLimit = !isDemoMode && members.length >= maxMembers;

  const [showAdd, setShowAdd] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [newMember, setNewMember] = useState(EMPTY_FORM);

  const handleAddClick = () => {
    if (isDemoMode) return;
    if (atLimit) {
      setShowPaywall(true);
      return;
    }
    setShowAdd(true);
    setAddError('');
    setNewMember(EMPTY_FORM);
  };

  const handleAddMember = async () => {
    if (!newMember.name.trim()) return;
    setIsAdding(true);
    setAddError('');
    try {
      await addMember({ name: newMember.name.trim() });
      setNewMember(EMPTY_FORM);
      setShowAdd(false);
    } catch (err: any) {
      setAddError(err.message || 'Failed to add member. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdate = async (id: string, updates: MemberUpdate) => {
    await updateMember(id, updates);
  };

  const handleRemove = async (id: string) => {
    if (isDemoMode || id === primaryMemberId) return;
    try { await removeMember(id); } catch { /* error in hook */ }
  };

  if (!isDemoMode && (isBootstrapping || isLoading)) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Family Members</h1></div>
        <div className="flex flex-col items-center justify-center py-20 gap-4 border border-dashed rounded-2xl border-gray-200 dark:border-gray-800">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
          <p className="text-sm text-gray-500">Setting up your family profile…</p>
        </div>
      </div>
    );
  }

  if (!isDemoMode && bootstrapError) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Family Members</h1></div>
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700 dark:text-red-300 mb-1">Database Setup Required</p>
              <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed">{bootstrapError}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-red-100 dark:border-red-900 mb-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">How to fix:</p>
            <p className="text-xs text-gray-500 font-mono">Supabase Dashboard → SQL Editor → paste &amp; run supabase_schema.sql</p>
          </div>
          <button onClick={refreshBootstrap} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl">
            <RefreshCw size={14} /> Retry Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Family Members</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isDemoMode
              ? 'Manage individual profiles, goals, and dietary needs.'
              : 'Your profile is auto-created. Click any field to edit details.'}
          </p>
        </div>
        <button
          onClick={handleAddClick}
          disabled={isDemoMode}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus size={15} />
          Add Member
        </button>
      </div>

      {/* Tier-aware member limit banner */}
      {!isDemoMode && (
        <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${
          subscriptionTier === 'free'
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40'
            : subscriptionTier === 'pro'
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40'
            : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40'
        }`}>
          <Crown size={16} className={subscriptionTier === 'free' ? 'text-amber-500 flex-shrink-0' : subscriptionTier === 'pro' ? 'text-blue-500 flex-shrink-0' : 'text-emerald-500 flex-shrink-0'} />
          <p className={`text-sm ${
            subscriptionTier === 'free' ? 'text-amber-700 dark:text-amber-300'
            : subscriptionTier === 'pro' ? 'text-blue-700 dark:text-blue-300'
            : 'text-emerald-700 dark:text-emerald-300'
          }`}>
            {subscriptionTier === 'free' && (
              <><strong>Free Plan:</strong> 1 member included (you).{' '}
              <button onClick={() => setShowPaywall(true)} className="underline font-semibold">Upgrade to Family ($12/mo)</button>{' '}for up to 6 members.</>
            )}
            {subscriptionTier === 'pro' && (
              <><strong>Family Plan:</strong> {members.length}/6 members used.{' '}
              {members.length >= 6 && <><button onClick={() => setShowPaywall(true)} className="underline font-semibold">Upgrade to Premium ($24/mo)</button>{' '}for unlimited members.</>}
              </>
            )}
            {subscriptionTier === 'premium' && (
              <><strong>Premium Plan:</strong> Unlimited family members. ✨</>
            )}
          </p>
        </div>
      )}

      {/* Edit helper */}
      {!isDemoMode && members.length > 0 && (
        <div className="flex items-start gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl">
          <AlertCircle size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Tip:</strong> Click any field on your profile card to edit it. Changes are saved automatically.
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm">{error}</div>
      )}

      {/* Member cards */}
      <div className="grid md:grid-cols-2 gap-5">
        {members.length === 0 ? (
          <div className="md:col-span-2 text-center py-16 border border-dashed rounded-2xl border-gray-200 dark:border-gray-800">
            <div className="text-4xl mb-3">👨‍👩‍👧‍👦</div>
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Setting up your profile…</p>
            <p className="text-sm text-gray-400">Refresh the page in a moment if your profile doesn't appear.</p>
          </div>
        ) : (
          members.map((m: any, i: number) => (
            <MemberCard
              key={m.id}
              member={m}
              index={i}
              isPrimary={m.id === primaryMemberId}
              isDemoMode={isDemoMode}
              primaryDisplayName={m.id === primaryMemberId ? (dbUser?.full_name ?? m.name) : undefined}
              onUpdate={handleUpdate}
              onRemove={handleRemove}
            />
          ))
        )}
      </div>

      {/* ── Add Member Modal ───────────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add Family Member</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            {addError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm">{addError}</div>
            )}

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Enter their name to create the profile. You can fill in all other details (age, goals, etc.) by clicking the fields on their card.
            </p>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Emma"
                value={newMember.name}
                onChange={e => setNewMember(n => ({ ...n, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleAddMember()}
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                disabled={isAdding || !newMember.name.trim()}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              >
                {isAdding ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : 'Create Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Paywall Modal ──────────────────────────────────────────────────── */}
      {showPaywall && (() => {
        // Free → Family plan | Pro → Premium plan
        const upgradingToPremium = subscriptionTier === 'pro';
        const planName    = upgradingToPremium ? 'Premium' : 'Family';
        const price       = upgradingToPremium ? '$24' : '$12';
        const limitMsg    = upgradingToPremium
          ? 'You\'ve reached the Family plan limit of 6 members.'
          : 'You\'ve reached the free plan limit of 1 family member.';
        const upgradeMsg  = upgradingToPremium
          ? 'Upgrade to Premium for unlimited members and advanced analytics.'
          : 'Upgrade to Family to add up to 6 members and unlock all AI features.';
        const features    = upgradingToPremium
          ? ['Unlimited family members', 'Everything in Family plan', 'Advanced analytics', 'Nutritionist consultations', 'Custom diet programs', 'Dedicated support']
          : ['Up to 6 family members', 'AI meal planner', 'Smart grocery lists', 'Full nutrition dashboard', 'AI recommendations', 'Priority support'];

        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 p-8 w-full max-w-md shadow-2xl relative text-center">
              <button
                onClick={() => setShowPaywall(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>

              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Crown size={28} className="text-emerald-600" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Upgrade to {planName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                <strong>{limitMsg}</strong><br />
                {upgradeMsg}
              </p>

              <div className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 mb-6">
                {price}<span className="text-sm font-normal text-gray-500">/mo</span>
              </div>

              <ul className="text-left space-y-2.5 mb-8 text-sm text-gray-700 dark:text-gray-300 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setShowPaywall(false)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-600/20"
              >
                Subscribe Now — {price}/mo
              </button>
              <button
                onClick={() => setShowPaywall(false)}
                className="mt-3 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Maybe later
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
