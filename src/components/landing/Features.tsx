import { Brain, ShoppingCart, BarChart2, Users, Zap, Leaf } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI Meal Planner',
    description: 'Generate personalized weekly meal plans adapted to allergies, dietary preferences, age, and fitness goals for every family member.',
    color: 'emerald',
  },
  {
    icon: ShoppingCart,
    title: 'Smart Grocery Lists',
    description: 'Automatically generate organized grocery lists from your meal plans, grouped by category and ready for delivery.',
    color: 'blue',
  },
  {
    icon: BarChart2,
    title: 'Nutrition Dashboard',
    description: 'Track calories, protein, sugar, hydration, and nutrients. See weekly health insights and personalized recommendations.',
    color: 'amber',
  },
  {
    icon: Users,
    title: 'Family Profiles',
    description: 'Separate profiles for each family member with individual allergies, conditions, dietary preferences, and wellness goals.',
    color: 'rose',
  },
  {
    icon: Zap,
    title: 'AI Recommendations',
    description: 'Get smarter swaps, reduce food waste, and discover quick 15-minute meals on busy weeknights — all AI-powered.',
    color: 'violet',
  },
  {
    icon: Leaf,
    title: 'Health Insights',
    description: 'Weekly summaries showing how your family is tracking against nutritional goals with actionable improvement tips.',
    color: 'teal',
  },
];

const colorMap: Record<string, string> = {
  emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
  violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
  teal: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
};

export default function Features() {
  return (
    <section id="features" className="py-24 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">Features</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">Everything your family needs</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            One platform to plan, track, and optimize your family's nutrition — powered by AI.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f) => (
            <div
              key={f.title}
              className="group p-8 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-gray-900"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${colorMap[f.color]}`}>
                <f.icon size={22} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{f.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
