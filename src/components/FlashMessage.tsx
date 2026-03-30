import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '@/config';

type FlashType = 'success' | 'error' | 'info';

interface FlashMessageProps {
  message: string;
  type?: FlashType;
  /** Auto-dismiss after ms (0 = never) */
  duration?: number;
  onDismiss?: () => void;
}

const CONFIG: Record<FlashType, { bg: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  success: { bg: COLORS.primaryLight, icon: 'checkmark-circle' },
  error:   { bg: COLORS.errorLight,   icon: 'alert-circle' },
  info:    { bg: '#dbeafe',            icon: 'information-circle' },
};

const ICON_COLOR: Record<FlashType, string> = {
  success: COLORS.primary,
  error:   COLORS.error,
  info:    '#3b82f6',
};

export function FlashMessage({
  message,
  type = 'info',
  duration = 3500,
  onDismiss,
}: FlashMessageProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();

    if (duration > 0) {
      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => onDismiss?.());
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss, opacity]);

  const { bg, icon } = CONFIG[type];

  return (
    <Animated.View style={[styles.container, { backgroundColor: bg, opacity }]}>
      <Ionicons name={icon} size={20} color={ICON_COLOR[type]} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: 10,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  text: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.text,
  },
});
