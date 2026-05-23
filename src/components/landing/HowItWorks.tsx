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
    <section id="how-it-works" className="py-16 sm:py-24 bg-stone-50 dark:bg-gray-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">How It Works</p>
          <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">Up and running in minutes</h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            No complex setup. No nutritionist degree required. Just smart, family-first meal planning.
          </p>
        </div>

        <div className="relative">
          {/* DESKTOP CONNECTING LINE (Completely Unchanged) */}
          <div className="hidden lg:block absolute top-10 left-[calc(12.5%+2rem)] right-[calc(12.5%+2rem)] h-px bg-gradient-to-r from-transparent via-emerald-200 dark:via-emerald-800 to-transparent" />

          {/* Steps Container */}
          <div className="flex sm:grid overflow-x-auto sm:overflow-x-visible snap-x snap-mandatory sm:snap-none sm:grid-cols-2 lg:grid-cols-4 gap-8 relative pb-6 sm:pb-0 px-[calc(50%-140px)] sm:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {steps.map((step, i) => (
              <div 
                key={i} 
                className="relative text-center flex flex-col items-center shrink-0 w-[280px] sm:w-auto snap-center"
              >
                <div className="relative inline-flex items-center justify-center w-16 h-16 mb-6 z-10">
                  <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl" />
                  <span className="relative text-2xl font-black text-emerald-600 dark:text-emerald-400">{step.number}</span>

                  {/* MOBILE ONLY CONNECTING LINE */}
                  {i === 1 && (
                    <div 
                      className="sm:hidden absolute top-1/2 h-px bg-gradient-to-r from-transparent via-emerald-200 dark:via-emerald-800 to-transparent pointer-events-none -translate-y-1/2" 
                      style={{
                        left: 'calc(-250% - 140px - 1rem)', 
                        width: 'calc(280px + 32px + 700px)', 
                        zIndex: -1
                      }}
                    />
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 px-2">{step.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}