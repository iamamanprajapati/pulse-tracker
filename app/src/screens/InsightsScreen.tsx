import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform, Dimensions, Animated, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { GlassCard } from '../components/GlassCard';
import { ProgressRing } from '../components/ProgressRing';

interface InsightsScreenProps {
  onBack: () => void;
}

type TabType = 'day' | 'week' | 'month' | 'year';

interface ChartData {
  total: string;
  avg: string;
  values: number[];
  labels: string[];
  pbIndex: number;
}

interface AnimatedBarProps {
  val: number;
  maxVal: number;
  idx: number;
  pbIndex: number;
  selectedBar: number | null;
  setSelectedBar: (idx: number | null) => void;
  activeTab: TabType;
}

const AnimatedBar: React.FC<AnimatedBarProps> = ({
  val,
  maxVal,
  idx,
  pbIndex,
  selectedBar,
  setSelectedBar,
  activeTab,
}) => {
  // Keep max height at 75% to leave room for the PB / value badges
  const targetHeightPercent = maxVal > 0 ? (val / maxVal) * 75 : 0;
  const isPB = idx === pbIndex;
  const isSelected = selectedBar === idx;

  const animatedHeight = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const delay = Math.min(idx * 20, 300);
    animatedHeight.setValue(0);
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(animatedHeight, {
        toValue: targetHeightPercent,
        duration: 500,
        easing: Easing.out(Easing.back(0.8)),
        useNativeDriver: false,
      }),
    ]).start();
  }, [targetHeightPercent, activeTab]);

  const heightStyle = animatedHeight.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <TouchableOpacity
      style={styles.barColumn}
      onPress={() => setSelectedBar(selectedBar === idx ? null : idx)}
      activeOpacity={0.9}
    >
      {/* PB Callout */}
      {isPB && !isSelected && (
        <Animated.View style={[styles.pbBadge, { bottom: heightStyle }]}>
          <Text style={styles.pbBadgeText}>BEST</Text>
        </Animated.View>
      )}

      {/* Value Tooltip when clicked */}
      {isSelected && (
        <Animated.View style={[styles.tooltipBadge, { bottom: heightStyle }]}>
          <Text style={styles.tooltipText}>{val.toLocaleString()}</Text>
        </Animated.View>
      )}

      {/* Interactive Bar */}
      <Animated.View
        style={[
          styles.bar,
          { height: heightStyle },
          isPB && styles.pbBar,
          isSelected && styles.selectedBar
        ]}
      />
    </TouchableOpacity>
  );
};

interface AnimatedMiniBarProps {
  targetHeight: string;
  delay: number;
  backgroundColor?: string;
}

const AnimatedMiniBar: React.FC<AnimatedMiniBarProps> = ({
  targetHeight,
  delay,
  backgroundColor,
}) => {
  const animatedHeight = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    animatedHeight.setValue(0);
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(animatedHeight, {
        toValue: parseFloat(targetHeight),
        duration: 450,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start();
  }, [targetHeight]);

  const heightStyle = animatedHeight.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.miniBar,
        { height: heightStyle },
        backgroundColor ? { backgroundColor } : null,
      ]}
    />
  );
};

interface AnimatedProgressBarProps {
  targetWidth: string;
  backgroundColor: string;
}

const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  targetWidth,
  backgroundColor,
}) => {
  const animatedWidth = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    animatedWidth.setValue(0);
    Animated.timing(animatedWidth, {
      toValue: parseFloat(targetWidth),
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [targetWidth]);

  const widthStyle = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.progressBarFill,
        { width: widthStyle, backgroundColor },
      ]}
    />
  );
};

