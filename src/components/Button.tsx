import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '@/config';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        container.base,
        container[variant],
        container[`size_${size}`],
        isDisabled && container.disabled,
        style,
      ]}
      activeOpacity={0.75}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? '#fff' : COLORS.primary}
          size="small"
        />
      ) : (
        <Text style={[label.base, label[`color_${variant}`], label[`size_${size}`]]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const container = StyleSheet.create<Record<string, ViewStyle>>({
  base: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: { backgroundColor: COLORS.primary },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.primary },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: COLORS.error },
  disabled: { opacity: 0.5 },
  size_sm: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md, minHeight: 34 },
  size_md: { paddingVertical: 12, paddingHorizontal: SPACING.lg, minHeight: 44 },
  size_lg: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, minHeight: 52 },
});

const label = StyleSheet.create<Record<string, TextStyle>>({
  base: { fontWeight: TYPOGRAPHY.fontWeights.semibold },
  color_primary: { color: '#fff' },
  color_outline: { color: COLORS.primary },
  color_ghost: { color: COLORS.primary },
  color_danger: { color: '#fff' },
  size_sm: { fontSize: TYPOGRAPHY.fontSizes.sm },
  size_md: { fontSize: TYPOGRAPHY.fontSizes.base },
  size_lg: { fontSize: TYPOGRAPHY.fontSizes.lg },
});
