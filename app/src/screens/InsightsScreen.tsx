import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform, Dimensions, Animated, Easing, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { GlassCard } from '../components/GlassCard';
import { ProgressRing } from '../components/ProgressRing';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { fetchHeartRateMetrics, checkHeartRatePermission, fetchSleepSessionMetrics, checkSleepPermission, fetchStepsForDates, fetchHourlyStepsForToday, fetchStepsForDateRange, fetchStepsForDate, checkHealthPermissions } from '../services/healthConnect';

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
    const delay = Math.min(idx * 30, 450);
    animatedHeight.setValue(0);
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(animatedHeight, {
        toValue: targetHeightPercent,
        duration: 900,
        easing: Easing.out(Easing.cubic),
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
        duration: 800,
        easing: Easing.out(Easing.cubic),
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
      duration: 1000,
      easing: Easing.out(Easing.cubic),
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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('week');
  const [selectedBar, setSelectedBar] = useState<number | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [realHeartRate, setRealHeartRate] = useState<number | null>(null);
  const [realSleep, setRealSleep] = useState<any | null>(null);
  const [realHourlySteps, setRealHourlySteps] = useState<number[] | null>(null);
  const [realWeeklySteps, setRealWeeklySteps] = useState<Record<string, number>>({});
  const [realMonthlySteps, setRealMonthlySteps] = useState<Record<string, number>>({});
  const [realYearlySteps, setRealYearlySteps] = useState<Record<number, number>>({});

  useEffect(() => {
    let active = true;
    const fetchActivities = async () => {
      try {
        const res = await api.get('/activities?limit=100');
        if (active) {
          setActivities(res.data);
        }
      } catch (err) {
        console.warn('Insights: Failed to fetch activities', err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };
    
    const fetchRealBpm = async () => {
      try {
        const hasPerm = await checkHeartRatePermission();
        if (hasPerm) {
          const bpm = await fetchHeartRateMetrics();
          if (active && bpm > 0) {
            setRealHeartRate(bpm);
          }
        }
      } catch (err) {
        console.warn('Insights: Failed to check or fetch real heart rate', err);
      }
    };

    const fetchRealSleep = async () => {
      try {
        const hasPerm = await checkSleepPermission();
        if (hasPerm) {
          const sleepData = await fetchSleepSessionMetrics();
          if (active && sleepData.durationMinutes > 0) {
            setRealSleep(sleepData);
          }
        }
      } catch (err) {
        console.warn('Insights: Failed to check or fetch real sleep sessions', err);
      }
    };

    const fetchRealStepsData = async () => {
      try {
        const hasPerm = await checkHealthPermissions();
        if (hasPerm) {
          // 1. Fetch hourly steps for today
          const hourly = await fetchHourlyStepsForToday();
          if (active && hourly) {
            setRealHourlySteps(hourly);
          }

          // 2. Fetch past 7 days' steps for week
          const weekDates: Date[] = [];
          const now = new Date();
          const getMonday = (d: Date) => {
            const date = new Date(d);
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1);
            return new Date(date.setDate(diff));
          };
          const monday = getMonday(now);
          for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            weekDates.push(d);
          }
          const weekSteps = await fetchStepsForDates(weekDates);
          if (active) {
            setRealWeeklySteps(weekSteps);
          }

          // 3. Fetch past 30 days' steps for month
          const monthDates: Date[] = [];
          for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            monthDates.push(d);
          }
          const monthSteps = await fetchStepsForDates(monthDates);
          if (active) {
            setRealMonthlySteps(monthSteps);
          }

          // 4. Fetch past 12 months' steps for year
          const yearStepsMap: Record<number, number> = {};
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth();
          const yearPromises = Array.from({ length: currentMonth + 1 }, async (_, m) => {
            const startOfMonth = new Date(currentYear, m, 1);
            const endOfMonth = m === currentMonth ? new Date() : new Date(currentYear, m + 1, 0, 23, 59, 59, 999);
            const steps = await fetchStepsForDateRange(startOfMonth, endOfMonth);
            return { month: m, steps };
          });
          const yearResults = await Promise.all(yearPromises);
          yearResults.forEach((res) => {
            yearStepsMap[res.month] = res.steps;
          });
          if (active) {
            setRealYearlySteps(yearStepsMap);
          }
        }
      } catch (err) {
        console.warn('Insights: Failed to fetch real steps data', err);
      }
    };

    fetchActivities();
    fetchRealBpm();
    fetchRealSleep();
    fetchRealStepsData();
    return () => {
      active = false;
    };
  }, []);

  const chartData = React.useMemo<Record<TabType, ChartData>>(() => {
    const now = new Date();
    const todaySteps = user?.todaySteps || 0;

    const getMockStepsForDate = (date: Date): number => {
      const seed = date.getDate() + date.getMonth() * 31 + date.getFullYear();
      return 8000 + ((seed * 117) % 5000);
    };

    const getStepsForDate = (date: Date): number => {
      const dateStr = date.toDateString();
      const dayActivities = activities.filter(
        (act) => new Date(act.timestamp).toDateString() === dateStr
      );
      const activitySteps = dayActivities.reduce((sum, act) => sum + (act.steps || 0), 0);
      return getMockStepsForDate(date) + activitySteps;
    };
    
    // 1. Day tab (24 hours)
    let dayValues = Array(24).fill(0);
    if (realHourlySteps) {
      dayValues = [...realHourlySteps];
    } else {
      let activityStepsToday = 0;
      const todayStr = now.toDateString();
      const todayActivities = activities.filter(
        (act) => new Date(act.timestamp).toDateString() === todayStr
      );
      
      todayActivities.forEach((act) => {
        const hr = new Date(act.timestamp).getHours();
        dayValues[hr] += act.steps || 0;
        activityStepsToday += act.steps || 0;
      });
      
      const diff = todaySteps - activityStepsToday;
      if (diff > 0) {
        const wakingHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
        const hourWeights: Record<number, number> = {
          8: 0.5,
          9: 1.5,
          10: 1.5,
          11: 1.0,
          12: 1.3,
          13: 1.3,
          14: 1.0,
          15: 1.0,
          16: 1.0,
          17: 1.6,
          18: 1.6,
          19: 1.6,
          20: 1.0,
          21: 1.0,
          22: 0.5,
        };
        
        const totalWeight = Object.values(hourWeights).reduce((sum, w) => sum + w, 0);
        
        wakingHours.forEach((hr) => {
          const weight = hourWeights[hr];
          const share = Math.round((diff * weight) / totalWeight);
          dayValues[hr] += share;
        });
        
        const finalDiff = todaySteps - dayValues.reduce((a, b) => a + b, 0);
        const maxHr = dayValues.indexOf(Math.max(...dayValues));
        dayValues[maxHr] = Math.max(0, dayValues[maxHr] + finalDiff);
      }
    }
    
    const dayTotalStr = todaySteps.toLocaleString();
    const dayAvgStr = Math.round(todaySteps / 24).toLocaleString();
    const dayPbIndex = dayValues.indexOf(Math.max(...dayValues));

    // 2. Week tab (Monday to Sunday)
    const weekValues = Array(7).fill(0);
    const getMonday = (d: Date) => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(date.setDate(diff));
    };
    const monday = getMonday(now);
    monday.setHours(0, 0, 0, 0);
    const currentDayIndex = (now.getDay() + 6) % 7; // Monday is 0
    
    for (let i = 0; i < 7; i++) {
      const targetDay = new Date(monday);
      targetDay.setDate(monday.getDate() + i);
      targetDay.setHours(0, 0, 0, 0);
      
      if (i === currentDayIndex) {
        weekValues[i] = todaySteps;
      } else if (i > currentDayIndex) {
        weekValues[i] = 0;
      } else {
        const dateKey = targetDay.toDateString();
        const realSteps = realWeeklySteps[dateKey];
        weekValues[i] = realSteps !== undefined && realSteps > 0 ? realSteps : getStepsForDate(targetDay);
      }
    }
    
    const weekTotal = weekValues.reduce((a, b) => a + b, 0);
    const daysSoFarInWeek = currentDayIndex + 1;
    const weekAvg = Math.round(weekTotal / daysSoFarInWeek);
    const weekPbIndex = weekValues.indexOf(Math.max(...weekValues));

    // 3. Month tab (30 days)
    const monthValuesList: number[] = [];
    for (let i = 29; i >= 0; i--) {
      const targetDay = new Date();
      targetDay.setDate(now.getDate() - i);
      targetDay.setHours(0, 0, 0, 0);
      
      if (i === 0) {
        monthValuesList.push(todaySteps);
      } else {
        const dateKey = targetDay.toDateString();
        const realSteps = realMonthlySteps[dateKey];
        monthValuesList.push(realSteps !== undefined && realSteps > 0 ? realSteps : getStepsForDate(targetDay));
      }
    }
    const monthTotal = monthValuesList.reduce((a, b) => a + b, 0);
    const monthAvg = Math.round(monthTotal / 30);
    const monthPbIndex = monthValuesList.indexOf(Math.max(...monthValuesList));

    // 4. Year tab (12 calendar months)
    const yearValues = Array(12).fill(0);
    const currentMonth = now.getMonth();
    for (let m = 0; m < 12; m++) {
      if (m > currentMonth) {
        yearValues[m] = 0;
      } else if (m === currentMonth) {
        const realSteps = realYearlySteps[m];
        if (realSteps !== undefined && realSteps > 0) {
          yearValues[m] = realSteps;
        } else {
          const daysSoFar = now.getDate();
          let monthlySum = 0;
          for (let d = 1; d < daysSoFar; d++) {
            const targetDay = new Date(now.getFullYear(), m, d);
            monthlySum += getStepsForDate(targetDay);
          }
          yearValues[m] = monthlySum + todaySteps;
        }
      } else {
        const realSteps = realYearlySteps[m];
        if (realSteps !== undefined && realSteps > 0) {
          yearValues[m] = realSteps;
        } else {
          const daysInMonth = new Date(now.getFullYear(), m + 1, 0).getDate();
          let monthlySum = 0;
          for (let d = 1; d <= daysInMonth; d++) {
            const targetDay = new Date(now.getFullYear(), m, d);
            monthlySum += getStepsForDate(targetDay);
          }
          yearValues[m] = monthlySum;
        }
      }
    }
    
    const yearTotal = yearValues.reduce((a, b) => a + b, 0);
    let totalDaysInYearSoFar = 0;
    for (let m = 0; m < currentMonth; m++) {
      totalDaysInYearSoFar += new Date(now.getFullYear(), m + 1, 0).getDate();
    }
    totalDaysInYearSoFar += now.getDate();
    totalDaysInYearSoFar = Math.max(1, totalDaysInYearSoFar);
    const yearAvg = Math.round(yearTotal / totalDaysInYearSoFar);
    const yearPbIndex = yearValues.indexOf(Math.max(...yearValues));

    return {
      day: {
        total: dayTotalStr,
        avg: dayAvgStr,
        values: dayValues,
        labels: [
          '12A', '', '', '', 
          '4A', '', '', '', 
          '8A', '', '', '', 
          '12P', '', '', '', 
          '4P', '', '', '', 
          '8P', '', '', ''
        ],
        pbIndex: dayPbIndex,
      },
      week: {
        total: weekTotal.toLocaleString(),
        avg: weekAvg.toLocaleString(),
        values: weekValues,
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        pbIndex: weekPbIndex,
      },
      month: {
        total: monthTotal.toLocaleString(),
        avg: monthAvg.toLocaleString(),
        values: monthValuesList,
        labels: [
          '', '', '', 'Wk 1', '', '', '', 
          '', '', '', 'Wk 2', '', '', '', 
          '', '', '', 'Wk 3', '', '', '', 
          '', '', '', 'Wk 4', '', '', '', 
          '', ''
        ],
        pbIndex: monthPbIndex,
      },
      year: {
        total: yearTotal.toLocaleString(),
        avg: yearAvg.toLocaleString(),
        values: yearValues,
        labels: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
        pbIndex: yearPbIndex,
      },
    };
  }, [activities, user?.todaySteps, realHourlySteps, realWeeklySteps, realMonthlySteps, realYearlySteps]);

  const healthStats = React.useMemo(() => {
    const todaySteps = user?.todaySteps || 0;
    const dailyGoal = user?.dailyStepGoal || 10000;
    
    let totalHr = 0;
    let hrCount = 0;
    const getHrForType = (type: string) => {
      switch (type) {
        case 'run': return 162;
        case 'gym': return 138;
        case 'swim': return 145;
        case 'cycle': return 140;
        case 'walk': return 112;
        default: return 125;
      }
    };
    
    activities.slice(0, 5).forEach((act) => {
      totalHr += getHrForType(act.type);
      hrCount++;
    });
    
    const activeHeartRate = realHeartRate || (hrCount > 0 ? Math.round(totalHr / hrCount) : 148);
    const hrVsAvg = realHeartRate ? '+4% vs avg' : (hrCount > 0 ? '+4% vs avg' : '+0% vs avg');

    const stepRatio = Math.min(1.2, todaySteps / dailyGoal);
    let sleepScore = Math.min(100, Math.round(75 + (stepRatio * 15) + ((todaySteps * 3) % 7)));
    let deepSleepMinutes = Math.round(180 + (sleepScore * 0.6) + (todaySteps % 20));

    if (realSleep) {
      const sleepDurationRatio = Math.min(1.2, realSleep.durationMinutes / 480);
      sleepScore = Math.min(100, Math.round(sleepDurationRatio * 90 + (realSleep.stageDeepMinutes % 10)));
      deepSleepMinutes = realSleep.stageDeepMinutes;
    }

    const deepSleepText = `${Math.floor(deepSleepMinutes / 60)}h ${deepSleepMinutes % 60}m`;
    const deepSleepPercent = `${Math.min(95, Math.round((deepSleepMinutes / 300) * 100))}%`;

    const fatigue = Math.min(25, Math.round(todaySteps / 1500));
    const recoveryScore = Math.max(40, Math.min(100, Math.round(50 + (sleepScore * 0.5) - fatigue + (todaySteps % 5))));
    
    let recoveryStatus = 'Ready for Peak Intensity';
    let recoverySub = 'OPTIMIZED STATE';
    let recoveryMessage = 'Your recovery is high. Great time for a high-intensity session today!';
    
    if (recoveryScore < 60) {
      recoveryStatus = 'Needs Active Recovery';
      recoverySub = 'FATIGUED STATE';
      recoveryMessage = 'Your body shows signs of fatigue. Consider a gentle walk or rest today.';
    } else if (recoveryScore < 80) {
      recoveryStatus = 'Moderate Readiness';
      recoverySub = 'BALANCED STATE';
      recoveryMessage = 'Good recovery levels. A moderate workout or normal routine is recommended.';
    }

    return {
      activeHeartRate,
      hrVsAvg,
      sleepScore,
      deepSleepText,
      deepSleepPercent,
      recoveryScore,
      recoveryStatus,
      recoverySub,
      recoveryMessage,
    };
  }, [activities, user?.todaySteps, user?.dailyStepGoal, realHeartRate, realSleep]);

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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#006e2f" />
      </View>
    );
  }

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
              <Text style={styles.percentageGreen}>{healthStats.hrVsAvg}</Text>
            </View>
            <View style={styles.cardValueContainer}>
              <Text style={styles.cardLabel}>Active Heart Rate</Text>
              <View style={styles.valueRow}>
                <Text style={styles.bigValue}>{healthStats.activeHeartRate}</Text>
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
              <Text style={styles.percentageBlue}>{healthStats.sleepScore >= 85 ? 'Excellent' : healthStats.sleepScore >= 70 ? 'Good' : 'Fair'}</Text>
            </View>
            <View style={styles.cardValueContainer}>
              <Text style={styles.cardLabel}>Sleep Quality</Text>
              <View style={styles.valueRow}>
                <Text style={styles.bigValue}>{healthStats.sleepScore}</Text>
                <Text style={styles.unitLabel}>% Score</Text>
              </View>
            </View>
            {/* Deep Sleep details and progress bar */}
            <View style={styles.sleepDetails}>
              <Text style={styles.sleepText}>
                Deep Sleep: <Text style={styles.boldDarkText}>{healthStats.deepSleepText}</Text>
              </Text>
              <View style={styles.progressBarBg}>
                <AnimatedProgressBar targetWidth={healthStats.deepSleepPercent} backgroundColor="#0058be" />
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
              progress={healthStats.recoveryScore / 100}
              gradientColors={['#22c55e', '#006e2f']}
              backgroundColor="#e2e7ff"
            >
              <Text style={styles.recoveryProgressText}>{healthStats.recoveryScore}</Text>
            </ProgressRing>
            <View style={styles.recoveryDetails}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 110, 47, 0.1)', alignSelf: 'flex-start', marginBottom: 4 }]}>
                <MaterialIcons name="bolt" size={20} color="#006e2f" />
              </View>
              <Text style={styles.cardLabel}>Recovery Score</Text>
              <Text style={styles.recoveryTitle}>{healthStats.recoveryStatus}</Text>
              <Text style={styles.recoverySub}>{healthStats.recoverySub}</Text>
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
                  "{healthStats.recoveryMessage}"
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#faf8ff',
  },
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
