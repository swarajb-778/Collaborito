import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { createLogger } from '../utils/logger';

const logger = createLogger('ThemeContext');

// Theme configuration
export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'light' | 'dark';

// Color palette definitions
const LIGHT_COLORS = {
  // Primary colors
  primary: '#000000',
  primaryLight: '#333333',
  primaryDark: '#000000',
  
  // Secondary colors
  secondary: '#666666',
  secondaryLight: '#888888',
  secondaryDark: '#444444',
  
  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  backgroundTertiary: '#F0F0F0',
  
  // Surface colors
  surface: '#FFFFFF',
  surfaceSecondary: '#F5F5F5',
  surfaceTertiary: '#EEEEEE',
  
  // Text colors
  text: '#000000',
  textSecondary: '#666666',
  textTertiary: '#888888',
  textInverse: '#FFFFFF',
  
  // Border colors
  border: '#E0E0E0',
  borderSecondary: '#F0F0F0',
  borderActive: '#000000',
  
  // Status colors
  success: '#4CAF50',
  successLight: '#81C784',
  successDark: '#388E3C',
  
  warning: '#FF9800',
  warningLight: '#FFB74D',
  warningDark: '#F57C00',
  
  error: '#F44336',
  errorLight: '#E57373',
  errorDark: '#D32F2F',
  
  info: '#2196F3',
  infoLight: '#64B5F6',
  infoDark: '#1976D2',
  
  // Accent colors
  accent: '#FFD529',
  accentLight: '#FFE082',
  accentDark: '#FFC107',
  
  // Interactive colors
  link: '#1976D2',
  linkHover: '#1565C0',
  linkVisited: '#7B1FA2',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',
  
  // Shimmer colors (for skeleton loaders)
  shimmerColors: ['#f0f0f0', '#e8e8e8', '#f0f0f0'],
  
  // Shadow colors
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',
};

const DARK_COLORS = {
  // Primary colors
  primary: '#FFFFFF',
  primaryLight: '#FFFFFF',
  primaryDark: '#CCCCCC',
  
  // Secondary colors
  secondary: '#AAAAAA',
  secondaryLight: '#CCCCCC',
  secondaryDark: '#888888',
  
  // Background colors
  background: '#121212',
  backgroundSecondary: '#1E1E1E',
  backgroundTertiary: '#2A2A2A',
  
  // Surface colors
  surface: '#1E1E1E',
  surfaceSecondary: '#2A2A2A',
  surfaceTertiary: '#363636',
  
  // Text colors
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  textTertiary: '#888888',
  textInverse: '#000000',
  
  // Border colors
  border: '#333333',
  borderSecondary: '#2A2A2A',
  borderActive: '#FFFFFF',
  
  // Status colors
  success: '#66BB6A',
  successLight: '#81C784',
  successDark: '#4CAF50',
  
  warning: '#FFB74D',
  warningLight: '#FFCC02',
  warningDark: '#FF9800',
  
  error: '#EF5350',
  errorLight: '#E57373',
  errorDark: '#F44336',
  
  info: '#42A5F5',
  infoLight: '#64B5F6',
  infoDark: '#2196F3',
  
  // Accent colors
  accent: '#FFD529',
  accentLight: '#FFE082',
  accentDark: '#FFC107',
  
  // Interactive colors
  link: '#64B5F6',
  linkHover: '#42A5F5',
  linkVisited: '#CE93D8',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
  overlayDark: 'rgba(0, 0, 0, 0.9)',
  
  // Shimmer colors (for skeleton loaders)
  shimmerColors: ['#2a2a2a', '#3a3a3a', '#2a2a2a'],
  
  // Shadow colors
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowDark: 'rgba(0, 0, 0, 0.5)',
};

// Theme typography
const TYPOGRAPHY = {
  fonts: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    light: 'System',
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  lineHeights: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 36,
    xxxl: 44,
  },
  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

// Theme spacing
const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Theme border radius
const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
};

// Complete theme interface
export interface Theme {
  mode: ColorScheme;
  colors: typeof LIGHT_COLORS;
  typography: typeof TYPOGRAPHY;
  spacing: typeof SPACING;
  borderRadius: typeof BORDER_RADIUS;
  isDark: boolean;
}

