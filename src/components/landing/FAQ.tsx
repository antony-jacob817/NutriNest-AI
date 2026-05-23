import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'How does the AI meal planner work?',
    a: 'Our AI analyzes each family member\'s dietary preferences, allergies, health goals, and nutritional requirements to generate a balanced weekly meal plan. It learns from your feedback and improves over time.',
  },
  {
    q: 'Can I manage different dietary restrictions for each family member?',
    a: 'Absolutely. Each family member gets their own profile where you can set allergies, intolerances, dietary preferences (vegan, keto, gluten-free, etc.), and health goals. The meal plan adapts to accommodate everyone.',
  },
  {
    q: 'How are grocery lists generated?',
    a: 'Grocery lists are automatically built from your weekly meal plan. Items are grouped by category (produce, proteins, grains, etc.) and quantities are calculated for your family size to reduce waste.',
  },
  {
    q: 'Is my family\'s health data secure?',
    a: 'Yes. All data is encrypted in transit and at rest. We never sell your data to third parties. You can export or delete your data at any time from your account settings.',
  },
  {
    q: 'Can I try NutriNest AI for free?',
    a: 'Yes! Our Free plan is available forever with no credit card required. You can upgrade to Family or Premium at any time to unlock more features.',
  },
  {
    q: 'Does it integrate with grocery delivery services?',
    a: 'Grocery delivery integration is on our roadmap. Currently you can export your grocery list and use it with any delivery service of your choice.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-16 sm:py-24 bg-white dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">FAQ</p>
          <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">Common questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-4 sm:px-6 py-5 text-left hover:bg-stone-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="font-semibold text-gray-900 dark:text-white text-sm pr-4 leading-snug">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
                />
              </button>
              {open === i && (
                <div className="px-4 sm:px-6 pb-5">
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}