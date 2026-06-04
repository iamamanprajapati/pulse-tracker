import React from 'react';
import { StyleSheet, TouchableOpacity, View, Platform, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

export type TabType = 'home' | 'ranks' | 'prizes' | 'me';

interface FloatingNavProps {
  activeTab: TabType;
  onTabPress: (tab: TabType) => void;
}

export const FloatingNav: React.FC<FloatingNavProps> = ({ activeTab, onTabPress }) => {
  const tabs: { key: TabType; icon: keyof typeof MaterialIcons.glyphMap; label: string }[] = [
    { key: 'home', icon: 'grid-view', label: 'Dash' },
    { key: 'ranks', icon: 'leaderboard', label: 'Ranks' },
    { key: 'prizes', icon: 'emoji-events', label: 'Prizes' },
    { key: 'me', icon: 'person', label: 'Me' }
  ];

  const renderContent = () => (
    <View style={styles.navContainer}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.navColumn}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.8}
          >
            <View style={[
              styles.iconContainer,
              isActive ? styles.activeIconContainer : null
            ]}>
              <MaterialIcons
                name={tab.icon}
                size={22}
                color={isActive ? '#22c55e' : '#6b7280'}
              />
            </View>

          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (Platform.OS === 'ios' || Platform.OS === 'web') {
    return (
      <View style={styles.outerContainer}>
        <View style={styles.borderWrapper}>
          <BlurView intensity={75} tint="light" style={styles.blurContainer}>
            {renderContent()}
          </BlurView>
        </View>
      </View>
    );
  }

  // Android fallback
  return (
    <View style={styles.outerContainer}>
      <View style={[styles.borderWrapper, styles.androidFallback]}>
        {renderContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    alignSelf: 'center',
    maxWidth: 420,
    elevation: 8,
    shadowColor: '#131b2e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  borderWrapper: {
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    overflow: 'hidden',
  },
  blurContainer: {
    overflow: 'hidden',
  },
  androidFallback: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 64,
  },
  navColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconContainer: {
    width: 54,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  activeIconContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)', // Very light green background
    borderRadius: 12,
  },
  labelText: {
    fontSize: 10,
    fontFamily: theme.fonts.manrope.medium,
    marginTop: 2,
  },
  activeLabel: {
    color: '#22c55e',
    fontFamily: theme.fonts.manrope.semibold,
  },
  inactiveLabel: {
    color: '#6b7280',
  }
});