export const InsightsScreen: React.FC<InsightsScreenProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<TabType>('week');
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  // Generate random data for the month data to keep it consistent but dynamic
  const monthValues = React.useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      // Seed values around 8000-16000
      return Math.floor(((i * 7 + 123) % 8000)) + 8000;
    });
  }, []);

  const chartData: Record<TabType, ChartData> = {
    day: {
      total: '12,450',
      avg: '518',
      values: [200, 150, 100, 80, 50, 60, 120, 300, 550, 800, 1100, 1200, 1150, 900, 750, 850, 1000, 1100, 900, 600, 400, 300, 250, 200],
      labels: ['12A', '4A', '8A', '12P', '4P', '8P'],
      pbIndex: 11 // 1200 steps
    },
    week: {
      total: '87,150',
      avg: '12,450',
      values: [10200, 11500, 9800, 13400, 16204, 12800, 13246],
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      pbIndex: 4 // 16204 steps (Friday)
    },
    month: {
      total: '372,400',
      avg: '12,012',
      values: monthValues,
      labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
      pbIndex: 18 // Arbitrary Personal Best
    },
    year: {
      total: '4,520,000',
      avg: '376,666',
      values: [380000, 350000, 420000, 410000, 390000, 360000, 440000, 430000, 390000, 410000, 420000, 380000],
      labels: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
      pbIndex: 6 // July (440000)
    }
  };

  const currentData = chartData[activeTab];
  const maxVal = Math.max(...currentData.values);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedBar(null);
  };

  const handleStartWorkout = () => {
    Alert.alert(
      'Workout Started',
      'High-Intensity training session initiated! Let\'s go!',
      [{ text: 'OK' }]
    );
  };

  // Helper to render X-axis labels properly spaced
  const renderLabels = () => {
    if (activeTab === 'day') {
      // Only show a subset of labels for readability (every 4th hour)
      return (
        <View style={styles.labelsContainer}>
          {currentData.labels.map((lbl, idx) => (
            <Text key={idx} style={styles.axisLabel}>{lbl}</Text>
          ))}
        </View>
      );
    }

    if (activeTab === 'month') {
      return (
        <View style={styles.labelsContainerAround}>
          {currentData.labels.map((lbl, idx) => (
            <Text key={idx} style={styles.axisLabel}>{lbl}</Text>
          ))}
        </View>
      );
    }

    return (
      <View style={styles.labelsContainer}>
        {currentData.labels.map((lbl, idx) => (
          <Text key={idx} style={styles.axisLabel}>{lbl}</Text>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color="#131b2e" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hub Header & Tab Selector */}
        <View style={styles.hubHeaderRow}>
          <View>
            <Text style={styles.subTitle}>Performance Hub</Text>
            <Text style={styles.mainTitle}>Metric Insights</Text>
          </View>
        </View>

        {/* Tab Picker */}
        <GlassCard style={styles.tabSelectorCard} solid={true}>
          {(['day', 'week', 'month', 'year'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, isActive && styles.activeTabButton]}
                onPress={() => handleTabChange(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabButtonText, isActive && styles.activeTabButtonText]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </GlassCard>

        {/* Step Trend Card */}
        <GlassCard style={styles.trendCard} solid={true}>
          <View style={styles.trendCardHeader}>
            <View>
              <Text style={styles.trendCardTitle}>Step Count Trends</Text>
              <Text style={styles.trendCardSub}>
                Daily average:{' '}
                <Text style={styles.boldText}>{currentData.avg}</Text> steps
              </Text>
            </View>
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>Total: {currentData.total}</Text>
            </View>
          </View>

          {/* Bar Chart Container */}
          <View style={styles.chartWrapper}>
            <View style={styles.barsContainer}>
              {currentData.values.map((val, idx) => (
                <AnimatedBar
                  key={idx}
                  val={val}
                  maxVal={maxVal}
                  idx={idx}
                  pbIndex={currentData.pbIndex}
                  selectedBar={selectedBar}
                  setSelectedBar={setSelectedBar}
                  activeTab={activeTab}
                />
              ))}
            </View>

            {/* X Axis labels */}
            {renderLabels()}
          </View>
        </GlassCard>

        {/* Grid Breakdown */}
        <View style={styles.gridRow}>
          {/* Active Heart Rate */}
          <GlassCard style={styles.gridCard} solid={true}>
            <View style={styles.cardTopRow}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(186, 26, 26, 0.1)' }]}>
                <MaterialIcons name="favorite" size={20} color="#ba1a1a" />
              </View>
              <Text style={styles.percentageGreen}>+4% vs avg</Text>
            </View>
            <View style={styles.cardValueContainer}>
              <Text style={styles.cardLabel}>Active Heart Rate</Text>
              <View style={styles.valueRow}>
                <Text style={styles.bigValue}>148</Text>
                <Text style={styles.unitLabel}>Avg BPM</Text>
              </View>
            </View>
            {/* Heart Rate mini bars */}
            <View style={styles.miniChart}>
              <AnimatedMiniBar targetHeight="40%" delay={0} />
              <AnimatedMiniBar targetHeight="60%" delay={40} />
              <AnimatedMiniBar targetHeight="90%" delay={80} />
              <AnimatedMiniBar
                targetHeight="100%"
                delay={120}
                backgroundColor="rgba(186, 26, 26, 0.6)"
              />
              <AnimatedMiniBar targetHeight="70%" delay={160} />
              <AnimatedMiniBar targetHeight="50%" delay={200} />
            </View>
          </GlassCard>

          {/* Sleep Quality */}
          <GlassCard style={styles.gridCard} solid={true}>
            <View style={styles.cardTopRow}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 88, 190, 0.1)' }]}>
                <MaterialIcons name="bedtime" size={20} color="#0058be" />
              </View>
              <Text style={styles.percentageBlue}>Excellent</Text>
            </View>
            <View style={styles.cardValueContainer}>
              <Text style={styles.cardLabel}>Sleep Quality</Text>
              <View style={styles.valueRow}>
                <Text style={styles.bigValue}>92</Text>
                <Text style={styles.unitLabel}>% Score</Text>
              </View>
            </View>
            {/* Deep Sleep details and progress bar */}
            <View style={styles.sleepDetails}>
              <Text style={styles.sleepText}>
                Deep Sleep: <Text style={styles.boldDarkText}>3h 42m</Text>
              </Text>
              <View style={styles.progressBarBg}>
                <AnimatedProgressBar targetWidth="82%" backgroundColor="#0058be" />
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Recovery Score Card */}
        <GlassCard style={styles.recoveryCard} solid={true}>
          <View style={styles.recoveryContent}>
            <ProgressRing
              size={76}
              strokeWidth={8}
              progress={0.85}
              gradientColors={['#22c55e', '#006e2f']}
              backgroundColor="#e2e7ff"
            >
              <Text style={styles.recoveryProgressText}>85</Text>
            </ProgressRing>
            <View style={styles.recoveryDetails}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 110, 47, 0.1)', alignSelf: 'flex-start', marginBottom: 4 }]}>
                <MaterialIcons name="bolt" size={20} color="#006e2f" />
              </View>
              <Text style={styles.cardLabel}>Recovery Score</Text>
              <Text style={styles.recoveryTitle}>Ready for Peak Intensity</Text>
              <Text style={styles.recoverySub}>OPTIMIZED STATE</Text>
            </View>
          </View>
        </GlassCard>

        {/* Pulse Insight Card */}
        <View style={styles.insightCard}>
          <View style={styles.insightBorderAccent} />
          <View style={styles.insightLayout}>
            <View style={styles.insightHeaderRow}>
              <View style={styles.insightIconCircle}>
                <MaterialIcons name="auto-awesome" size={28} color="#ffffff" />
              </View>
              <View style={styles.insightTextColumn}>
                <Text style={styles.insightTitle}>Pulse Insight</Text>
                <Text style={styles.insightBody}>
                  "Your recovery is <Text style={styles.boldDarkText}>15% higher</Text> than last week. Great time for a high-intensity session today!"
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.workoutBtn} onPress={handleStartWorkout} activeOpacity={0.85}>
              <Text style={styles.workoutBtnText}>Start High-Intensity</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 36,
    paddingBottom: 6,
    paddingHorizontal: 12,
    backgroundColor: '#faf8ff',
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 110, // Leave room for floating navigation bar
  },
  hubHeaderRow: {
    marginBottom: 16,
  },
  subTitle: {
    fontSize: 11,
    fontFamily: theme.fonts.manrope.semibold,
    color: '#006e2f',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 26,
    fontFamily: theme.fonts.hanken.bold,
    color: '#131b2e',
  },
  tabSelectorCard: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: 30,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  activeTabButton: {
    backgroundColor: '#006e2f',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  tabButtonText: {
    fontSize: 13,
    fontFamily: theme.fonts.manrope.medium,
    color: '#6b7280',
  },
  activeTabButtonText: {
    color: '#ffffff',
    fontFamily: theme.fonts.manrope.semibold,
  },
  trendCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    marginBottom: 16,
  },
  trendCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  trendCardTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.hanken.bold,
    color: '#131b2e',
    marginBottom: 4,
  },
  trendCardSub: {
    fontSize: 12,
    fontFamily: theme.fonts.manrope.regular,
    color: '#6b7280',
  },
  boldText: {
    fontFamily: theme.fonts.manrope.semibold,
    color: '#131b2e',
  },
  totalBadge: {
    backgroundColor: 'rgba(0, 110, 47, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 110, 47, 0.15)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  totalBadgeText: {
    fontSize: 11,
    fontFamily: theme.fonts.manrope.semibold,
    color: '#006e2f',
  },
  chartWrapper: {
    height: 200,
    width: '100%',
    justifyContent: 'flex-end',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    height: 160,
  },
  barColumn: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginHorizontal: 1.5,
    position: 'relative',
  },
  bar: {
    width: '80%',
    maxWidth: 16,
    backgroundColor: '#22c55e',
    borderRadius: 6,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  pbBar: {
    backgroundColor: '#006e2f',
  },
  selectedBar: {
    backgroundColor: '#006e2f',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3,
  },
  pbBadge: {
    position: 'absolute',
    left: '50%',
    marginLeft: -18,
    backgroundColor: '#131b2e',
    borderRadius: 6,
    width: 36,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    zIndex: 10,
  },
  pbBadgeText: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tooltipBadge: {
    position: 'absolute',
    left: '50%',
    marginLeft: -28,
    backgroundColor: '#131b2e',
    borderRadius: 6,
    width: 56,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 20,
  },
  tooltipText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontFamily: theme.fonts.manrope.medium,
    textAlign: 'center',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  labelsContainerAround: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  axisLabel: {
    fontSize: 10,
    fontFamily: theme.fonts.manrope.medium,
    color: '#9ca3af',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  gridCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageGreen: {
    fontSize: 11,
    fontFamily: theme.fonts.manrope.semibold,
    color: '#ba1a1a',
  },
  percentageBlue: {
    fontSize: 11,
    fontFamily: theme.fonts.manrope.semibold,
    color: '#0058be',
  },
  cardValueContainer: {
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 11,
    fontFamily: theme.fonts.manrope.medium,
    color: '#6b7280',
    marginBottom: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  bigValue: {
    fontSize: 22,
    fontFamily: theme.fonts.hanken.bold,
    color: '#131b2e',
  },
  unitLabel: {
    fontSize: 11,
    fontFamily: theme.fonts.manrope.regular,
    color: '#6b7280',
  },
  miniChart: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  miniBar: {
    flex: 1,
    backgroundColor: 'rgba(186, 26, 26, 0.15)',
    borderRadius: 4,
  },
  sleepDetails: {
    marginTop: 6,
  },
  sleepText: {
    fontSize: 11,
    fontFamily: theme.fonts.manrope.regular,
    color: '#6b7280',
  },
  boldDarkText: {
    fontFamily: theme.fonts.manrope.semibold,
    color: '#131b2e',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  recoveryCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    marginBottom: 16,
  },
  recoveryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  recoveryProgressText: {
    fontSize: 18,
    fontFamily: theme.fonts.hanken.bold,
    color: '#006e2f',
  },
  recoveryDetails: {
    flex: 1,
  },
  recoveryTitle: {
    fontSize: 14,
    fontFamily: theme.fonts.manrope.semibold,
    color: '#131b2e',
    marginTop: 2,
  },
  recoverySub: {
    fontSize: 9,
    fontFamily: theme.fonts.manrope.semibold,
    color: '#006e2f',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  insightCard: {
    position: 'relative',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    borderLeftWidth: 6,
    borderLeftColor: '#006e2f',
    overflow: 'hidden',
  },
  insightBorderAccent: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 0,
  },
  insightLayout: {
    padding: 18,
  },
  insightHeaderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  insightIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  insightTextColumn: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 15,
    fontFamily: theme.fonts.hanken.bold,
    color: '#006e2f',
    marginBottom: 2,
  },
  insightBody: {
    fontSize: 13,
    fontFamily: theme.fonts.manrope.regular,
    color: '#4b5563',
    lineHeight: 18,
  },
  workoutBtn: {
    backgroundColor: '#006e2f',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#006e2f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  workoutBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: theme.fonts.manrope.semibold,
  },
});
