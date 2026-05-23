import { useState } from 'react';
import { Plus, Trash2, X, Loader2, Crown, Pencil, Check, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
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
    <div className="bg-stone-50 dark:bg-gray-800 rounded-xl p-3 w-full" onClick={(e) => e.stopPropagation()}>
      <div className="text-[10px] font-medium text-gray-400 mb-1 truncate">{label}</div>
      {editing ? (
        <div className="flex items-center gap-1.5">
          {options ? (
            <select
              value={draft}
              onChange={e => setDraft(e.target.value)}
              className="flex-1 text-xs bg-white dark:bg-gray-700 border border-emerald-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white min-w-0"
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
              className="flex-1 text-xs bg-white dark:bg-gray-700 border border-emerald-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white min-w-0"
            />
          )}
          {saving
            ? <Loader2 size={12} className="animate-spin text-emerald-500 flex-shrink-0" />
            : (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={commit} className="text-emerald-600 hover:text-emerald-700"><Check size={14} /></button>
                <button onClick={cancel} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
              </div>
            )
          }
        </div>
      ) : (
        <div
          onClick={() => { setDraft(String(value ?? '')); setEditing(true); }}
          className="flex items-center justify-between gap-1.5 cursor-pointer group/field w-full min-w-0"
        >
          <span className={`font-bold text-xs sm:text-sm truncate ${value ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600 font-normal italic'}`}>
            {value !== null && value !== '' ? String(value) : placeholder}
          </span>
          <Pencil size={10} className="opacity-0 group-hover/field:opacity-100 text-gray-400 flex-shrink-0 transition-opacity" />
        </div>
      )}
    </div>
  );
}

