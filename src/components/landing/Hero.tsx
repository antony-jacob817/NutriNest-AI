import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import HeroImage from '../../assets/Hero_image.png';
import { useAuth } from '../../context/AuthContext';

export default function Hero() {
  const { user } = useAuth();
  const targetPath = user ? '/dashboard' : '/signup';

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-stone-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pt-16">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-100 dark:bg-emerald-900/20 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amber-100 dark:bg-amber-900/10 rounded-full blur-3xl opacity-40" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left copy */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-full">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">AI-Powered Nutrition</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white leading-[1.05] tracking-tight">
              Family nutrition,{' '}
              <span className="relative">
                <span className="relative z-10 text-emerald-600 dark:text-emerald-400">planned</span>
                <span className="absolute bottom-1 left-0 right-0 h-3 bg-emerald-100 dark:bg-emerald-900/40 -z-0 rounded" />
              </span>{' '}
              in minutes.
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg">
              NutriNest AI generates personalized weekly meal plans, smart grocery lists, and real-time nutrition tracking — built for busy families.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                to={targetPath}
                className="group inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:-translate-y-0.5"
              >
                Start Free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/dashboard"
                className="group inline-flex items-center gap-2 px-6 py-3.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="w-7 h-7 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center">
                  <Play size={12} className="text-emerald-600 dark:text-emerald-400 fill-current ml-0.5" />
                </div>
                View Demo
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-6 pt-2">
              <div className="flex -space-x-2">
                {['E', 'M', 'K', 'T'].map((l, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-300"
                  >
                    {l}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex text-amber-400 text-xs gap-0.5">{'★★★★★'}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Loved by <strong className="text-gray-700 dark:text-gray-300">2,400+</strong> families</p>
              </div>
            </div>
          </div>

          {/* Right — hero image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800">
              <img
                src={HeroImage}
                alt="NutriNest AI Dashboard"
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Floating cards */}
            <div className="absolute -left-6 top-1/4 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 px-4 py-3 hidden lg:block animate-float">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Today's Calories</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">1,840</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">↓ 200 under goal</div>
            </div>

            <div className="absolute -right-6 bottom-1/4 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 px-4 py-3 hidden lg:block animate-float-delay">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Grocery List</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">24 items</div>
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Auto-generated</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
