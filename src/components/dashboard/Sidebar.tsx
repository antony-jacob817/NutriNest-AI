import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, ShoppingCart, BarChart2, Users, Zap, Settings, LogOut, Moon, Sun, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth';
import Logo from '../../assets/Logo.png';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
  { icon: Calendar, label: 'Meal Planner', path: '/dashboard/meals' },
  { icon: ShoppingCart, label: 'Grocery List', path: '/dashboard/grocery' },
  { icon: BarChart2, label: 'Nutrition', path: '/dashboard/nutrition' },
  { icon: Users, label: 'Family', path: '/dashboard/family' },
  { icon: Zap, label: 'AI Insights', path: '/dashboard/insights' },
];

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useApp();
  const { user } = useAuth();

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Dimmed Background Overlay for Mobile/Tablet */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Sidebar Panel Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 h-full z-50
        flex flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800
        transition-transform duration-300 ease-in-out
        w-64 lg:sticky lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <Link to="/" onClick={handleLinkClick} className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
            <img src={Logo} alt="NutriNest AI" className="h-8 w-8 rounded-lg object-cover flex-shrink-0" />
            <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">NutriNest AI</span>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Dynamic Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  active
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Configuration Items */}
        <div className="border-t border-gray-100 dark:border-gray-800 p-3 space-y-1">
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {darkMode ? <Sun size={18} className="flex-shrink-0" /> : <Moon size={18} className="flex-shrink-0" />}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          
          <Link
            to="/dashboard/settings"
            onClick={handleLinkClick}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Settings size={18} className="flex-shrink-0" />
            <span>Settings</span>
          </Link>

          {user ? (
            <button
              onClick={async () => {
                await authService.signOut();
                handleLinkClick();
                navigate('/');
              }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <LogOut size={18} className="flex-shrink-0" />
              <span>Sign Out</span>
            </button>
          ) : (
            <>
              <Link
                to="/login"
                onClick={handleLinkClick}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <LogOut size={18} className="flex-shrink-0" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/signup"
                onClick={handleLinkClick}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
              >
                <Zap size={18} className="flex-shrink-0" />
                <span>Start Free</span>
              </Link>
            </>
          )}

          {user && (
            <div className="mt-2 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3 px-1">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-300 flex-shrink-0">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-900 dark:text-white truncate">{user.email?.split('@')[0]}</div>
                <div className="text-xs text-gray-400 truncate">{user.email}</div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}