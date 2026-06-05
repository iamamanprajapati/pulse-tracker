import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, ActivityIndicator, TouchableOpacity, Platform, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { GlassCard } from '../components/GlassCard';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface AthleteRank {
  id: string;
  name: string;
  photoUrl: string;
  level: number;
  points: number;
  shift: number;
  rank: number;
  isCurrentUser: boolean;
  shiftType?: 'up' | 'down' | 'none';
}

export const RankingsScreen: React.FC = () => {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<AthleteRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRankings = async () => {
    try {
      const res = await api.get('/leaderboard');
      if (res.data && res.data.length > 0) {
        setRankings(res.data);
      } else {
        setRankings([]);
      }
    } catch (err) {
      console.warn('Rankings: Failed to fetch leaderboard data', err);
      setRankings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchRankings();
    } catch (err) {
      console.warn('Rankings refresh failed', err);
    } finally {
      setRefreshing(false);
    }
  };

  const formatPoints = (pts: number) => {
    if (pts >= 1000) {
      return (pts / 1000).toFixed(1) + 'k';
    }
    return pts.toString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const topThree = rankings.slice(0, 3);
  const restAthletes = rankings.slice(3);

  // Re-order podium: 2nd place (left), 1st place (center), 3rd place (right)
  const podiumList = [topThree[1], topThree[0], topThree[2]];

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
            <View>
              <Text style={styles.profileGreeting}>PulseTrack</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <MaterialIcons name="notifications-none" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Global Leaderboard</Text>
          <Text style={styles.subTitle}>Top performers this month across the globe.</Text>
        </View>

        {/* Podium/Top 3 Section */}
        <View style={styles.podiumRow}>
          {podiumList.map((athlete, idx) => {
            if (!athlete) return null;
            const isFirst = athlete.rank === 1;
            const isSecond = athlete.rank === 2;
            const isThird = athlete.rank === 3;
            
            let rankColor = '#ffd700';
            if (isSecond) rankColor = '#3b82f6';
            if (isThird) rankColor = '#ec4899';

            return (
              <View 
                key={athlete.id} 
                style={[
                  styles.podiumCol,
                  isFirst ? styles.podiumColFirst : styles.podiumColSide
                ]}
              >
                <View style={styles.avatarWrapper}>
                  {isFirst && (
                    <MaterialIcons name="workspace-premium" size={26} color="#ffd700" style={styles.crownIcon} />
                  )}
                  <Image 
                    source={{ uri: athlete.photoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80' }} 
                    style={[
                      styles.podiumAvatar, 
                      { borderColor: rankColor },
                      isFirst ? styles.firstAvatarSize : styles.sideAvatarSize
                    ]} 
                  />
                  <View style={[styles.rankTag, { backgroundColor: rankColor }]}>
                    <Text style={styles.rankTagText}>{athlete.rank}</Text>
                  </View>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>{athlete.name}</Text>
                <Text style={[styles.podiumScore, { color: isFirst ? '#22c55e' : '#6b7280' }]}>
                  {formatPoints(athlete.points)} pts
                </Text>
              </View>
            );
          })}
        </View>

        {/* List of Remaining Competitors */}
        <View style={styles.listContainer}>
          {restAthletes.map((athlete) => {
            const isYou = athlete.isCurrentUser;
            const isUp = athlete.shiftType === 'up' || athlete.shift > 0;
            const isDown = athlete.shiftType === 'down';
            
            return (
              <View 
                key={athlete.id} 
                style={[
                  styles.rankRow,
                  isYou && styles.youRowHighlight
                ]}
              >
                {/* Rank Number */}
                <Text style={styles.rankNumberText}>{athlete.rank}</Text>

                {/* Avatar Photo */}
                <Image source={{ uri: athlete.photoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80' }} style={styles.athleteAvatar} />

                {/* Athlete Name and Level Info */}
                <View style={styles.athleteInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.athleteName}>{athlete.name}</Text>
                    {isYou && (
                      <View style={styles.youBadge}>
                        <Text style={styles.youBadgeText}>YOU</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.athletePoints}>{athlete.points.toLocaleString()} points</Text>
                </View>

                {/* Shift Index */}
                <View style={styles.shiftContainer}>
                  {isUp && (
                    <View style={styles.shiftRow}>
                      <MaterialIcons name="call-made" size={14} color="#22c55e" />
                      <Text style={[styles.shiftText, { color: '#22c55e' }]}>+{athlete.shift}</Text>
                    </View>
                  )}
                  {isDown && (
                    <View style={styles.shiftRow}>
                      <MaterialIcons name="call-received" size={14} color="#ef4444" />
                      <Text style={[styles.shiftText, { color: '#ef4444' }]}>-{athlete.shift}</Text>
                    </View>
                  )}
                  {!isUp && !isDown && (
                    <View style={styles.shiftRow}>
                      <MaterialIcons name="remove" size={14} color="#9ca3af" />
                      <Text style={[styles.shiftText, { color: '#9ca3af' }]}>0</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
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
  titleSection: {
    marginVertical: 16,
  },
  mainTitle: {
    fontSize: 24,
    fontFamily: theme.fonts.hanken.bold,
    color: '#131b2e',
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 13,
    fontFamily: theme.fonts.manrope.medium,
    color: '#6b7280',
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginBottom: 24,
    backgroundColor: '#ffffff',
  },
  podiumCol: {
    alignItems: 'center',
    width: '30%',
  },
  podiumColFirst: {
    bottom: 12,
  },
  podiumColSide: {},
  avatarWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  podiumAvatar: {
    borderRadius: 9999,
    borderWidth: 2,
  },
  firstAvatarSize: {
    width: 76,
    height: 76,
  },
  sideAvatarSize: {
    width: 58,
    height: 58,
  },
  crownIcon: {
    position: 'absolute',
    top: -22,
    zIndex: 10,
  },
  rankTag: {
    position: 'absolute',
    bottom: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  rankTagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  podiumName: {
    fontSize: 13,
    fontFamily: theme.fonts.manrope.semibold,
    color: '#1f2937',
    marginBottom: 2,
    textAlign: 'center',
  },
  podiumScore: {
    fontSize: 11,
    fontFamily: theme.fonts.manrope.medium,
    fontWeight: 'bold',
  },
  listContainer: {
    gap: 8,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    height: 64,
  },
  youRowHighlight: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  rankNumberText: {
    fontSize: 15,
    fontFamily: theme.fonts.manrope.semibold,
    color: '#4b5563',
    width: 24,
  },
  athleteAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 8,
  },
  athleteInfo: {
    flex: 1,
    marginLeft: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  athleteName: {
    fontSize: 14,
    fontFamily: theme.fonts.manrope.semibold,
    color: '#111827',
  },
  youBadge: {
    backgroundColor: '#22c55e',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  youBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  athletePoints: {
    fontSize: 11,
    fontFamily: theme.fonts.manrope.regular,
    color: '#6b7280',
    marginTop: 1,
  },
  shiftContainer: {
    width: 52,
    alignItems: 'flex-end',
  },
  shiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  shiftText: {
    fontSize: 11,
    fontFamily: theme.fonts.manrope.semibold,
  }
});
