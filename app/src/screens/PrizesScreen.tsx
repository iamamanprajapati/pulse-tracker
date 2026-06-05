import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, ActivityIndicator, TouchableOpacity, Alert, Platform, Dimensions, FlatList, RefreshControl, Modal, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { MilestonesScreen } from './MilestonesScreen';

interface QuestItem {
  _id: string;
  title: string;
  description: string;
  targetSteps: number;
  currentSteps: number;
  rewardName: string;
  rewardImage: string;
  rewardType: 'gear' | 'badge';
  limitedEdition: boolean;
  isCompleted: boolean;
  isClaimed: boolean;
  isPaused?: boolean;
}

interface ClaimedReward {
  _id: string;
  title: string;
  image: string;
  type: 'gear' | 'badge';
  claimedAt: string;
}

export const PrizesScreen: React.FC = () => {
  const { user } = useAuth();
  const [quests, setQuests] = useState<QuestItem[]>([]);
  const [claimedRewards, setClaimedRewards] = useState<ClaimedReward[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [allMilestonesModalVisible, setAllMilestonesModalVisible] = useState(false);

  const calculateMaxStreak = (activityList: any[]) => {
    if (!activityList || activityList.length === 0) return 0;
    
    const activeDates = new Set<string>();
    activityList.forEach(a => {
      if (a.timestamp) {
        const d = new Date(a.timestamp);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        activeDates.add(`${year}-${month}-${day}`);
      }
    });

    if (activeDates.size === 0) return 0;

    const sortedDates = Array.from(activeDates).sort();

    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      
      const diffTime = Math.abs(curr.getTime() - prev.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    }

    return maxStreak;
  };

  const fetchPrizesData = async () => {
    try {
      const [questsRes, rewardsRes, activitiesRes] = await Promise.all([
        api.get('/quests'),
        api.get('/rewards'),
        api.get('/activities?limit=100')
      ]);
      setQuests(questsRes.data);
      setClaimedRewards(rewardsRes.data);
      setActivities(activitiesRes.data);
    } catch (err) {
      console.warn('Prizes: Fallback/error fetching data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrizesData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPrizesData();
    } catch (err) {
      console.warn('Prizes refresh failed', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleClaimReward = async (questId: string) => {
    setClaimingId(questId);
    try {
      const res = await api.post('/quests/claim', { questId });
      Alert.alert('Congratulations!', res.data.message || 'You have claimed your watch reward!');
      await fetchPrizesData();
    } catch (err: any) {
      console.error('Failed to claim reward:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to claim reward.');
    } finally {
      setClaimingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const activeQuests = quests.filter(q => !q.isClaimed);

  const claimedGears = claimedRewards.filter(r => r.type === 'gear');
  const claimedBadges = claimedRewards.filter(r => r.type === 'badge');

  const maxRunDistance = activities
    .filter(a => a.type === 'run')
    .reduce((max, a) => Math.max(max, a.distance || 0), 0);

  const maxWorkoutCalories = activities
    .reduce((max, a) => Math.max(max, a.calories || 0), 0);

  const activeStreak = calculateMaxStreak(activities);

  const allMilestones = [
    // --- STEPS (1-6) ---
    {
      key: 'First Step',
      title: 'First Step',
      requirement: '5k Steps',
      progressDesc: 'Accumulate at least 5,000 steps in total lifetime steps.',
      isUnlocked: (user?.lifetimeSteps || 0) >= 5000,
      currentVal: user?.lifetimeSteps || 0,
      targetVal: 5000,
      unit: 'steps',
      icon: 'directions-walk' as const,
      color: '#4caf50'
    },
    {
      key: 'Daily Explorer',
      title: 'Daily Explorer',
      requirement: '10k Steps',
      progressDesc: 'Accumulate at least 10,000 steps in total lifetime steps.',
      isUnlocked: (user?.lifetimeSteps || 0) >= 10000,
      currentVal: user?.lifetimeSteps || 0,
      targetVal: 10000,
      unit: 'steps',
      icon: 'directions-run' as const,
      color: '#22c55e'
    },
    {
      key: 'Pace Maker',
      title: 'Pace Maker',
      requirement: '25k Steps',
      progressDesc: 'Accumulate at least 25,000 steps in total lifetime steps.',
      isUnlocked: (user?.lifetimeSteps || 0) >= 25000,
      currentVal: user?.lifetimeSteps || 0,
      targetVal: 25000,
      unit: 'steps',
      icon: 'speed' as const,
      color: '#3b82f6'
    },
    {
      key: 'Peak Performer',
      title: 'Peak Performer',
      requirement: '50k Steps',
      progressDesc: 'Accumulate at least 50,000 steps in total lifetime steps.',
      isUnlocked: (user?.lifetimeSteps || 0) >= 50000,
      currentVal: user?.lifetimeSteps || 0,
      targetVal: 50000,
      unit: 'steps',
      icon: 'terrain' as const,
      color: '#f59e0b'
    },
    {
      key: 'Centurion',
      title: 'Centurion',
      requirement: '100k Steps',
      progressDesc: 'Accumulate at least 100,000 steps in total lifetime steps.',
      isUnlocked: (user?.lifetimeSteps || 0) >= 100000,
      currentVal: user?.lifetimeSteps || 0,
      targetVal: 100000,
      unit: 'steps',
      icon: 'military-tech' as const,
      color: '#a855f7'
    },
    {
      key: 'Half-Million Club',
      title: 'Half-Million Club',
      requirement: '500k Steps',
      progressDesc: 'Accumulate at least 500,000 steps in total lifetime steps.',
      isUnlocked: (user?.lifetimeSteps || 0) >= 500000,
      currentVal: user?.lifetimeSteps || 0,
      targetVal: 500000,
      unit: 'steps',
      icon: 'stars' as const,
      color: '#eab308'
    },
    // --- CALORIES (7-12) ---
    {
      key: 'Spark Starter',
      title: 'Spark Starter',
      requirement: '100 kcal',
      progressDesc: 'Accumulate at least 100 kcal burned in total lifetime calories.',
      isUnlocked: (user?.lifetimeCalories || 0) >= 100,
      currentVal: user?.lifetimeCalories || 0,
      targetVal: 100,
      unit: 'kcal',
      icon: 'flash-on' as const,
      color: '#f97316'
    },
    {
      key: 'Torch Bearer',
      title: 'Torch Bearer',
      requirement: '250 kcal',
      progressDesc: 'Accumulate at least 250 kcal burned in total lifetime calories.',
      isUnlocked: (user?.lifetimeCalories || 0) >= 250,
      currentVal: user?.lifetimeCalories || 0,
      targetVal: 250,
      unit: 'kcal',
      icon: 'whatshot' as const,
      color: '#f43f5e'
    },
    {
      key: 'Calorie Burner',
      title: 'Calorie Burner',
      requirement: '500 kcal',
      progressDesc: 'Burn at least 500 kcal in a single workout or accumulate 500 kcal total calories.',
      isUnlocked: maxWorkoutCalories >= 500 || (user?.lifetimeCalories || 0) >= 500,
      currentVal: Math.max(maxWorkoutCalories, user?.lifetimeCalories || 0),
      targetVal: 500,
      unit: 'kcal',
      icon: 'local-fire-department' as const,
      color: '#ec4899'
    },
    {
      key: 'Metabolic Beast',
      title: 'Metabolic Beast',
      requirement: '1,000 kcal single',
      progressDesc: 'Burn at least 1,000 kcal in a single workout session.',
      isUnlocked: maxWorkoutCalories >= 1000,
      currentVal: maxWorkoutCalories,
      targetVal: 1000,
      unit: 'kcal',
      icon: 'fitness-center' as const,
      color: '#dc2626'
    },
    {
      key: 'Heat Wave',
      title: 'Heat Wave',
      requirement: '5k kcal total',
      progressDesc: 'Accumulate at least 5,000 kcal in lifetime calories burned.',
      isUnlocked: (user?.lifetimeCalories || 0) >= 5000,
      currentVal: user?.lifetimeCalories || 0,
      targetVal: 5000,
      unit: 'kcal',
      icon: 'waves' as const,
      color: '#ea580c'
    },
    {
      key: 'Fire Engine',
      title: 'Fire Engine',
      requirement: '20k kcal total',
      progressDesc: 'Accumulate at least 20,000 kcal in lifetime calories burned.',
      isUnlocked: (user?.lifetimeCalories || 0) >= 20000,
      currentVal: user?.lifetimeCalories || 0,
      targetVal: 20000,
      unit: 'kcal',
      icon: 'fire-extinguisher' as const,
      color: '#b91c1c'
    },
    // --- DISTANCE (13-17) ---
    {
      key: 'Local Jogger',
      title: 'Local Jogger',
      requirement: '1 km total',
      progressDesc: 'Accumulate at least 1 kilometer of total lifetime distance.',
      isUnlocked: (user?.lifetimeKilometers || 0) >= 1,
      currentVal: user?.lifetimeKilometers || 0,
      targetVal: 1,
      unit: 'km',
      icon: 'map' as const,
      color: '#14b8a6'
    },
    {
      key: 'Swift Starter',
      title: 'Swift Starter',
      requirement: '5km Run',
      progressDesc: 'Run a single workout of at least 5km or accumulate 5km total distance.',
      isUnlocked: maxRunDistance >= 5 || (user?.lifetimeKilometers || 0) >= 5,
      currentVal: Math.max(maxRunDistance, user?.lifetimeKilometers || 0),
      targetVal: 5,
      unit: 'km',
      icon: 'bolt' as const,
      color: '#22c55e'
    },
    {
      key: 'Road Runner',
      title: 'Road Runner',
      requirement: '10km Run',
      progressDesc: 'Run a single workout of at least 10km or accumulate 10km total distance.',
      isUnlocked: maxRunDistance >= 10 || (user?.lifetimeKilometers || 0) >= 10,
      currentVal: Math.max(maxRunDistance, user?.lifetimeKilometers || 0),
      targetVal: 10,
      unit: 'km',
      icon: 'navigation' as const,
      color: '#06b6d4'
    },
    {
      key: 'Half Marathoner',
      title: 'Half Marathoner',
      requirement: '21 km total',
      progressDesc: 'Accumulate at least 21 kilometers of total lifetime distance.',
      isUnlocked: (user?.lifetimeKilometers || 0) >= 21,
      currentVal: user?.lifetimeKilometers || 0,
      targetVal: 21,
      unit: 'km',
      icon: 'explore' as const,
      color: '#0284c7'
    },
    {
      key: 'Century Cruiser',
      title: 'Century Cruiser',
      requirement: '100 km total',
      progressDesc: 'Accumulate at least 100 kilometers of total lifetime distance.',
      isUnlocked: (user?.lifetimeKilometers || 0) >= 100,
      currentVal: user?.lifetimeKilometers || 0,
      targetVal: 100,
      unit: 'km',
      icon: 'public' as const,
      color: '#0f766e'
    },
    // --- STREAKS (18-19) ---
    {
      key: 'Habit Builder',
      title: 'Habit Builder',
      requirement: '3-Day Streak',
      progressDesc: 'Log a workout on 3 consecutive days.',
      isUnlocked: activeStreak >= 3,
      currentVal: activeStreak,
      targetVal: 3,
      unit: 'days',
      icon: 'date-range' as const,
      color: '#3b82f6'
    },
    {
      key: '7-Day Streak',
      title: '7-Day Streak',
      requirement: 'Legendary Streak',
      progressDesc: 'Log a workout on 7 consecutive days.',
      isUnlocked: activeStreak >= 7,
      currentVal: activeStreak,
      targetVal: 7,
      unit: 'days',
      icon: 'stars' as const,
      color: '#6366f1'
    },
    // --- WORKOUTS (20) ---
    {
      key: 'Consistent Champion',
      title: 'Consistent Champion',
      requirement: '10 Workouts',
      progressDesc: 'Log a total of 10 workouts in your activity history.',
      isUnlocked: activities.length >= 10,
      currentVal: activities.length,
      targetVal: 10,
      unit: 'workouts',
      icon: 'emoji-events' as const,
      color: '#e11d48'
    }
  ];

  const badgesList = allMilestones.filter(b => 
    ['Swift Starter', 'Calorie Burner', 'Peak Performer', '7-Day Streak'].includes(b.key)
  );

  if (allMilestonesModalVisible) {
    return (
      <View style={{ flex: 1 }}>
        <MilestonesScreen 
          allMilestones={allMilestones} 
          onBack={() => setAllMilestonesModalVisible(false)}
          onPressBadge={(badge) => {
            setSelectedBadge(badge);
            setBadgeModalVisible(true);
          }}
        />

        {/* Milestone Badge Detail Modal */}
        <Modal visible={badgeModalVisible} transparent animationType="slide" onRequestClose={() => setBadgeModalVisible(false)}>
          <View style={styles.modalOverlay}>
            {selectedBadge && (
              <GlassCard style={styles.modalContent}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Milestone Detail</Text>
                  <TouchableOpacity onPress={() => setBadgeModalVisible(false)}>
                    <MaterialIcons name="close" size={22} color="#9ca3af" />
                  </TouchableOpacity>
                </View>

                {selectedBadge.isUnlocked ? (
                  // Unlocked / Victory State
                  <View style={styles.badgeDetailContent}>
                    <View style={styles.celebrationContainer}>
                      <View style={styles.confettiWrapper}>
                        <MaterialIcons name="star" size={24} color="#f59e0b" style={styles.star1} />
                        <MaterialIcons name="star" size={16} color="#3b82f6" style={styles.star2} />
                        <MaterialIcons name="star" size={20} color="#ec4899" style={styles.star3} />
                        <MaterialIcons name="star" size={18} color="#22c55e" style={styles.star4} />
                      </View>
                      
                      <View style={[styles.victoryIconWrapper, { backgroundColor: `${selectedBadge.color}15`, borderColor: selectedBadge.color }]}>
                        <MaterialIcons name="emoji-events" size={60} color={selectedBadge.color} />
                      </View>
                    </View>

                    <Text style={styles.victoryTitle}>VICTORY!</Text>
                    <Text style={styles.victoryBadgeName}>{selectedBadge.title}</Text>
                    <Text style={styles.badgeRequirementText}>{selectedBadge.requirement}</Text>
                    
                    <Text style={styles.victoryMessage}>
                      Outstanding achievement! You have unlocked this milestone:
                    </Text>
                    <Text style={styles.badgeGoalDesc}>{selectedBadge.progressDesc}</Text>

                    <View style={styles.achievementStatsContainer}>
                      <Text style={styles.achievementStatsTitle}>RECORDED METRIC</Text>
                      <Text style={[styles.achievementStatsVal, { color: selectedBadge.color }]}>
                        {selectedBadge.currentVal.toLocaleString(undefined, { maximumFractionDigits: 1 })} {selectedBadge.unit}
                      </Text>
                      <Text style={styles.achievementStatsSub}>Target: {selectedBadge.targetVal.toLocaleString()} {selectedBadge.unit}</Text>
                    </View>

                    <TouchableOpacity style={[styles.closeModalBtn, { backgroundColor: selectedBadge.color }]} onPress={() => setBadgeModalVisible(false)}>
                      <Text style={styles.closeModalBtnText}>Brilliant!</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  // Locked State
                  <View style={styles.badgeDetailContent}>
                    <View style={styles.lockedIconWrapper}>
                      <MaterialIcons name="lock-outline" size={48} color="#9ca3af" />
                    </View>

                    <Text style={styles.lockedTitle}>LOCKED</Text>
                    <Text style={styles.lockedBadgeName}>{selectedBadge.title}</Text>
                    <Text style={styles.badgeRequirementText}>{selectedBadge.requirement}</Text>
                    
                    <Text style={styles.lockedMessage}>
                      Complete this milestone requirement to unlock this badge:
                    </Text>
                    <Text style={styles.badgeGoalDescLocked}>{selectedBadge.progressDesc}</Text>

                    {/* Progress Section */}
                    <View style={[styles.progressContainer, { width: '100%', marginTop: 8 }]}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressStepsText}>
                          {selectedBadge.currentVal.toLocaleString(undefined, { maximumFractionDigits: 1 })} / {selectedBadge.targetVal.toLocaleString()} {selectedBadge.unit}
                        </Text>
                        <Text style={[styles.progressPctText, { color: '#9ca3af' }]}>
                          {Math.round(Math.min(1, selectedBadge.currentVal / selectedBadge.targetVal) * 100)}%
                        </Text>
                      </View>
                      
                      <View style={styles.progressBarBg}>
                        <View style={[
                          styles.progressBarFill, 
                          { 
                            width: `${Math.round(Math.min(1, selectedBadge.currentVal / selectedBadge.targetVal) * 100)}%`,
                            backgroundColor: '#9ca3af'
                          }
                        ]} />
                      </View>
                    </View>

                    <Text style={styles.remainingProgressText}>
                      Needs {(selectedBadge.targetVal - selectedBadge.currentVal).toLocaleString(undefined, { maximumFractionDigits: 1 })} more {selectedBadge.unit} to unlock.
                    </Text>

                    <TouchableOpacity style={styles.closeModalBtnLocked} onPress={() => setBadgeModalVisible(false)}>
                      <Text style={styles.closeModalBtnTextLocked}>Keep Training</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </GlassCard>
            )}
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />
        }
      >
        
        {/* Header Appbar */}
        <View style={styles.header}>
          <View style={styles.profileBadge}>
            <Image source={{ uri: user?.photoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80' }} style={styles.profilePhoto} />
            <Text style={styles.profileGreeting}>PulseTrack</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <MaterialIcons name="notifications-none" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Active Prize Section */}
        {/* Active Prizes Section (Carousel) */}
        {activeQuests.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Prizes ({activeQuests.length})</Text>
            <FlatList
              data={activeQuests}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={SCREEN_WIDTH - 30}
              decelerationRate="fast"
              snapToAlignment="center"
              style={{ marginHorizontal: -20 }}
              contentContainerStyle={styles.carouselContainer}
              keyExtractor={(item) => item._id}
              nestedScrollEnabled={true}
              renderItem={({ item }) => {
                const pct = Math.min(1, item.currentSteps / item.targetSteps);
                const pctFormatted = Math.round(pct * 100);
                return (
                  <View style={[styles.questCard, { width: SCREEN_WIDTH - 46, marginRight: 14 }]}>
                    <View style={styles.questImageWrapper}>
                      <Image source={{ uri: item.rewardImage || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHlj9ed06EGvVTX-TAzNl3aVKoLD0xsfOyVDgeLkc8L58MufBoj-Z8lEyfCdMCDxmCc7JJoGOcMbckMyEAgpPSTvFgcO_IA9tz2VgFErod5NFF7XZ__T_2QHTYHAJMVd3S-vKQyu6f77oaJix4dRMzFMYBqjHEnTnQmSR9dgVSn-e-PkHRf9zAHnkPRhaJq3dxfmwk5DHnBIUMrzFP1hWR6pBMtLC2pFVde5ul4NHEuQxxcAFU2VHqzlKxWFDz-16t2dzlnlVSNrKE' }} style={styles.questRewardImage} />
                    </View>
                    
                    <View style={styles.questInfo}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        {item.limitedEdition ? (
                          <Text style={styles.limitedLabel}>LIMITED EDITION</Text>
                        ) : (
                          <Text style={[styles.limitedLabel, { color: theme.colors.primary }]}>SYSTEM PRIZE</Text>
                        )}
                        {item.isPaused && (
                          <Text style={[styles.limitedLabel, { color: '#ef4444' }]}>PAUSED</Text>
                        )}
                      </View>
                      <Text style={styles.questName} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.questDesc} numberOfLines={2}>{item.description}</Text>
                      
                      <View style={styles.progressContainer}>
                        <View style={styles.progressHeader}>
                          <Text style={styles.progressStepsText}>
                            {item.currentSteps.toLocaleString()} / {item.targetSteps.toLocaleString()} steps
                          </Text>
                          <Text style={styles.progressPctText}>{pctFormatted}%</Text>
                        </View>
                        
                        <View style={styles.progressBarBg}>
                          <View style={[styles.progressBarFill, { width: `${pctFormatted}%` }]} />
                        </View>
                      </View>

                      {item.isCompleted && !item.isClaimed ? (
                        <TouchableOpacity
                          style={styles.claimBtn}
                          onPress={() => handleClaimReward(item._id)}
                          disabled={claimingId === item._id}
                          activeOpacity={0.85}
                        >
                          {claimingId === item._id ? (
                            <ActivityIndicator color="#ffffff" />
                          ) : (
                            <Text style={styles.claimBtnText}>Claim Exclusive Reward</Text>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity 
                          style={styles.detailsBtn}
                          onPress={() => Alert.alert('Prize Details', `Accumulate ${(item.targetSteps - item.currentSteps).toLocaleString()} more steps to claim this prize.`)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.detailsBtnText}>View Prize Details</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              }}
            />
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Prizes</Text>
            <View style={[styles.questCard, { padding: 16, alignItems: 'center' }]}>
              <MaterialIcons name="emoji-events" size={48} color="#9ca3af" style={{ marginBottom: 12 }} />
              <Text style={[styles.questName, { textAlign: 'center', marginBottom: 4 }]}>All Prizes Claimed!</Text>
              <Text style={[styles.questDesc, { textAlign: 'center', marginBottom: 0 }]}>
                Check back later for new fitness campaigns launched by the admin.
              </Text>
            </View>
          </View>
        )}

        {/* Milestone Badges Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Milestone Badges</Text>
            <TouchableOpacity onPress={() => setAllMilestonesModalVisible(true)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.badgesGrid}>
            {badgesList.map((badge) => {
              const isLocked = !badge.isUnlocked;
              const subText = isLocked ? 'Locked' : badge.requirement;
              
              const handlePressBadge = () => {
                setSelectedBadge(badge);
                setBadgeModalVisible(true);
              };

              return (
                <TouchableOpacity 
                  key={badge.key}
                  style={[
                    styles.badgeCard,
                    isLocked && styles.lockedBadgeCard
                  ]}
                  onPress={handlePressBadge}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.badgeIconWrapper,
                    { backgroundColor: isLocked ? '#f3f4f6' : `${badge.color}15` }
                  ]}>
                    <MaterialIcons name={badge.icon} size={28} color={isLocked ? '#9ca3af' : badge.color} />
                  </View>
                  <Text style={styles.badgeTitle} numberOfLines={1}>
                    {badge.title}
                  </Text>
                  <Text style={styles.badgeSub} numberOfLines={1}>
                    {subText}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Claimed Rewards List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Claimed Rewards</Text>
          <View style={styles.claimedList}>
            {claimedGears.length === 0 ? (
              <Text style={styles.emptyText}>No gear items claimed yet.</Text>
            ) : (
              claimedGears.map((reward) => (
                <View key={reward._id} style={styles.rewardRowCard}>
                  <Image source={{ uri: reward.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHlj9ed06EGvVTX-TAzNl3aVKoLD0xsfOyVDgeLkc8L58MufBoj-Z8lEyfCdMCDxmCc7JJoGOcMbckMyEAgpPSTvFgcO_IA9tz2VgFErod5NFF7XZ__T_2QHTYHAJMVd3S-vKQyu6f77oaJix4dRMzFMYBqjHEnTnQmSR9dgVSn-e-PkHRf9zAHnkPRhaJq3dxfmwk5DHnBIUMrzFP1hWR6pBMtLC2pFVde5ul4NHEuQxxcAFU2VHqzlKxWFDz-16t2dzlnlVSNrKE' }} style={styles.rewardImage} />
                  <View style={styles.rewardInfo}>
                    <Text style={styles.rewardTitle}>{reward.title}</Text>
                    <Text style={styles.rewardDate}>
                      Claimed on {new Date(reward.claimedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  <MaterialIcons name="check-circle" size={22} color="#22c55e" />
                </View>
              ))
            )}
          </View>
        </View>

      </ScrollView>



      {/* Milestone Badge Detail Modal */}
      <Modal visible={badgeModalVisible} transparent animationType="slide" onRequestClose={() => setBadgeModalVisible(false)}>
        <View style={styles.modalOverlay}>
          {selectedBadge && (
            <GlassCard style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Milestone Detail</Text>
                <TouchableOpacity onPress={() => setBadgeModalVisible(false)}>
                  <MaterialIcons name="close" size={22} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {selectedBadge.isUnlocked ? (
                // Unlocked / Victory State
                <View style={styles.badgeDetailContent}>
                  <View style={styles.celebrationContainer}>
                    <View style={styles.confettiWrapper}>
                      <MaterialIcons name="star" size={24} color="#f59e0b" style={styles.star1} />
                      <MaterialIcons name="star" size={16} color="#3b82f6" style={styles.star2} />
                      <MaterialIcons name="star" size={20} color="#ec4899" style={styles.star3} />
                      <MaterialIcons name="star" size={18} color="#22c55e" style={styles.star4} />
                    </View>
                    
                    <View style={[styles.victoryIconWrapper, { backgroundColor: `${selectedBadge.color}15`, borderColor: selectedBadge.color }]}>
                      <MaterialIcons name="emoji-events" size={60} color={selectedBadge.color} />
                    </View>
                  </View>

                  <Text style={styles.victoryTitle}>VICTORY!</Text>
                  <Text style={styles.victoryBadgeName}>{selectedBadge.title}</Text>
                  <Text style={styles.badgeRequirementText}>{selectedBadge.requirement}</Text>
                  
                  <Text style={styles.victoryMessage}>
                    Outstanding achievement! You have unlocked this milestone:
                  </Text>
                  <Text style={styles.badgeGoalDesc}>{selectedBadge.progressDesc}</Text>

                  <View style={styles.achievementStatsContainer}>
                    <Text style={styles.achievementStatsTitle}>RECORDED METRIC</Text>
                    <Text style={[styles.achievementStatsVal, { color: selectedBadge.color }]}>
                      {selectedBadge.currentVal.toLocaleString(undefined, { maximumFractionDigits: 1 })} {selectedBadge.unit}
                    </Text>
                    <Text style={styles.achievementStatsSub}>Target: {selectedBadge.targetVal.toLocaleString()} {selectedBadge.unit}</Text>
                  </View>

                  <TouchableOpacity style={[styles.closeModalBtn, { backgroundColor: selectedBadge.color }]} onPress={() => setBadgeModalVisible(false)}>
                    <Text style={styles.closeModalBtnText}>Brilliant!</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Locked State
                <View style={styles.badgeDetailContent}>
                  <View style={styles.lockedIconWrapper}>
                    <MaterialIcons name="lock-outline" size={48} color="#9ca3af" />
                  </View>

                  <Text style={styles.lockedTitle}>LOCKED</Text>
                  <Text style={styles.lockedBadgeName}>{selectedBadge.title}</Text>
                  <Text style={styles.badgeRequirementText}>{selectedBadge.requirement}</Text>
                  
                  <Text style={styles.lockedMessage}>
                    Complete this milestone requirement to unlock this badge:
                  </Text>
                  <Text style={styles.badgeGoalDescLocked}>{selectedBadge.progressDesc}</Text>

                  {/* Progress Section */}
                  <View style={[styles.progressContainer, { width: '100%', marginTop: 8 }]}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressStepsText}>
                        {selectedBadge.currentVal.toLocaleString(undefined, { maximumFractionDigits: 1 })} / {selectedBadge.targetVal.toLocaleString()} {selectedBadge.unit}
                      </Text>
                      <Text style={[styles.progressPctText, { color: '#9ca3af' }]}>
                        {Math.round(Math.min(1, selectedBadge.currentVal / selectedBadge.targetVal) * 100)}%
                      </Text>
                    </View>
                    
                    <View style={styles.progressBarBg}>
                      <View style={[
                        styles.progressBarFill, 
                        { 
                          width: `${Math.round(Math.min(1, selectedBadge.currentVal / selectedBadge.targetVal) * 100)}%`,
                          backgroundColor: '#9ca3af'
                        }
                      ]} />
                    </View>
                  </View>

                  <Text style={styles.remainingProgressText}>
                    Needs {(selectedBadge.targetVal - selectedBadge.currentVal).toLocaleString(undefined, { maximumFractionDigits: 1 })} more {selectedBadge.unit} to unlock.
                  </Text>

                  <TouchableOpacity style={styles.closeModalBtnLocked} onPress={() => setBadgeModalVisible(false)}>
                    <Text style={styles.closeModalBtnTextLocked}>Keep Training</Text>
                  </TouchableOpacity>
                </View>
              )}
            </GlassCard>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profilePhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  profileGreeting: {
    fontSize: 16,
    fontFamily: theme.fonts.hanken.bold,
    color: '#006e2f',
  },
  notifBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.hanken.bold,
    color: '#131b2e',
    marginBottom: 12,
  },
  questCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    overflow: 'hidden',
  },
  questImageWrapper: {
    width: '100%',
    height: 180,
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
  },
  questRewardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  questInfo: {
    width: '100%',
    padding: 16,
  },
  limitedLabel: {
    fontSize: 10,
    fontFamily: theme.fonts.manrope.semibold,
    color: '#22c55e',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  questName: {
    fontSize: 20,
    fontFamily: theme.fonts.hanken.bold,
    color: '#131b2e',
    marginBottom: 6,
  },
  questDesc: {
    fontSize: 13,
    fontFamily: theme.fonts.manrope.regular,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressStepsText: {
    fontSize: 12,
    fontFamily: theme.fonts.manrope.medium,
    color: '#4b5563',
  },
  progressPctText: {
    fontSize: 16,
    fontFamily: theme.fonts.hanken.bold,
    color: '#22c55e',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 3,
  },
  claimBtn: {
    backgroundColor: '#22c55e',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  claimBtnText: {
    color: '#ffffff',
    fontFamily: theme.fonts.manrope.semibold,
    fontSize: 14,
  },
  detailsBtn: {
    backgroundColor: '#22c55e',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  detailsBtnText: {
    color: '#ffffff',
    fontFamily: theme.fonts.manrope.semibold,
    fontSize: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 13,
    color: '#22c55e',
    fontFamily: theme.fonts.manrope.semibold,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '47%',
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 16,
  },
  lockedBadgeCard: {
    opacity: 0.55,
  },
  badgeIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  badgeTitle: {
    fontSize: 13,
    fontFamily: theme.fonts.manrope.semibold,
    color: '#111827',
    marginBottom: 2,
    textAlign: 'center',
  },
  badgeSub: {
    fontSize: 11,
    fontFamily: theme.fonts.manrope.regular,
    color: '#6b7280',
    textAlign: 'center',
  },
  claimedList: {
    gap: 10,
  },
  rewardRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
  },
  rewardImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    objectFit: 'contain',
  },
  rewardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  rewardTitle: {
    fontSize: 14,
    fontFamily: theme.fonts.manrope.semibold,
    color: '#111827',
  },
  rewardDate: {
    fontSize: 11,
    fontFamily: theme.fonts.manrope.regular,
    color: '#6b7280',
    marginTop: 2,
  },
  carouselContainer: {
    paddingLeft: 20,
    paddingRight: 6,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: theme.fonts.manrope.regular,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 27, 46, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#131b2e',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 14,
    fontFamily: theme.fonts.hanken.bold,
    color: '#9ca3af',
  },
  badgeDetailContent: {
    alignItems: 'center',
    width: '100%',
  },
  celebrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 110,
    width: '100%',
    marginBottom: 12,
  },
  confettiWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  star1: {
    position: 'absolute',
    top: 10,
    left: '20%',
  },
  star2: {
    position: 'absolute',
    top: 25,
    right: '25%',
  },
  star3: {
    position: 'absolute',
    bottom: 15,
    left: '25%',
  },
  star4: {
    position: 'absolute',
    bottom: 20,
    right: '20%',
  },
  victoryIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  victoryTitle: {
    fontSize: 13,
    fontFamily: theme.fonts.manrope.semibold,
    color: '#22c55e',
    letterSpacing: 3,
    marginBottom: 4,
  },
  victoryBadgeName: {
    fontSize: 24,
    fontFamily: theme.fonts.hanken.bold,
    color: '#111827',
    marginBottom: 2,
    textAlign: 'center',
  },
  badgeRequirementText: {
    fontSize: 13,
    fontFamily: theme.fonts.manrope.semibold,
    color: '#6b7280',
    marginBottom: 16,
  },
  victoryMessage: {
    fontSize: 14,
    fontFamily: theme.fonts.manrope.medium,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 6,
  },
  badgeGoalDesc: {
    fontSize: 13,
    fontFamily: theme.fonts.manrope.regular,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  achievementStatsContainer: {
    backgroundColor: '#f9fafb',
    width: '100%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  achievementStatsTitle: {
    fontSize: 10,
    fontFamily: theme.fonts.manrope.semibold,
    color: '#9ca3af',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  achievementStatsVal: {
    fontSize: 28,
    fontFamily: theme.fonts.hanken.bold,
    marginBottom: 4,
  },
  achievementStatsSub: {
    fontSize: 11,
    fontFamily: theme.fonts.manrope.regular,
    color: '#6b7280',
  },
  closeModalBtn: {
    height: 48,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  closeModalBtnText: {
    color: '#ffffff',
    fontFamily: theme.fonts.manrope.semibold,
    fontSize: 15,
  },
  lockedIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 13,
    fontFamily: theme.fonts.manrope.semibold,
    color: '#9ca3af',
    letterSpacing: 3,
    marginBottom: 4,
  },
  lockedBadgeName: {
    fontSize: 22,
    fontFamily: theme.fonts.hanken.bold,
    color: '#374151',
    marginBottom: 2,
    textAlign: 'center',
  },
  lockedMessage: {
    fontSize: 13,
    fontFamily: theme.fonts.manrope.medium,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 6,
  },
  badgeGoalDescLocked: {
    fontSize: 12,
    fontFamily: theme.fonts.manrope.regular,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  remainingProgressText: {
    fontSize: 12,
    fontFamily: theme.fonts.manrope.medium,
    color: '#ef4444',
    marginTop: 10,
    marginBottom: 24,
  },
  closeModalBtnLocked: {
    height: 48,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  closeModalBtnTextLocked: {
    color: '#4b5563',
    fontFamily: theme.fonts.manrope.semibold,
    fontSize: 15,
  },

});
