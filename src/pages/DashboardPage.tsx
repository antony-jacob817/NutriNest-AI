import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import Overview from './dashboard/Overview';
import MealPlanner from './dashboard/MealPlanner';
import GroceryList from './dashboard/GroceryList';
import Nutrition from './dashboard/Nutrition';
import Family from './dashboard/Family';
import AIInsights from './dashboard/AIInsights';
import Settings from './dashboard/Settings';
import Logo from '../assets/Logo.png';

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-stone-50 dark:bg-gray-950 overflow-hidden w-full relative">
      {/* Sidebar state passing */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex flex-col flex-1 h-full overflow-hidden relative">
        {/* FIX: Lowered z-index to z-20 so it can never pull itself over the modal track backdrop overlay */}
        <header className="lg:hidden h-16 flex items-center justify-between px-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 w-full z-20 flex-shrink-0 fixed top-0 left-0 right-0">
          {/* Menu button on the left */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Open sidebar menu"
          >
            <Menu size={20} />
          </button>

          {/* Logo and App Name on the right */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-gray-900 dark:text-white">NutriNest AI</span>
            <img src={Logo} alt="NutriNest AI" className="h-8 w-8 rounded-lg object-cover" />
          </div>
        </header>

        {/* Content Viewframe Section */}
        <main className="flex-1 overflow-y-auto w-full pt-16 lg:pt-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-8">
            <Routes>
              <Route index element={<Overview />} />
              <Route path="meals" element={<MealPlanner />} />
              <Route path="grocery" element={<GroceryList />} />
              <Route path="nutrition" element={<Nutrition />} />
              <Route path="family" element={<Family />} />
              <Route path="insights" element={<AIInsights />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}