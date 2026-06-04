import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from '../styles/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  solid?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, intensity = 60, solid = false }) => {
  if ((Platform.OS === 'ios' || Platform.OS === 'web') && !solid) {
    return (
      <BlurView 
        intensity={intensity} 
        style={[styles.card, styles.glassiOS, style]}
        tint="light"
      >
        {children}
      </BlurView>
    );
  }

  // Fallback to solid View (Android, or when solid=true)
  return (
    <View style={[styles.card, solid ? styles.solidCard : styles.androidFallback, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.cardPadding,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    overflow: 'hidden',
  },
  glassiOS: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  androidFallback: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    elevation: 3,
    shadowColor: '#131b2e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  solidCard: {
    backgroundColor: '#ffffff',
  },
});
