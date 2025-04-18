/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

export const Colors = {
  light: {
    // Core UI colors
    text: '#1A1A1A',
    background: '#FFFFFF',
    card: '#F9FAFB',
    border: '#E5E7EB',
    muted: '#71717A',
    highlight: '#F9FAFB',
    lightGray: '#F3F4F6',
    
    // Brand colors - primary palette
    primary: '#FFD029',       // Vibrant yellow (brand color)
    primaryDark: '#E5BB00',   // Darker yellow
    primaryLight: '#FFE373',  // Lighter yellow
    primaryBg: '#FFFBE5',     // Ultra light yellow background
    
    // Secondary colors
    secondary: '#4361EE',     // Vibrant blue
    secondaryDark: '#3A4FD8',
    secondaryLight: '#6D8AFF',
    
    // Accent colors
    accent: '#111111',        // Near black for high contrast elements
    
    // Status colors
    success: '#22C55E',       // Green
    warning: '#F59E0B',       // Amber
    error: '#EF4444',         // Red
    info: '#3B82F6',          // Blue
    
    // Navigation and tab colors
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#FFD029',
    tint: '#FFD029',
    notification: '#EF4444',
  },
  
  dark: {
    // Core UI colors
    text: '#F9FAFB',
    background: '#121212',    // Darker background
    card: '#1E1E1E',          // Dark card background
    border: '#2E2E2E',
    muted: '#9CA3AF',
    highlight: '#252525',
    lightGray: '#272727',
    
    // Brand colors - primary palette
    primary: '#FFD029',       // Keep primary yellow even in dark mode
    primaryDark: '#E5BB00',
    primaryLight: '#FFE373',
    primaryBg: '#292517',     // Dark yellow tinted background
    
    // Secondary colors
    secondary: '#5D7DF5',     // Slightly lighter blue for dark mode
    secondaryDark: '#4361EE',
    secondaryLight: '#8AA2FF',
    
    // Accent colors
    accent: '#FFFFFF',        // White for high contrast elements
    
    // Status colors
    success: '#34D399',       // Lighter green for dark mode
    warning: '#FBBF24',       // Lighter amber
    error: '#F87171',         // Lighter red
    info: '#60A5FA',          // Lighter blue
    
    // Navigation and tab colors
    tabIconDefault: '#6B7280',
    tabIconSelected: '#FFD029',
    tint: '#FFD029',
    notification: '#EF4444',
  },
};

// Shared gradient definitions
export const Gradients = {
  primary: ['#FFD029', '#FFB800'],
  secondary: ['#4361EE', '#3A4FD8'],
  card: ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.5)'],
  success: ['#22C55E', '#16A34A'],
  warning: ['#F59E0B', '#D97706'],
  error: ['#EF4444', '#DC2626'],
  dark: ['#1A1A1A', '#111111'],
  yellow: ['#FFDF5A', '#FFD029'],
  blueYellow: ['#4361EE', '#FFD029'],
  welcome: ['rgba(255,214,99,0.25)', 'rgba(244,141,59,0.15)'],
};
