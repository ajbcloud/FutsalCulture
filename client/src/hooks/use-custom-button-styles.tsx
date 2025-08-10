import { useCustomTheme } from '@/contexts/CustomThemeContext';

export function useCustomButtonStyles() {
  const { theme } = useCustomTheme();

  const getButtonStyle = (variant: 'primary' | 'secondary' = 'primary') => {
    if (!theme) return {};

    if (variant === 'primary') {
      return {
        backgroundColor: theme.primaryButton,
        borderColor: theme.primaryButton,
        color: '#ffffff' // Always white text for buttons
      };
    } else {
      return {
        backgroundColor: theme.secondaryButton,
        borderColor: theme.secondaryButton,
        color: '#ffffff' // Always white text for buttons
      };
    }
  };

  const getButtonClassName = (variant: 'primary' | 'secondary' = 'primary', existingClasses = '') => {
    // Remove existing color classes and add custom style class
    const cleanedClasses = existingClasses
      .replace(/bg-\w+-\d+/g, '')
      .replace(/border-\w+-\d+/g, '')
      .replace(/text-\w+-\d+/g, '')
      .trim();

    return `${cleanedClasses} custom-themed-button custom-themed-button-${variant}`.trim();
  };

  return {
    theme,
    getButtonStyle,
    getButtonClassName
  };
}