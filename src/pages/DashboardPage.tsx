import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import Overview from './dashboard/Overview';
import MealPlanner from './dashboard/MealPlanner';
import GroceryList from './dashboard/GroceryList';
import Nutrition from './dashboard/Nutrition';
import Family from './dashboard/Family';
import AIInsights from './dashboard/AIInsights';
import Settings from './dashboard/Settings';

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-stone-50 dark:bg-gray-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pl-16 lg:pl-0">
        <div className="max-w-6xl mx-auto px-6 py-8">
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
  );
}
