import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, SafeAreaView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { GlassCard } from '../components/GlassCard';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const slides = [
    {
      title: 'ELITE PERFORMANCE',
      subtitle: 'Track your fitness journey with high-performance real-time metrics.',
      icon: 'bolt' as keyof typeof MaterialIcons.glyphMap,
      color: theme.colors.primaryContainer,
      bgGrad: ['#006e2f', '#22c55e']
    },
    {
      title: 'KINETIC DASHBOARD',
      subtitle: 'Monitor active prize steps, calorie counts, and activity rings at a glance.',
      icon: 'track-changes' as keyof typeof MaterialIcons.glyphMap,
      color: theme.colors.secondaryContainer,
      bgGrad: ['#0058be', '#2170e4']
    },
    {
      title: 'ELITE COMPETITION',
      subtitle: 'Climb athlete standings, claim real prizes, and earn legendary badges.',
      icon: 'emoji-events' as keyof typeof MaterialIcons.glyphMap,
      color: theme.colors.tertiary,
      bgGrad: ['#7c0953', '#a43073']
    }
  ];

  const handleNext = () => {
    if (currentStep < slides.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const activeSlide = slides[currentStep];

  return (
    <View style={styles.container}>
      {/* Background Glow */}
      <View style={[styles.glowCircle, { backgroundColor: activeSlide.color }]} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.logoText}>PulseTrack</Text>
          <TouchableOpacity onPress={onComplete}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          <View style={[styles.iconWrapper, { borderColor: activeSlide.color }]}>
            <MaterialIcons name={activeSlide.icon} size={64} color={activeSlide.color} />
          </View>

          <GlassCard style={styles.glassContainer}>
            <Text style={[styles.slideTitle, { color: activeSlide.color }]}>{activeSlide.title}</Text>
            <Text style={styles.slideSubtitle}>{activeSlide.subtitle}</Text>
          </GlassCard>
        </View>

        <View style={styles.footer}>
          {/* Back Button */}
          {currentStep > 0 ? (
            <TouchableOpacity onPress={handlePrev} style={styles.navButton}>
              <MaterialIcons name="chevron-left" size={32} color={theme.colors.onSurface} />
            </TouchableOpacity>
          ) : (
            <View style={styles.navButtonSpacer} />
          )}

          {/* Dots Indicator */}
          <View style={styles.dotsContainer}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentStep === index ? [styles.activeDot, { backgroundColor: activeSlide.color }] : styles.inactiveDot
                ]}
              />
            ))}
          </View>

          {/* Next/Finish Button */}
          <TouchableOpacity 
            onPress={handleNext} 
            style={[styles.nextBtn, { backgroundColor: activeSlide.color }]}
          >
            <MaterialIcons 
              name={currentStep === slides.length - 1 ? 'check' : 'chevron-right'} 
              size={24} 
              color={theme.colors.onPrimary} 
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8ff',
    overflow: 'hidden',
  },
  glowCircle: {
    position: 'absolute',
    top: -150,
    right: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.1,
    // Add blur filter for Web, ignored by native
    ...Platform.select({
      web: {
        filter: 'blur(80px)',
      }
    })
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.mobileMargin,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    height: 60,
  },
  logoText: {
    fontSize: 22,
    fontFamily: theme.fonts.hanken.bold,
    color: theme.colors.primary,
  },
  skipText: {
    fontSize: 14,
    fontFamily: theme.fonts.manrope.medium,
    color: theme.colors.onSurfaceVariant,
    opacity: 0.7,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    backgroundColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#131b2e',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  glassContainer: {
    width: '100%',
    alignItems: 'center',
    textAlign: 'center',
  },
  slideTitle: {
    fontSize: 26,
    fontFamily: theme.fonts.hanken.bold,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    fontSize: 16,
    fontFamily: theme.fonts.manrope.regular,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 24,
    height: 80,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonSpacer: {
    width: 50,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: '#dae2fd',
  },
  nextBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  }
});
