import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../assets/Logo.png';

export default function Navbar() {
  const { darkMode, toggleDarkMode } = useApp();
  const { user, isDemoMode } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src={Logo} alt="NutriNest AI" className="h-9 w-9 rounded-lg object-cover" />
            <span className="font-bold text-lg text-gray-900 dark:text-white">NutriNest AI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {['Features', 'How It Works', 'Pricing', 'FAQ'].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            {/* Desktop Auth Buttons */}
            {user && !isDemoMode ? (
              <>
                <span className="hidden lg:inline-flex text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user.user_metadata?.full_name?.split(' ')[0] || user.email}
                </span>
                <Link
                  to="/dashboard"
                  className="hidden lg:inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden lg:inline-flex text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="hidden lg:inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  Start Free
                </Link>
              </>
            )}

            {/* Mobile/Tablet Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Dropdown Drawer */}
      {menuOpen && (
        <div className="lg:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-4 space-y-3 shadow-xl">
          {['Features', 'How It Works', 'Pricing', 'FAQ'].map(item => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setMenuOpen(false)}
              className="block px-2 py-1 text-base text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              {item}
            </a>
          ))}
          {/* CHANGED: Swapped flex-col for a 2-column grid layout to ensure buttons sit side by side on all mobile viewports */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            {user && !isDemoMode ? (
              <Link 
                to="/dashboard" 
                onClick={() => setMenuOpen(false)}
                className="col-span-2 w-full text-center py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  to="/login" 
                  onClick={() => setMenuOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
                >
                  Sign In
                </Link>
                <Link 
                  to="/signup" 
                  onClick={() => setMenuOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg"
                >
                  Start Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}