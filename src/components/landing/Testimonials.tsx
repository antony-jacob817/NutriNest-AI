import { testimonials } from '../../data/mockData';

export default function Testimonials() {
  return (
    <section className="py-16 sm:py-24 bg-white dark:bg-gray-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">Testimonials</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">Families love NutriNest AI</h2>
        </div>

        {/* Carousel Wrapper Row */}
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 sm:gap-8 pb-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="p-6 sm:p-8 rounded-2xl bg-stone-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex flex-col shrink-0 w-[300px] sm:w-[360px] snap-center"
            >
              <div className="flex text-amber-400 gap-0.5 mb-5 text-sm">
                {'★★★★★'}
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm flex-1 mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-300 text-sm flex-shrink-0">
                  {t.avatar}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">{t.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}