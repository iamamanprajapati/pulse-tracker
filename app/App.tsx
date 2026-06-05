import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator, StatusBar, SafeAreaView } from 'react-native';
import { 
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold 
} from '@expo-google-fonts/manrope';
import {
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold
} from '@expo-google-fonts/hanken-grotesk';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { InsightsScreen } from './src/screens/InsightsScreen';
import { RankingsScreen } from './src/screens/RankingsScreen';
import { PrizesScreen } from './src/screens/PrizesScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { FloatingNav, TabType } from './src/components/FloatingNav';

const MainAppNavigator: React.FC = () => {
  const { token, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showInsights, setShowInsights] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#006e2f" />
      </View>
    );
  }

  // Auth flow routing
  if (!token) {
    if (showOnboarding) {
      return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;
    }
    return <LoginScreen />;
  }

  // Main app tab routing
  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        if (showInsights) {
          return <InsightsScreen onBack={() => setShowInsights(false)} />;
        }
        return <DashboardScreen onViewInsights={() => setShowInsights(true)} />;
      case 'ranks':
        return <RankingsScreen />;
      case 'prizes':
        return <PrizesScreen />;
      case 'me':
        if (isEditingProfile) {
          return <EditProfileScreen onBack={() => setIsEditingProfile(false)} />;
        }
        return <ProfileScreen onEditProfile={() => setIsEditingProfile(true)} />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />
      
      {/* Active Screen */}
      <View style={styles.screenWrapper}>
        {renderScreen()}
      </View>

      {/* Floating Navigation Pill */}
      {!isEditingProfile && (
        <FloatingNav activeTab={activeTab} onTabPress={(tab) => {
          setActiveTab(tab);
          setShowInsights(false);
          setIsEditingProfile(false); // Reset profile edit state if navigating away
        }} />
      )}
    </SafeAreaView>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#006e2f" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <MainAppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#faf8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#faf8ff',
  },
  screenWrapper: {
    flex: 1,
  }
});
