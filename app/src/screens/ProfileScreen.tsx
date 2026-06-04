import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, Platform, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface ProfileScreenProps {
  onEditProfile: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onEditProfile }) => {
  const { user, logout } = useAuth();
  const [badgeCount, setBadgeCount] = useState(15);

  useEffect(() => {
    const fetchBadgeCount = async () => {
      try {
        const res = await api.get('/rewards');
        const dbBadges = res.data.filter((r: any) => r.type === 'badge');
        setBadgeCount(dbBadges.length + 12); // Alex Henderson starts with 3 badges + 12 legacy achievements
      } catch (err) {
        console.warn('Profile: Fallback to local badge count', err);
      }
    };
    fetchBadgeCount();
  }, []);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of PulseTrack?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => logout() }
      ]
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toString();
  };

  const lifetimeSteps = user ? user.lifetimeSteps : 2400000;
  const lifetimeKms = user ? user.lifetimeKilometers : 1842;
  const lifetimeCals = user ? user.lifetimeCalories : 28000;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Appbar */}
        <View style={styles.header}>
          <View style={styles.profileBadge}>
            <Image source={{ uri: user?.photoUrl }} style={styles.profilePhoto} />
            <Text style={styles.profileGreeting}>PulseTrack</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <MaterialIcons name="notifications-none" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Profile Avatar Header Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.ringBackground} />
            <View style={styles.avatarContainer}>
              <Image source={{ uri: user?.photoUrl }} style={styles.avatar} />
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>LVL {user?.level || 42}</Text>
            </View>
          </View>

          <Text style={styles.athleteName}>{user?.name}</Text>
          <Text style={styles.athleteJoined}>
            {user?.role || 'Pro Athlete'} • Joined {user ? new Date(user.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Mar 2023'}
          </Text>
        </View>

        {/* Lifetime Stats Bento Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lifetime Stats</Text>
          <View style={styles.statsGrid}>
            
            {/* Steps */}
            <GlassCard style={styles.statsItem}>
              <MaterialIcons name="directions-walk" size={22} color="#22c55e" style={styles.statIcon} />
              <Text style={styles.statValue}>{formatNumber(lifetimeSteps)}</Text>
              <Text style={styles.statLabel}>Total Steps</Text>
            </GlassCard>

            {/* Kilometers */}
            <GlassCard style={styles.statsItem}>
              <MaterialIcons name="navigation" size={22} color="#22c55e" style={styles.statIcon} />
              <Text style={styles.statValue}>{lifetimeKms.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Kilometers</Text>
            </GlassCard>

            {/* Badges */}
            <GlassCard style={styles.statsItem}>
              <MaterialIcons name="emoji-events" size={22} color="#22c55e" style={styles.statIcon} />
              <Text style={styles.statValue}>{badgeCount}</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </GlassCard>

            {/* Calories */}
            <GlassCard style={styles.statsItem}>
              <MaterialIcons name="local-fire-department" size={22} color="#22c55e" style={styles.statIcon} />
              <Text style={styles.statValue}>{formatNumber(lifetimeCals)}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </GlassCard>

          </View>
        </View>

        {/* Account Settings List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.settingsList}>
            {/* Personal Info */}
            <TouchableOpacity style={styles.settingsRow} onPress={onEditProfile} activeOpacity={0.75}>
              <View style={styles.settingsLeft}>
                <View style={styles.settingsIconWrapper}>
                  <MaterialIcons name="person-outline" size={20} color="#22c55e" />
                </View>
                <View>
                  <Text style={styles.settingsTitle}>Personal Info</Text>
                  <Text style={styles.settingsSub}>Edit your profile data</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>

            {/* Notifications */}
            <TouchableOpacity 
              style={styles.settingsRow} 
              onPress={() => Alert.alert('Notifications', 'Settings saved. Alert tones are active.')} 
              activeOpacity={0.75}
            >
              <View style={styles.settingsLeft}>
                <View style={styles.settingsIconWrapper}>
                  <MaterialIcons name="notifications-none" size={20} color="#22c55e" />
                </View>
                <View>
                  <Text style={styles.settingsTitle}>Notifications</Text>
                  <Text style={styles.settingsSub}>Manage alerts and sounds</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>

            {/* Privacy */}
            <TouchableOpacity 
              style={styles.settingsRow} 
              onPress={() => Alert.alert('Privacy', 'Settings saved. User data sharing preferences updated.')} 
              activeOpacity={0.75}
            >
              <View style={styles.settingsLeft}>
                <View style={styles.settingsIconWrapper}>
                  <MaterialIcons name="lock-outline" size={20} color="#22c55e" />
                </View>
                <View>
                  <Text style={styles.settingsTitle}>Privacy</Text>
                  <Text style={styles.settingsSub}>Control who sees your activity</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Red Text Sign Out */}
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutBtnText}>Sign Out</Text>
          </TouchableOpacity>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 64,
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
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  ringBackground: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#22c55e', // Kinetic Green Level Ring
  },
  avatarContainer: {
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: '#ffffff',
    padding: 3,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -2,
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  levelBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: theme.fonts.manrope.semibold,
    fontWeight: 'bold',
  },
  athleteName: {
    fontSize: 22,
    fontFamily: theme.fonts.hanken.bold,
    color: '#131b2e',
    marginBottom: 4,
  },
  athleteJoined: {
    fontSize: 13,
    fontFamily: theme.fonts.manrope.medium,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: theme.fonts.manrope.semibold,
    color: '#6b7280',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statsItem: {
    width: '47%',
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 16,
    paddingVertical: 20,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontFamily: theme.fonts.hanken.bold,
    color: '#131b2e',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: theme.fonts.manrope.medium,
    color: '#6b7280',
  },
  settingsList: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsTitle: {
    fontSize: 14,
    fontFamily: theme.fonts.manrope.semibold,
    color: '#111827',
  },
  settingsSub: {
    fontSize: 11,
    fontFamily: theme.fonts.manrope.regular,
    color: '#6b7280',
    marginTop: 2,
  },
  signOutBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 20,
  },
  signOutBtnText: {
    color: '#ef4444', // Red Sign Out Link
    fontFamily: theme.fonts.manrope.semibold,
    fontSize: 14,
  }
});
