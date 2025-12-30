import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();

  const handleClick = () => {
    console.log('🔄 Toggle dark mode - État actuel:', isDarkMode);
    toggleTheme();
    // Debug: vérifier après un court délai
    setTimeout(() => {
      const hasDark = document.documentElement.classList.contains('dark');
      console.log('📊 Classe "dark" sur <html>:', hasDark);
      console.log('📊 État isDarkMode:', !isDarkMode);
    }, 100);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className="gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      title={isDarkMode ? "Mode clair" : "Mode sombre"}
      aria-label={isDarkMode ? "Passer en mode clair" : "Passer en mode sombre"}
    >
      {isDarkMode ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      )}
    </Button>
  );
}