// Create theme objects
const lightTheme: Theme = {
  mode: 'light',
  colors: LIGHT_COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  isDark: false,
};

const darkTheme: Theme = {
  mode: 'dark',
  colors: DARK_COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  isDark: true,
};

// Theme context interface
interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  colorScheme: ColorScheme;
  isSystemTheme: boolean;
  
  // Theme actions
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  setSystemTheme: () => Promise<void>;
  
  // Utility functions
  getColor: (colorKey: keyof typeof LIGHT_COLORS) => string;
  getTextColor: (background?: string) => string;
  isDarkMode: () => boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Storage key
const THEME_STORAGE_KEY = 'app_theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [systemColorScheme, setSystemColorScheme] = useState<ColorScheme>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
  );

  // Calculate current color scheme
  const colorScheme: ColorScheme = themeMode === 'system' ? systemColorScheme : themeMode;
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const isSystemTheme = themeMode === 'system';

  // Load saved theme mode
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setThemeModeState(savedMode as ThemeMode);
          logger.info(`📱 Loaded saved theme mode: ${savedMode}`);
        }
      } catch (error) {
        logger.error('❌ Error loading theme mode:', error);
      }
    };

    loadThemeMode();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
      const scheme = newColorScheme === 'dark' ? 'dark' : 'light';
      setSystemColorScheme(scheme);
      logger.info(`🌙 System color scheme changed to: ${scheme}`);
    });

    return () => subscription.remove();
  }, []);

  // Set theme mode with persistence
  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      
      // Haptic feedback for theme change
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      logger.info(`🎨 Theme mode changed to: ${mode}`);
    } catch (error) {
      logger.error('❌ Error setting theme mode:', error);
    }
  }, []);

  // Toggle between light and dark (skips system)
  const toggleTheme = useCallback(async () => {
    const newMode: ThemeMode = colorScheme === 'light' ? 'dark' : 'light';
    await setThemeMode(newMode);
  }, [colorScheme, setThemeMode]);

  // Set to system theme
  const setSystemTheme = useCallback(async () => {
    await setThemeMode('system');
  }, [setThemeMode]);

  // Utility function to get color by key
  const getColor = useCallback((colorKey: keyof typeof LIGHT_COLORS): string => {
    const color = theme.colors[colorKey];
    return Array.isArray(color) ? color[0] : color;
  }, [theme]);

  // Utility function to get appropriate text color for background
  const getTextColor = useCallback((background?: string): string => {
    if (!background) return theme.colors.text;
    
    // Simple heuristic: if background is dark, use light text
    const isDarkBackground = background.includes('#1') || background.includes('#2') || background.includes('#3');
    return isDarkBackground ? theme.colors.textInverse : theme.colors.text;
  }, [theme]);

  // Check if current theme is dark
  const isDarkMode = useCallback((): boolean => {
    return colorScheme === 'dark';
  }, [colorScheme]);

  const contextValue: ThemeContextType = {
    theme,
    themeMode,
    colorScheme,
    isSystemTheme,
    setThemeMode,
    toggleTheme,
    setSystemTheme,
    getColor,
    getTextColor,
    isDarkMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme context
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Utility hook for theme-aware styles
export function useThemedStyles<T>(
  createStyles: (theme: Theme) => T
): T {
  const { theme } = useTheme();
  return React.useMemo(() => createStyles(theme), [theme, createStyles]);
}

// HOC for theme-aware components
export function withTheme<P extends object>(
  Component: React.ComponentType<P & { theme: Theme }>
) {
  const ThemedComponent = React.forwardRef<any, P>((props, ref) => {
    const { theme } = useTheme();
    return <Component {...(props as P)} theme={theme} ref={ref} />;
  });
  
  ThemedComponent.displayName = `withTheme(${Component.displayName || Component.name})`;
  return ThemedComponent;
}

// Theme-aware color helper
export function useThemeColor(
  lightColor: string,
  darkColor: string
): string {
  const { colorScheme } = useTheme();
  return colorScheme === 'dark' ? darkColor : lightColor;
}

// Status bar style helper
export function useStatusBarStyle(): 'light-content' | 'dark-content' {
  const { colorScheme } = useTheme();
  return colorScheme === 'dark' ? 'light-content' : 'dark-content';
}

export default ThemeContext; 