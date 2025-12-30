import { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export function DarkModeTest() {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    // Test: vérifier si la classe dark est bien appliquée
    const hasDark = document.documentElement.classList.contains('dark');
    console.log('🔍 Test Dark Mode:', {
      isDarkMode,
      hasDarkClass: hasDark,
      htmlClasses: Array.from(document.documentElement.classList),
      bodyClasses: Array.from(document.body.classList),
    });

    // Test: vérifier si les styles dark: sont appliqués
    const testElement = document.createElement('div');
    testElement.className = 'bg-white dark:bg-gray-900';
    document.body.appendChild(testElement);
    const computed = window.getComputedStyle(testElement);
    const bgColor = computed.backgroundColor;
    console.log('🎨 Test Style:', {
      className: 'bg-white dark:bg-gray-900',
      backgroundColor: bgColor,
      isDark: bgColor.includes('rgb(17, 24, 39)') || bgColor.includes('rgb(3, 7, 18)'),
    });
    document.body.removeChild(testElement);
  }, [isDarkMode]);

  return null;
}



