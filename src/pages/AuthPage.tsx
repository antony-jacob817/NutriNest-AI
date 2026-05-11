import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, ChevronRight } from 'lucide-react';

import Logo from '../assets/Logo.png';
import { authService } from '../services/auth';

type Mode = 'login' | 'signup' | 'onboarding';

const dietOptions = ['No Restriction', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Keto', 'Paleo', 'Dairy-Free', 'Halal', 'Kosher'];
const goalOptions = ['Weight Loss', 'Muscle Gain', 'Maintenance', 'Heart Health', 'Energy Boost', 'Family Wellness'];
const allergyOptions = ['Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Gluten', 'Shellfish', 'Soy', 'Fish'];

export default function AuthPage({ defaultMode = 'login' }: { defaultMode?: 'login' | 'signup' }) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    familySize: '2',
    dietPreferences: [] as string[],
    allergies: [] as string[],
    goals: [] as string[],
  });

  const toggleMulti = (field: 'dietPreferences' | 'allergies' | 'goals', val: string) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(val) ? f[field].filter(x => x !== val) : [...f[field], val],
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);
    try {
      await authService.signIn(form.email, form.password);
      // Wait a moment for AuthContext listener to pick up the session
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err: any) {
      if (err.message.includes('Email not confirmed')) {
        setAuthError('Please verify your email address before logging in.');
      } else {
        setAuthError(err.message || 'Invalid email or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setMode('onboarding');
  };

  const handleOnboardingComplete = async () => {
    setAuthError('');
    setIsLoading(true);
    try {
      await authService.signUp(form.email, form.password, {
        full_name: form.fullName,
        family_size: form.familySize,
        diet_preferences: form.dietPreferences,
        allergies: form.allergies,
        goals: form.goals
      });
      setIsEmailSent(true);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-emerald-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-6">
            <img src={Logo} alt="NutriNest AI" className="h-10 w-10 rounded-xl object-cover" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">NutriNest AI</span>
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
          {isEmailSent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check your email</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                We've sent a confirmation link to <span className="font-semibold text-gray-700 dark:text-gray-300">{form.email}</span>. 
                Please click the link to activate your account.
              </p>
              <button 
                onClick={() => {
                  setIsEmailSent(false);
                  setMode('login');
                }}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl transition-colors text-sm"
              >
                Return to Login
              </button>
            </div>
          ) : mode === 'login' ? (
            <>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Welcome back</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Sign in to your NutriNest account</p>

              {authError && <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm">{authError}</div>}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{' '}
                  <button onClick={() => setMode('signup')} className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                    Sign up free
                  </button>
                </p>
              </div>
            </>
          ) : mode === 'signup' ? (
            <>
              <div className="flex items-center gap-2 mb-6">
                <button onClick={() => setMode('login')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Free forever, no credit card required</p>
                </div>
              </div>

              <form onSubmit={handleSignup} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                    placeholder="Alex Johnson"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Min. 8 characters"
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors text-sm">
                  Continue <ChevronRight size={16} className="inline ml-1" />
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <button onClick={() => setMode('login')} className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">Sign in</button>
                </p>
              </div>
            </>
          ) : mode === 'onboarding' ? (
            <>
              <div className="mb-6">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3].map(s => (
                    <div key={s} className={`h-1 flex-1 rounded-full ${s <= (step === 4 ? 3 : step > 2 ? step - 1 : step) ? 'bg-emerald-500' : 'bg-gray-100 dark:bg-gray-800'}`} />
                  ))}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {step === 2
                    ? `NutriNest ${form.familySize === '6+' ? 'Premium' : 'Family'}`
                    : step === 3 ? 'Personalize your experience'
                    : step === 4 ? 'Your health goals'
                    : 'Set up your family'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {step === 2
                    ? `${form.familySize === '6+' ? '$24' : '$12'}/mo · Cancel anytime`
                    : `Step ${step > 2 ? step - 1 : step} of 3`}
                </p>
              </div>

              {authError && <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm">{authError}</div>}

              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Family Size</label>
                    <select
                      value={form.familySize}
                      onChange={e => setForm(f => ({ ...f, familySize: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    >
                      {['1', '2', '3', '4', '5', '6+'].map(n => (
                        <option key={n} value={n}>{n} {n === '1' ? 'person' : 'people'}</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={() => {
                    if (parseInt(form.familySize) > 1 || form.familySize === '6+') {
                      setStep(2);
                    } else {
                      setStep(3);
                    }
                  }} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm">
                    Next
                  </button>
                </div>
              )}

              {step === 2 && (() => {
                const isPremiumSize = form.familySize === '6+';
                const planName  = isPremiumSize ? 'Premium' : 'Family';
                const price     = isPremiumSize ? '$24' : '$12';
                const planDesc  = isPremiumSize
                  ? 'For health-focused families wanting the best.'
                  : 'Everything a growing family needs.';
                const features  = isPremiumSize
                  ? ['Unlimited family members', 'Everything in Family', 'Advanced analytics', 'Nutritionist consultations', 'Custom diet programs', 'Dedicated support']
                  : ['Up to 6 family members', 'AI meal planner', 'Smart grocery lists', 'Full nutrition dashboard', 'AI recommendations', 'Priority support'];

                return (
                  <div className="space-y-5 text-center">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">NutriNest {planName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{planDesc}</p>
                      <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mb-6">
                        {price}<span className="text-sm font-normal text-gray-500">/mo</span>
                      </div>

                      <ul className="text-left space-y-3 mb-6 text-sm text-gray-700 dark:text-gray-300">
                        {features.map(f => (
                          <li key={f} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>

                      <button onClick={() => setStep(3)} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-600/20">
                        Subscribe & Continue — {price}/mo
                      </button>
                    </div>
                    <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Back to Family Size</button>
                  </div>
                );
              })()}

              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Dietary Preferences</label>
                    <div className="flex flex-wrap gap-2">
                      {dietOptions.map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleMulti('dietPreferences', opt)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            form.dietPreferences.includes(opt)
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Allergies</label>
                    <div className="flex flex-wrap gap-2">
                      {allergyOptions.map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleMulti('allergies', opt)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            form.allergies.includes(opt)
                              ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300'
                              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setStep(parseInt(form.familySize) > 1 || form.familySize === '6+' ? 2 : 1)} className="flex-1 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">Back</button>
                    <button onClick={() => setStep(4)} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm">Next</button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Fitness & Health Goals</label>
                    <div className="flex flex-wrap gap-2">
                      {goalOptions.map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleMulti('goals', opt)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            form.goals.includes(opt)
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setStep(3)} disabled={isLoading} className="flex-1 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">Back</button>
                    <button onClick={handleOnboardingComplete} disabled={isLoading} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm">
                      {isLoading ? 'Creating Account...' : 'Complete & Sign Up'}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
