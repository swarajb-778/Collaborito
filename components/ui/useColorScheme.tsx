import { useColorScheme as useNativeColorScheme } from 'react-native';
import { useMemo } from 'react';

export interface ColorScheme {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;
  muted: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

export function useColorScheme(): { 
  colorScheme: 'light' | 'dark'; 
  isDark: boolean;
  colors: ColorScheme;
  toggleColorScheme?: () => void;
} {
  const colorScheme = useNativeColorScheme() || 'light';
  const isDark = colorScheme === 'dark';

  const colors = useMemo(() => {
    if (isDark) {
      return {
        primary: '#0071e3',
        secondary: '#5E5CE6',
        background: '#000000',
        card: '#1C1C1E',
        text: '#FFFFFF',
        border: '#38383A',
        notification: '#FF453A',
        muted: '#8E8E93',
        error: '#FF453A',
        success: '#32D74B',
        warning: '#FFD60A',
        info: '#64D2FF',
      };
    }
    return {
      primary: '#0071e3',
      secondary: '#5E5CE6',
      background: '#FFFFFF',
      card: '#F2F2F7',
      text: '#000000',
      border: '#DCDCDC',
      notification: '#FF3B30',
      muted: '#8E8E93',
      error: '#FF3B30',
      success: '#34C759',
      warning: '#FFCC00',
      info: '#5AC8FA',
    };
  }, [isDark]);

  return {
    colorScheme,
    isDark,
    colors,
  };
} 