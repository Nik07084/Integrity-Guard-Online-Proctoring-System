import React, { useState, useEffect } from 'react';
import { Shield, Menu, X, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'admin';

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  // Apply dark mode on component mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className={`border-b ${
      isDarkMode 
        ? 'bg-gray-900 border-gray-800 text-gray-100' 
        : 'bg-white border-gray-200 text-gray-900'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link 
            to="/" 
            className="flex items-center space-x-2 group"
          >
            <Shield className={`w-8 h-8 ${
              isDarkMode 
                ? 'text-indigo-500 group-hover:text-indigo-400' 
                : 'text-blue-600 group-hover:text-blue-500'
            }`} />
            <span className={`text-xl font-bold ${
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>
              IntegrityGuard
            </span>
            {isAdmin && (
              <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                isDarkMode 
                  ? 'bg-red-900/50 text-red-400' 
                  : 'bg-red-100 text-red-600'
              }`}>
                Admin
              </span>
            )}
          </Link>
          
          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <motion.button 
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${isDarkMode 
                ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>

            <nav className="hidden md:flex items-center space-x-8">
              {!isAdmin && (
                <Link 
                  to="/dashboard" 
                  className={`transition-colors duration-300 ${
                    isDarkMode 
                      ? 'text-gray-300 hover:text-indigo-400' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Dashboard
                </Link>
              )}
              <Link 
                to={isAdmin ? "/admin/assessments" : "/assessments"} 
                className={`transition-colors duration-300 ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-indigo-400' 
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Assessments
              </Link>
              <Link 
                to="/reports" 
                className={`transition-colors duration-300 ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-indigo-400' 
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Reports
              </Link>
            </nav>
          </div>

          <button
            className={`md:hidden p-2 rounded-lg transition-transform duration-200 ${
              isDarkMode 
                ? 'hover:bg-gray-700 text-gray-300' 
                : 'hover:bg-gray-100 text-gray-600'
            } ${isMenuOpen ? 'rotate-180' : ''}`}
            onClick={toggleMenu}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`md:hidden ${
              isDarkMode 
                ? 'bg-gray-800 text-gray-100' 
                : 'bg-gray-50 text-gray-900'
            }`}
          >
            <div className="py-2 px-4">
              {!isAdmin && (
                <Link 
                  to="/dashboard" 
                  className={`block py-2 transition-colors duration-300 ${
                    isDarkMode 
                      ? 'text-gray-300 hover:text-indigo-400' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                  onClick={toggleMenu}
                >
                  Dashboard
                </Link>
              )}
              <Link 
                to={isAdmin ? "/admin/assessments" : "/assessments"} 
                className={`block py-2 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-indigo-400' 
                    : 'text-gray-600 hover:text-blue-600'
                }`}
                onClick={toggleMenu}
              >
                Assessments
              </Link>
              <Link 
                to="/reports" 
                className={`block py-2 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-indigo-400' 
                    : 'text-gray-600 hover:text-blue-600'
                }`}
                onClick={toggleMenu}
              >
                Reports
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}