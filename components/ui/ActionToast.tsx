import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

export interface ActionToastProps {
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
  autoDismissMs?: number;
}

export const ActionToast: React.FC<ActionToastProps> = ({
  message,
  type = 'info',
  actionLabel,
  onAction,
  onClose,
  autoDismissMs = 4000,
}) => {
  useEffect(() => {
    if (!autoDismissMs) return;
    const t = setTimeout(() => onClose?.(), autoDismissMs);
    return () => clearTimeout(t);
  }, [autoDismissMs, onClose]);

  const bg = {
    info: '#2D6CDF',
    warning: '#FFB020',
    error: '#D14343',
    success: '#22A06B',
  }[type];

  return (
    <Animated.View entering={FadeInUp} exiting={FadeOutUp} style={[styles.container, { backgroundColor: bg }]}>
      <Text style={styles.text}>{message}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} style={styles.actionBtn}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
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
    flexDirection: 'row',
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    flex: 1,
  },
  actionBtn: {
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.15)'
  },
  actionText: {
    color: '#fff',
    fontWeight: '700'
  }
});

export default ActionToast;


