interface Props {
  label: string;
  value: string | number;
  unit: string;
  progress: number;
  color: string;
  icon: React.ReactNode;
}

export default function NutritionCard({ label, value, unit, progress, color, icon }: Props) {
  return (
    // Fluid mobile-first padding (p-4 on mobile screens up to p-5 on desktop environments)
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-0.5 sm:gap-1 mb-2 sm:mb-3">
        {/* Scaled text from text-2xl down to text-xl dynamically on small viewports to prevent wrapping */}
        <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{value}</span>
        <span className="text-xs sm:text-sm text-gray-400">{unit}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%`, background: color.includes('emerald') ? '#10b981' : color.includes('blue') ? '#3b82f6' : color.includes('amber') ? '#f59e0b' : color.includes('cyan') ? '#06b6d4' : '#ef4444' }}
        />
      </div>
      <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-1.5">{progress}% of daily goal</p>
    </div>
  );
}