function MemberCard({
  member,
  index,
  isPrimary,
  isDemoMode,
  primaryDisplayName,
  onUpdate,
  onRemove,
  onMobileClick,
}: {
  member: any;
  index: number;
  isPrimary: boolean;
  isDemoMode: boolean;
  primaryDisplayName?: string;
  onUpdate: (id: string, updates: MemberUpdate) => Promise<void>;
  onRemove: (id: string) => void;
  onMobileClick?: () => void;
}) {
  const save = (field: keyof MemberUpdate) => async (val: string) => {
    let parsed: any = val;
    if (field === 'age' || field === 'calorie_goal' || field === 'protein_goal') {
      parsed = val === '' ? null : parseInt(val, 10);
    }
    if (field === 'height_cm' || field === 'weight_kg') {
      parsed = val === '' ? null : parseFloat(val);
    }
    if (val === '' || val === null) parsed = null;
    await onUpdate(member.id, { [field]: parsed });
  };

  const displayName = isPrimary && primaryDisplayName ? primaryDisplayName : member.name;

  return (
    <div 
      onClick={() => {
        if (window.innerWidth < 768 && onMobileClick) {
          onMobileClick();
        }
      }}
      className={`bg-white dark:bg-gray-900 rounded-2xl border p-3.5 sm:p-6 w-full flex flex-col justify-between cursor-pointer md:cursor-default transition-all ${
        isPrimary ? 'border-emerald-200 dark:border-emerald-800/50' : 'border-gray-100 dark:border-gray-800'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-1.5 mb-3">
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <div className={`w-9 h-9 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center font-bold text-sm sm:text-xl flex-shrink-0 ${avatarColors[index % 4]}`}>
              {displayName?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-base truncate max-w-[85px] sm:max-w-none">
                  {displayName}
                </h3>
                {isPrimary && (
                  <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-[8px] sm:text-[10px] font-semibold rounded-full flex-shrink-0">
                    You
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 truncate">
                {member.gender ?? member.role ?? 'Member'}
                {member.age ? ` · Age ${member.age}` : ''}
              </p>
            </div>
          </div>
          {!isDemoMode && !isPrimary && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(member.id);
              }}
              className="hidden md:block text-gray-300 hover:text-red-400 transition-colors mt-1 flex-shrink-0"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* Desktop-only Editable Field Parameter Stream */}
        <div className="hidden md:grid grid-cols-2 gap-2">
          {isDemoMode ? (
            <>
              <div className="bg-stone-50 dark:bg-gray-800 rounded-xl p-3 min-w-0">
                <div className="text-[10px] font-medium text-gray-400 mb-1 truncate">Daily Calories</div>
                <div className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm truncate">{member.calories ?? 2000} kcal</div>
              </div>
              <div className="bg-stone-50 dark:bg-gray-800 rounded-xl p-3 min-w-0">
                <div className="text-[10px] font-medium text-gray-400 mb-1 truncate">Goal</div>
                <div className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm truncate">{member.goal ?? 'Maintenance'}</div>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Compact Mobile Layout Preview Stream */}
        <div className="md:hidden space-y-1 mt-1 text-[10px] text-gray-500 dark:text-gray-400">
          <div className="truncate">Pref: <span className="font-semibold text-gray-800 dark:text-gray-200">{member.dietary_preference || 'None'}</span></div>
          <div className="truncate">Goal: <span className="font-semibold text-gray-800 dark:text-gray-200">{member.calorie_goal ? `${member.calorie_goal} kcal` : (member.goal || '—')}</span></div>
        </div>

        {/* Desktop-only allergy lists render */}
        {member.allergies && member.allergies.length > 0 && (
          <div className="hidden md:block mt-3">
            <div className="text-[10px] font-medium text-gray-400 mb-1.5">Allergies</div>
            <div className="flex flex-wrap gap-1">
              {member.allergies.map((a: string) => (
                <span key={a} className="px-2 py-0.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[10px] rounded-lg font-medium">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <span className="md:hidden text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-2.5 flex items-center gap-0.5">
        View & Edit <ArrowRight size={9} />
      </span>

      {!isDemoMode && (
        <p className="hidden md:block text-[10px] sm:text-xs text-gray-400 mt-3 pt-2 border-t border-gray-50 dark:border-gray-800 leading-normal">
          {isPrimary
            ? <>Your name is managed in <span className="font-semibold text-emerald-600">Settings</span>. Click any other field to edit.</>           
            : 'Click any field to edit · Saves instantly'}
        </p>
      )}
    </div>
  );
}

export default function Family() {
  const { isDemoMode, familyId, subscriptionTier, isBootstrapping, bootstrapError, refreshBootstrap, dbUser } = useAuth();
  const { members: dbMembers, isLoading, error, addMember, updateMember, removeMember } = useFamilyMembers(familyId, isDemoMode);

  const members = isDemoMode ? mockMembers : dbMembers;
  const primaryMemberId = !isDemoMode && members.length > 0 ? members[0].id : null;

  const maxMembers = subscriptionTier === 'premium' ? Infinity
    : subscriptionTier === 'pro' ? 6
    : 1;
  const atLimit = !isDemoMode && members.length >= maxMembers;

  const [showAdd, setShowAdd] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [newMember, setNewMember] = useState(EMPTY_FORM);

  // Mobile Details Overlay State Managers
  const [selectedMobileMember, setSelectedMobileMember] = useState<any | null>(null);
  const [selectedMobileIndex, setSelectedMobileIndex] = useState<number>(0);

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
    // Dynamic runtime state binding updates for live modal viewport sync mirrors
    if (selectedMobileMember && selectedMobileMember.id === id) {
      setSelectedMobileMember((prev: any) => ({ ...prev, ...updates }));
    }
  };

  const handleRemove = async (id: string) => {
    if (isDemoMode || id === primaryMemberId) return;
    try { 
      await removeMember(id); 
      if (selectedMobileMember?.id === id) {
        setSelectedMobileMember(null);
      }
    } catch { /* logged in hook */ }
  };

  if (!isDemoMode && (isBootstrapping || isLoading)) {
    return (
      <div className="space-y-6 w-full">
        <div><h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Family Members</h1></div>
        <div className="flex flex-col items-center justify-center py-20 gap-4 border border-dashed rounded-2xl border-gray-200 dark:border-gray-800">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
          <p className="text-sm text-gray-500">Setting up your family profile…</p>
        </div>
      </div>
    );
  }

  if (!isDemoMode && bootstrapError) {
    return (
      <div className="space-y-6 w-full">
        <div><h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Family Members</h1></div>
        <div className="p-4 sm:p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-red-700 dark:text-red-300 mb-1 text-sm sm:text-base">Database Setup Required</p>
              <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 leading-relaxed break-words">{bootstrapError}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-red-100 dark:border-red-900 mb-4 overflow-x-auto">
            <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">How to fix:</p>
            <p className="text-[11px] sm:text-xs text-gray-500 font-mono whitespace-nowrap">Supabase Dashboard → SQL Editor → paste &amp; run supabase_schema.sql</p>
          </div>
          <button onClick={refreshBootstrap} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl">
            <RefreshCw size={14} /> Retry Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Family Members</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isDemoMode
              ? 'Manage individual profiles, goals, and dietary needs.'
              : 'Your profile is auto-created. Click any field to edit details.'}
          </p>
        </div>
        <button
          onClick={handleAddClick}
          disabled={isDemoMode}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors w-full sm:w-auto"
        >
          <Plus size={15} />
          Add Member
        </button>
      </div>

      {!isDemoMode && (
        <div className={`flex items-start gap-3 px-4 py-3 rounded-2xl border ${
          subscriptionTier === 'free'
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40'
            : subscriptionTier === 'pro'
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40'
            : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40'
        }`}>
          <Crown size={16} className={`mt-0.5 flex-shrink-0 ${subscriptionTier === 'free' ? 'text-amber-500' : subscriptionTier === 'pro' ? 'text-blue-500' : 'text-emerald-500'}`} />
          <p className={`text-xs sm:text-sm leading-relaxed ${
            subscriptionTier === 'free' ? 'text-amber-700 dark:text-amber-300'
            : subscriptionTier === 'pro' ? 'text-blue-700 dark:text-blue-300'
            : 'text-emerald-700 dark:text-emerald-300'
          }`}>
            {subscriptionTier === 'free' && (
              <><strong>Free Plan:</strong> 1 member included (you).{' '}
              <button onClick={() => setShowPaywall(true)} className="underline font-semibold whitespace-nowrap">Upgrade to Family ($12/mo)</button>{' '}for up to 6 members.</>
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

      {!isDemoMode && members.length > 0 && (
        <div className="flex items-start gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl">
          <AlertCircle size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 leading-normal">
            <strong>Tip:</strong> Click any field on your profile card to edit it. Changes are saved automatically.
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs sm:text-sm">{error}</div>
      )}

      {/* 2 Cards in a Row Mobile Layout Structure Frame */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-5">
        {members.length === 0 ? (
          <div className="col-span-2 text-center py-16 border border-dashed rounded-2xl border-gray-200 dark:border-gray-800 px-4">
            <div className="text-3xl mb-3">👨‍👩‍👧‍👦</div>
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-1 text-sm sm:text-base">Setting up your profile…</p>
            <p className="text-xs text-gray-400">Refresh the page in a moment if your profile doesn't appear.</p>
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
              onMobileClick={() => {
                setSelectedMobileIndex(i);
                setSelectedMobileMember(m);
              }}
            />
          ))
        )}
      </div>

      {/* Modal Add Member Panel */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sm:p-8 w-full max-w-sm shadow-2xl overflow-y-auto max-h-[calc(100vh-2rem)]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Add Family Member</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            {addError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs sm:text-sm">{addError}</div>
            )}

            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4 leading-normal">
              Enter their name to create the profile. You can fill in all other details (age, goals, etc.) by clicking the fields on their card.
            </p>

            <div className="mb-5">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Emma"
                value={newMember.name}
                onChange={e => setNewMember(n => ({ ...n, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleAddMember()}
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                disabled={isAdding || !newMember.name.trim()}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2"
              >
                {isAdding ? <><Loader2 size={12} className="animate-spin" /> Creating…</> : 'Create Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE FULL EDIT AND DETAILS SLIDE OVERLAY BOTTOM SHEET MODAL */}
      {selectedMobileMember && (() => {
        const isPrimary = selectedMobileMember.id === primaryMemberId;
        const displayName = isPrimary ? (dbUser?.full_name ?? selectedMobileMember.name) : selectedMobileMember.name;
        
        const saveMobileField = (field: keyof MemberUpdate) => async (val: string) => {
          let parsed: any = val;
          if (field === 'age' || field === 'calorie_goal' || field === 'protein_goal') {
            parsed = val === '' ? null : parseInt(val, 10);
          }
          if (field === 'height_cm' || field === 'weight_kg') {
            parsed = val === '' ? null : parseFloat(val);
          }
          if (val === '' || val === null) parsed = null;
          await handleUpdate(selectedMobileMember.id, { [field]: parsed });
        };

        return (
          <div className="md:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="absolute inset-0" onClick={() => setSelectedMobileMember(null)} />
            
            <div className="bg-white dark:bg-gray-900 w-full rounded-t-3xl p-5 shadow-2xl relative z-10 border-t border-gray-100 dark:border-gray-800 overflow-y-auto max-h-[85vh] animate-slideUp">
              {/* Pill Handle bar */}
              <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-5" onClick={() => setSelectedMobileMember(null)} />
              
              <button 
                onClick={() => setSelectedMobileMember(null)}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-50 dark:bg-gray-800 rounded-full"
              >
                <X size={16} />
              </button>

              {/* Profile Card Summary Header */}
              <div className="flex items-center gap-3.5 border-b border-gray-100 dark:border-gray-800/60 pb-4 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${avatarColors[selectedMobileIndex % 4]}`}>
                  {displayName?.charAt(0)?.toUpperCase() ?? 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">
                      {displayName}
                    </h3>
                    {isPrimary && (
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selectedMobileMember.gender ?? selectedMobileMember.role ?? 'Member'}
                    {selectedMobileMember.age ? ` · Age ${selectedMobileMember.age}` : ''}
                  </p>
                </div>
                {!isDemoMode && !isPrimary && (
                  <button
                    onClick={() => handleRemove(selectedMobileMember.id)}
                    className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-xl hover:text-rose-600 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Comprehensive Field Setup Matrices inside Scroll Track */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Profile Specifications</h4>
                
                <div className="grid grid-cols-2 gap-2.5">
                  {isDemoMode ? (
                    <>
                      <div className="bg-stone-50 dark:bg-gray-800 rounded-xl p-3">
                        <div className="text-[10px] font-medium text-gray-400 mb-1">Daily Calories</div>
                        <div className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">{selectedMobileMember.calories ?? 2000} kcal</div>
                      </div>
                      <div className="bg-stone-50 dark:bg-gray-800 rounded-xl p-3">
                        <div className="text-[10px] font-medium text-gray-400 mb-1">Goal</div>
                        <div className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">{selectedMobileMember.goal ?? 'Maintenance'}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      {!isPrimary && (
                        <EditableField label="Name" value={selectedMobileMember.name} placeholder="Name" onSave={saveMobileField('name')} />
                      )}
                      <EditableField label="Age" value={selectedMobileMember.age} placeholder="Tap to set" type="number" onSave={saveMobileField('age')} />
                      <EditableField label="Gender" value={selectedMobileMember.gender} placeholder="Select" options={['Male', 'Female', 'Other', 'Prefer not to say']} onSave={saveMobileField('gender')} />
                      <EditableField label="Calorie Goal (kcal)" value={selectedMobileMember.calorie_goal} placeholder="e.g. 2000" type="number" onSave={saveMobileField('calorie_goal')} />
                      <EditableField label="Protein Goal (g)" value={selectedMobileMember.protein_goal} placeholder="e.g. 80" type="number" onSave={saveMobileField('protein_goal')} />
                      <EditableField label="Height (cm)" value={selectedMobileMember.height_cm} placeholder="e.g. 170" type="number" onSave={saveMobileField('height_cm')} />
                      <EditableField label="Weight (kg)" value={selectedMobileMember.weight_kg} placeholder="e.g. 65" type="number" onSave={saveMobileField('weight_kg')} />
                      <EditableField
                        label="Activity Level"
                        value={selectedMobileMember.activity_level}
                        placeholder="Select"
                        options={['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active']}
                        onSave={saveMobileField('activity_level')}
                      />
                      <EditableField label="Diet Preference" value={selectedMobileMember.dietary_preference} placeholder="e.g. Vegetarian" onSave={saveMobileField('dietary_preference')} />
                    </>
                  )}
                </div>

                {/* Mobile allergy badge row indicators */}
                {selectedMobileMember.allergies && selectedMobileMember.allergies.length > 0 && (
                  <div className="pt-2">
                    <div className="text-[10px] font-medium text-gray-400 mb-1.5">Allergies</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedMobileMember.allergies.map((a: string) => (
                        <span key={a} className="px-2.5 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[10px] rounded-lg font-medium">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {!isDemoMode && (
                  <p className="text-[10px] text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800 leading-normal">
                    {isPrimary
                      ? <>Your name is managed in <span className="font-semibold text-emerald-600">Settings</span>. Click any other field above to edit dynamic records directly.</>           
                      : 'Tap any box field above to edit specifications · Saves instantly.'}
                  </p>
                )}

                <button
                  onClick={() => setSelectedMobileMember(null)}
                  className="w-full py-3 mt-4 bg-emerald-600 text-white font-semibold rounded-xl text-xs transition-colors shadow-md shadow-emerald-600/10"
                >
                  Done Editing
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Paywall Overlay Panel */}
      {showPaywall && (() => {
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
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 p-5 sm:p-8 w-full max-w-md shadow-2xl relative text-center overflow-y-auto max-h-[100vh-2rem]">
              <button
                onClick={() => setShowPaywall(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>

              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Crown size={24} className="text-emerald-600" />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Upgrade to {planName}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-5 leading-relaxed">
                <strong>{limitMsg}</strong><br />
                {upgradeMsg}
              </p>

              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 mb-5">
                {price}<span className="text-xs sm:text-sm font-normal text-gray-500">/mo</span>
              </div>

              <ul className="text-left space-y-2 mb-6 text-xs sm:text-sm text-gray-700 dark:text-gray-300 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="truncate">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setShowPaywall(false)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors shadow-lg shadow-emerald-600/20"
              >
                Subscribe Now — {price}/mo
              </button>
              <button
                onClick={() => setShowPaywall(false)}
                className="mt-3 text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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