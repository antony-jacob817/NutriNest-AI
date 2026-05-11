const steps = [
  {
    number: '01',
    title: 'Set Up Family Profiles',
    description: 'Add each family member with their age, dietary preferences, allergies, and health goals. Takes under 3 minutes.',
  },
  {
    number: '02',
    title: 'AI Generates Your Meal Plan',
    description: 'Our AI creates a full weekly meal plan tailored to every family member\'s needs, preferences, and nutritional requirements.',
  },
  {
    number: '03',
    title: 'Get Your Grocery List',
    description: 'A categorized, optimized grocery list is automatically built from your meal plan — ready to shop or order for delivery.',
  },
  {
    number: '04',
    title: 'Track & Optimize',
    description: 'Log meals and view real-time nutrition dashboards. The AI learns and improves your plan week over week.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-stone-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">How It Works</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">Up and running in minutes</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            No complex setup. No nutritionist degree required. Just smart, family-first meal planning.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          <div className="hidden lg:block absolute top-10 left-[calc(12.5%+2rem)] right-[calc(12.5%+2rem)] h-px bg-gradient-to-r from-transparent via-emerald-200 dark:via-emerald-800 to-transparent" />

          {steps.map((step, i) => (
            <div key={i} className="relative text-center">
              <div className="relative inline-flex items-center justify-center w-16 h-16 mb-6 mx-auto">
                <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl" />
                <span className="relative text-2xl font-black text-emerald-600 dark:text-emerald-400">{step.number}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
