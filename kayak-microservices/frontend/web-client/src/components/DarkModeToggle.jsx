import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const DarkModeToggle = () => {
  try {
    const { isDarkMode, toggleTheme } = useTheme();

    return (
      <button
        onClick={toggleTheme}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        aria-label="Toggle dark mode"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {isDarkMode ? (
          <Sun className="w-5 h-5" style={{ color: '#fbbf24' }} />
        ) : (
          <Moon className="w-5 h-5" style={{ color: '#4b5563' }} />
        )}
      </button>
    );
  } catch (error) {
    console.error('DarkModeToggle error:', error);
    return (
      <button className="p-2 rounded-full bg-gray-200">
        <span style={{ fontSize: '20px' }}>🌙</span>
      </button>
    );
  }
};

export default DarkModeToggle;
