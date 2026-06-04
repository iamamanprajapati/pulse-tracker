import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, ActivityIndicator, TouchableOpacity, Alert, Platform, Dimensions, FlatList, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

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
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPrizesData = async () => {
    try {
      const [questsRes, rewardsRes] = await Promise.all([
        api.get('/quests'),
        api.get('/rewards')
      ]);
      setQuests(questsRes.data);
      setClaimedRewards(rewardsRes.data);
    } catch (err) {
      console.warn('Prizes: Fallback to mock quest data', err);
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

  const badgesList = [
    { key: 'Swift Starter', title: 'Swift Starter', sub: '5km Run', icon: 'bolt' as const, color: '#22c55e' },
    { key: 'Calorie Burner', title: 'Calorie Burner', sub: '500 kcal', icon: 'local-fire-department' as const, color: '#ec4899' },
    { key: 'Peak Performer', title: 'Peak Performer', sub: 'Locked', icon: 'terrain' as const, color: '#9ca3af' },
    { key: '7-Day Streak', title: '7-Day Streak', sub: 'Legendary', icon: 'stars' as const, color: '#22c55e' }
  ];

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

        {/* Active Quest Section */}
        {/* Active Quests Section (Carousel) */}
        {activeQuests.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Quests ({activeQuests.length})</Text>
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
                          <Text style={[styles.limitedLabel, { color: theme.colors.primary }]}>SYSTEM QUEST</Text>
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
                          onPress={() => Alert.alert('Quest Details', `Accumulate ${(item.targetSteps - item.currentSteps).toLocaleString()} more steps to complete this quest.`)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.detailsBtnText}>View Quest Details</Text>
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
            <Text style={styles.sectionTitle}>Active Quests</Text>
            <View style={styles.questCard}>
              <MaterialIcons name="emoji-events" size={48} color="#9ca3af" style={{ marginBottom: 12 }} />
              <Text style={[styles.questName, { textAlign: 'center', marginBottom: 4 }]}>All Quests Completed!</Text>
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
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.badgesGrid}>
            {badgesList.map((badge) => {
              const isLocked = badge.sub === 'Locked';
              return (
                <View 
                  key={badge.key} 
                  style={[
                    styles.badgeCard,
                    isLocked && styles.lockedBadgeCard
                  ]}
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
                    {badge.sub}
                  </Text>
                </View>
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
    padding: 16,
    alignItems: 'center',
  },
  questImageWrapper: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 16,
  },
  questRewardImage: {
    width: 140,
    height: 140,
    objectFit: 'contain',
  },
  questInfo: {
    width: '100%',
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
  }
});
