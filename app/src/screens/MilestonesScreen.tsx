import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

interface MilestoneItem {
  key: string;
  title: string;
  requirement: string;
  progressDesc: string;
  isUnlocked: boolean;
  currentVal: number;
  targetVal: number;
  unit: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
}

interface MilestonesScreenProps {
  allMilestones: MilestoneItem[];
  onBack: () => void;
  onPressBadge: (badge: MilestoneItem) => void;
}

export const MilestonesScreen: React.FC<MilestonesScreenProps> = ({ allMilestones, onBack, onPressBadge }) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color="#131b2e" />
        </TouchableOpacity>
      </View>

      {/* Grid of 20 Badges */}
      <FlatList
        data={allMilestones}
        numColumns={2}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.subTitle}>ATHLETE MILESTONES</Text>
            <Text style={styles.mainTitle}>Milestones Gallery</Text>
            
            <View style={styles.intro}>
              <Text style={styles.introText}>
                Conquer challenges, burn calories, and build healthy step habits to unlock all 20 unique milestone badges!
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const isLocked = !item.isUnlocked;
          const subText = isLocked ? 'Locked' : item.requirement;

          return (
            <TouchableOpacity 
              style={[
                styles.badgeCard,
                isLocked && styles.lockedBadgeCard
              ]}
              onPress={() => onPressBadge(item)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.badgeIconWrapper,
                { backgroundColor: isLocked ? '#f3f4f6' : `${item.color}15` }
              ]}>
                <MaterialIcons name={item.icon} size={28} color={isLocked ? '#9ca3af' : item.color} />
              </View>
              <Text style={styles.badgeTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.badgeSub} numberOfLines={1}>
                {subText}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 36,
    paddingBottom: 6,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listHeader: {
    paddingHorizontal: 6,
    paddingTop: 10,
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
    marginBottom: 16,
  },
  intro: {
    padding: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  introText: {
    fontSize: 12,
    fontFamily: theme.fonts.manrope.medium,
    color: '#6b7280',
    lineHeight: 18,
    textAlign: 'center',
  },
  gridContainer: {
    paddingHorizontal: 10,
    paddingTop: 0,
    paddingBottom: 40,
  },
  badgeCard: {
    flex: 1,
    marginHorizontal: 6,
    marginBottom: 12,
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
});
