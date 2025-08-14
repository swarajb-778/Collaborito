import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

export interface ToastProps {
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info' }) => {
  const bg = {
    info: '#2D6CDF',
    warning: '#FFB020',
    error: '#D14343',
    success: '#22A06B',
  }[type];

  return (
    <Animated.View entering={FadeInUp} exiting={FadeOutUp} style={[styles.container, { backgroundColor: bg }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default Toast;


