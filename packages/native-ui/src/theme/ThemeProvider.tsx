import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { 
  colors, 
  spacing, 
  borderRadius, 
  typography, 
  shadows, 
  type ColorScheme,
  type ColorPalette 
} from '@repo/design-tokens/native';

type ThemeContextType = {
  colorScheme: ColorScheme;
  colors: ColorPalette;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  typography: typeof typography;
  shadows: typeof shadows;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const colorScheme: ColorScheme = systemColorScheme === 'dark' ? 'dark' : 'light';

  const theme: ThemeContextType = {
    colorScheme,
    colors: colors[colorScheme],
    spacing,
    borderRadius,
    typography,
    shadows,
  };

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useColorScheme() {
  const { colorScheme } = useTheme();
  return colorScheme;
}
