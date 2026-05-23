import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for individuals getting started.',
    features: ['1 family member', 'Basic meal planner', '7-day meal history', 'Manual grocery list'],
    cta: 'Get Started',
    featured: false,
  },
  {
    name: 'Family',
    price: '$12',
    period: 'per month',
    description: 'Everything a growing family needs.',
    features: ['Up to 6 family members', 'AI meal planner', 'Smart grocery lists', 'Full nutrition dashboard', 'AI recommendations', 'Priority support'],
    cta: 'Start Free Trial',
    featured: true,
  },
  {
    name: 'Premium',
    price: '$24',
    period: 'per month',
    description: 'For health-focused families wanting the best.',
    features: ['Unlimited family members', 'Everything in Family', 'Advanced analytics', 'Nutritionist consultations', 'Custom diet programs', 'Dedicated support'],
    cta: 'Start Free Trial',
    featured: false,
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const targetPath = user ? '/dashboard' : '/signup';

  return (
    <section id="pricing" className="py-16 sm:py-24 bg-stone-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">Simple, honest pricing</h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">Start free, upgrade when your family grows.</p>
        </div>

        {/* ================= CAROUSEL VIEW (MOBILE ONLY) ================= */}
        {/* Added pb-16 to give the shadow room inside the overflow-x container, 
            and -mb-12 to neutralize the extra spacing for the next element below */}
        <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory gap-6 pb-16 pt-6 -mb-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {plans.map((plan) => (
            <div
              key={`${plan.name}-mobile`}
              className={`relative rounded-2xl p-6 flex flex-col flex-shrink-0 w-[85%] snap-center ${
                plan.featured
                  ? 'bg-emerald-600 text-white shadow-2xl shadow-emerald-600/40 z-10'
                  : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-amber-900 text-xs font-bold rounded-full uppercase tracking-wide whitespace-nowrap">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className={`text-lg font-bold mb-1 ${plan.featured ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{plan.name}</h3>
                <p className={`text-sm mb-4 ${plan.featured ? 'text-emerald-100' : 'text-gray-500 dark:text-gray-400'}`}>{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-black ${plan.featured ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{plan.price}</span>
                  <span className={`text-sm ${plan.featured ? 'text-emerald-100' : 'text-gray-500 dark:text-gray-400'}`}>/{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check size={16} className={`mt-0.5 flex-shrink-0 ${plan.featured ? 'text-emerald-200' : 'text-emerald-500'}`} />
                    <span className={`text-sm ${plan.featured ? 'text-emerald-50' : 'text-gray-600 dark:text-gray-400'}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={targetPath}
                className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all w-full ${
                  plan.featured
                    ? 'bg-white text-emerald-700 hover:bg-emerald-50'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* ================= GRID VIEW (DESKTOP / TABLET) ================= */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch lg:pt-6">
          {plans.map((plan) => (
            <div
              key={`${plan.name}-desktop`}
              className={`relative rounded-2xl p-6 sm:p-8 flex flex-col w-full ${
                plan.featured
                  ? 'bg-emerald-600 text-white shadow-2xl shadow-emerald-600/30 lg:scale-105 z-10'
                  : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-amber-900 text-xs font-bold rounded-full uppercase tracking-wide">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className={`text-lg font-bold mb-1 ${plan.featured ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{plan.name}</h3>
                <p className={`text-sm mb-4 ${plan.featured ? 'text-emerald-100' : 'text-gray-500 dark:text-gray-400'}`}>{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-black ${plan.featured ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{plan.price}</span>
                  <span className={`text-sm ${plan.featured ? 'text-emerald-100' : 'text-gray-500 dark:text-gray-400'}`}>/{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check size={16} className={`mt-0.5 flex-shrink-0 ${plan.featured ? 'text-emerald-200' : 'text-emerald-500'}`} />
                    <span className={`text-sm ${plan.featured ? 'text-emerald-50' : 'text-gray-600 dark:text-gray-400'}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={targetPath}
                className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all w-full ${
                  plan.featured
                    ? 'bg-white text-emerald-700 hover:bg-emerald-50'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}