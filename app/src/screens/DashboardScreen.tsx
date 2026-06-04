import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal, TextInput, Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { GlassCard } from '../components/GlassCard';
import { ProgressRing } from '../components/ProgressRing';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface ActivityItem {
  _id: string;
  type: 'run' | 'gym' | 'swim' | 'walk' | 'cycle' | 'other';
  title: string;
  duration: number;
  steps: number;
  calories: number;
  distance: number;
  timestamp: string;
}

interface QuestItem {
  _id: string;
  title: string;
  description: string;
  targetSteps: number;
  currentSteps: number;
  isCompleted: boolean;
}

export const DashboardScreen: React.FC = () => {
  const { user, updateUserStats } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [quests, setQuests] = useState<QuestItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Log Activity Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [actTitle, setActTitle] = useState('');
  const [actType, setActType] = useState<'run' | 'gym' | 'swim' | 'walk' | 'cycle' | 'other'>('run');
  const [actDuration, setActDuration] = useState('30');
  const [actCalories, setActCalories] = useState('300');
  const [actSteps, setActSteps] = useState('2000');
  const [actDistance, setActDistance] = useState('2.0');
  const [loggingLoading, setLoggingLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [actRes, questRes] = await Promise.all([
        api.get('/activities'),
        api.get('/quests')
      ]);
      setActivities(actRes.data);
      setQuests(questRes.data);
    } catch (err) {
      console.warn('Dashboard: Failed to load data from server', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogActivity = async () => {
    if (!actTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for the activity.');
      return;
    }

    setLoggingLoading(true);
    try {
      const payload = {
        type: actType,
        title: actTitle.trim(),
        duration: parseInt(actDuration) || 0,
        calories: parseInt(actCalories) || 0,
        steps: actType === 'gym' || actType === 'swim' ? 0 : (parseInt(actSteps) || 0),
        distance: parseFloat(actDistance) || 0
      };

      const response = await api.post('/activities', payload);
      
      updateUserStats(response.data.user);
      
      setActTitle('');
      setModalVisible(false);
      await fetchDashboardData();
      
      Alert.alert('Success', 'Workout activity recorded!');
    } catch (err: any) {
      console.error('Failed to log activity:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit workout.');
    } finally {
      setLoggingLoading(false);
    }
  };

  const todaySteps = user ? Math.round(user.lifetimeSteps % user.dailyStepGoal) : 7542;
  const dailyGoal = user ? user.dailyStepGoal : 10000;
  const progressRatio = Math.min(1, todaySteps / dailyGoal);
  const progressPercentage = Math.round(progressRatio * 100);
  const remainingSteps = Math.max(0, dailyGoal - todaySteps);

  const getActivityIcon = (type: string): keyof typeof MaterialIcons.glyphMap => {
    switch (type) {
      case 'run': return 'directions-run';
      case 'gym': return 'fitness-center';
      case 'swim': return 'pool';
      case 'walk': return 'directions-walk';
      case 'cycle': return 'directions-bike';
      default: return 'bolt';
    }
  };

  const getThemeColor = (type: string) => {
    switch (type) {
      case 'run': return '#22c55e'; // Green
      case 'gym': return '#3b82f6'; // Blue
      case 'swim': return '#ec4899'; // Pink/Purple
      default: return '#22c55e';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
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

        {/* Daily Goal Ring Center Card */}
        <View style={styles.ringCardContainer}>
          <View style={styles.ringWrapper}>
            <ProgressRing size={160} strokeWidth={12} progress={progressRatio} gradientColors={['#22c55e', '#22c55e']} backgroundColor="#f3f4f6">
              <Text style={styles.ringPercentageText}>{progressPercentage}%</Text>
              <Text style={styles.ringLabelText}>Daily Goal</Text>
            </ProgressRing>
          </View>
          
          <View style={styles.ringMessageWrapper}>
            <Text style={styles.ringMessageTitle}>Crushing it, Alex!</Text>
            <Text style={styles.ringMessageSub}>
              You're only {remainingSteps.toLocaleString()} steps away from your daily streak target. Keep the momentum going!
            </Text>
          </View>

          <View style={styles.ringActionsRow}>
            <TouchableOpacity style={styles.solidActionBtn} activeOpacity={0.85}>
              <Text style={styles.solidActionBtnText}>View Insights</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineActionBtn} activeOpacity={0.85}>
              <Text style={styles.outlineActionBtnText}>Share Progress</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bento Grid Metrics */}
        <View style={styles.bentoGrid}>
          {/* Steps */}
          <GlassCard style={styles.bentoItem} solid={true}>
            <View style={[styles.bentoIconBox, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
              <MaterialIcons name="directions-walk" size={18} color="#22c55e" />
            </View>
            <Text style={styles.bentoLabel}>Steps</Text>
            <Text style={styles.bentoValue}>{todaySteps.toLocaleString()}</Text>
            <View style={styles.bentoProgressBarBg}>
              <View style={[styles.bentoProgressBarFill, { width: `${progressPercentage}%`, backgroundColor: '#22c55e' }]} />
            </View>
          </GlassCard>

          {/* Calories */}
          <GlassCard style={styles.bentoItem} solid={true}>
            <View style={[styles.bentoIconBox, { backgroundColor: 'rgba(236, 72, 153, 0.1)' }]}>
              <MaterialIcons name="local-fire-department" size={18} color="#ec4899" />
            </View>
            <Text style={styles.bentoLabel}>Calories</Text>
            <Text style={styles.bentoValue}>1,240 <Text style={styles.bentoUnit}>kcal</Text></Text>
            <View style={styles.bentoProgressBarBg}>
              <View style={[styles.bentoProgressBarFill, { width: '60%', backgroundColor: '#ec4899' }]} />
            </View>
          </GlassCard>

          {/* Active Minutes (Wide card) */}
          <GlassCard style={[styles.bentoItem, styles.wideBentoItem]} solid={true}>
            <View style={[styles.bentoIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <MaterialIcons name="bolt" size={18} color="#3b82f6" />
            </View>
            <Text style={styles.bentoLabel}>Active Minutes</Text>
            <Text style={styles.bentoValue}>45 <Text style={styles.bentoUnit}>mins</Text></Text>
            <View style={styles.bentoProgressBarBg}>
              <View style={[styles.bentoProgressBarFill, { width: '90%', backgroundColor: '#3b82f6' }]} />
            </View>
          </GlassCard>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityList}>
          {activities.length === 0 ? (
            <Text style={styles.emptyText}>No activities logged today.</Text>
          ) : (
            activities.map((act) => {
              const themeColor = getThemeColor(act.type);
              return (
                <GlassCard key={act._id} style={styles.activityItemCard}>
                  <View style={[styles.activityIconWrapper, { backgroundColor: `${themeColor}18` }]}>
                    <MaterialIcons name={getActivityIcon(act.type)} size={22} color={themeColor} />
                  </View>
                  <View style={styles.activityDetails}>
                    <Text style={styles.activityTitleText}>{act.title}</Text>
                    <Text style={styles.activityTimeText}>
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {act.distance > 0 ? `${act.distance} km` : `${act.duration} mins`}
                    </Text>
                  </View>
                  <Text style={[styles.activityCaloriesText, { color: themeColor }]}>
                    +{act.calories} kcal
                  </Text>
                </GlassCard>
              );
            })
          )}
        </View>

        {/* Tip Card */}
        <View style={styles.tipCardWrapper}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9oS-cw5QvqU5ZzIj7tfh0GcusFmvw_sgPEV18Y-U_s0-OrlUchQhc57tAYjRjW_epnp5U-jkiLOhA0YjXmvdXHYdud6AC1Wr_pX8sfpSlcRARrBDwxyMq4Scsm9fo0LHEcSKapKw5iPk3SNDuDYY8UXLtDYvyl8EZiQEEPCCrol-g5y-1gGQpepFCaLil7YjJaqYaR4NtDo6wPLclkbJSMstoS9FO64NdKYQ70KVn-anTRFv87mQkbwdR34xE_nXwOHvtR3W6qCwL' }} 
            style={styles.tipImage} 
          />
          <View style={styles.tipOverlay}>
            <Text style={styles.tipLabelText}>TIP OF THE DAY</Text>
            <Text style={styles.tipTitleText}>Master Your Post-Workout Recovery Flow</Text>
          </View>
        </View>

      </ScrollView>

      {/* Floating Action '+' Button to Log Workouts */}
      <TouchableOpacity 
        style={styles.floatingActionBtn} 
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <MaterialIcons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Log Activity Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Athlete Activity</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput 
                style={styles.textInput} 
                placeholder="e.g. Afternoon Power Run"
                value={actTitle} 
                onChangeText={setActTitle} 
              />

              <Text style={styles.inputLabel}>Workout Type</Text>
              <View style={styles.typeSelectorGrid}>
                {(['run', 'gym', 'swim', 'walk', 'cycle'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOptionBtn,
                      actType === type && [styles.typeOptionActive, { borderColor: '#22c55e' }]
                    ]}
                    onPress={() => setActType(type)}
                  >
                    <MaterialIcons name={getActivityIcon(type)} size={18} color={actType === type ? '#22c55e' : '#4b5563'} />
                    <Text style={[styles.typeOptionText, actType === type && styles.typeOptionTextActive]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Duration (mins)</Text>
                  <TextInput 
                    style={styles.numberInput} 
                    keyboardType="numeric"
                    value={actDuration} 
                    onChangeText={setActDuration} 
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Calories Burned (kcal)</Text>
                  <TextInput 
                    style={styles.numberInput} 
                    keyboardType="numeric"
                    value={actCalories} 
                    onChangeText={setActCalories} 
                  />
                </View>
              </View>

              {actType !== 'gym' && actType !== 'swim' && (
                <View style={styles.formRow}>
                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Steps Taken</Text>
                    <TextInput 
                      style={styles.numberInput} 
                      keyboardType="numeric"
                      value={actSteps} 
                      onChangeText={setActSteps} 
                    />
                  </View>
                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Distance (km)</Text>
                    <TextInput 
                      style={styles.numberInput} 
                      keyboardType="numeric"
                      value={actDistance} 
                      onChangeText={setActDistance} 
                    />
                  </View>
                </View>
              )}

              <TouchableOpacity 
                style={[styles.submitWorkoutBtn, { backgroundColor: '#22c55e' }]} 
                onPress={handleLogActivity}
                disabled={loggingLoading}
              >
                {loggingLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitWorkoutBtnText}>Record Activity</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Clean white background
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
    color: '#006e2f', // Brand Green
  },
  notifBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCardContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 24,
  },
  ringWrapper: {
    marginBottom: 20,
  },
  ringPercentageText: {
    fontSize: 32,
    fontFamily: theme.fonts.hanken.bold,
    color: '#131b2e',
  },
  ringLabelText: {
    fontSize: 11,
    fontFamily: theme.fonts.manrope.medium,
    color: '#6b7280',
  },
  ringMessageWrapper: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  ringMessageTitle: {
    fontSize: 20,
    fontFamily: theme.fonts.hanken.bold,
    color: '#131b2e',
    marginBottom: 6,
  },
  ringMessageSub: {
    fontSize: 13,
    fontFamily: theme.fonts.manrope.regular,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 20,
  },
  ringActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  solidActionBtn: {
    backgroundColor: '#22c55e',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: theme.fonts.manrope.semibold,
  },
  outlineActionBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineActionBtnText: {
    color: '#4b5563',
    fontSize: 13,
    fontFamily: theme.fonts.manrope.semibold,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  bentoItem: {
    width: '47%',
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 16,
  },
  wideBentoItem: {
    width: '100%',
  },
  bentoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  bentoLabel: {
    fontSize: 11,
    fontFamily: theme.fonts.manrope.medium,
    color: '#6b7280',
  },
  bentoValue: {
    fontSize: 20,
    fontFamily: theme.fonts.hanken.bold,
    color: '#131b2e',
    marginTop: 2,
  },
  bentoUnit: {
    fontSize: 12,
    fontFamily: theme.fonts.manrope.regular,
    color: '#6b7280',
    fontWeight: 'normal',
  },
  bentoProgressBarBg: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 10,
  },
  bentoProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.hanken.bold,
    color: '#131b2e',
  },
  viewAllText: {
    fontSize: 13,
    color: '#22c55e',
    fontFamily: theme.fonts.manrope.semibold,
  },
  activityList: {
    gap: 10,
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: theme.fonts.manrope.regular,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 12,
  },
  activityItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
  },
  activityIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityDetails: {
    flex: 1,
    marginLeft: 14,
  },
  activityTitleText: {
    fontSize: 14,
    fontFamily: theme.fonts.manrope.semibold,
    color: '#111827',
  },
  activityTimeText: {
    fontSize: 11,
    fontFamily: theme.fonts.manrope.regular,
    color: '#6b7280',
    marginTop: 2,
  },
  activityCaloriesText: {
    fontSize: 14,
    fontFamily: theme.fonts.manrope.semibold,
  },
  tipCardWrapper: {
    position: 'relative',
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  tipImage: {
    width: '100%',
    height: '100%',
  },
  tipOverlay: {
    position: 'absolute',
    inset: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  tipLabelText: {
    fontSize: 10,
    fontFamily: theme.fonts.manrope.semibold,
    color: '#22c55e',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  tipTitleText: {
    fontSize: 16,
    fontFamily: theme.fonts.hanken.semibold,
    color: '#ffffff',
    lineHeight: 22,
  },
  floatingActionBtn: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22c55e', // Vibrant green
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 99,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 27, 46, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    padding: 20,
    maxHeight: '90%',
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
    fontSize: 18,
    fontFamily: theme.fonts.hanken.bold,
    color: theme.colors.onBackground,
  },
  modalForm: {
    gap: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: theme.fonts.manrope.medium,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: theme.borderRadius.md,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: theme.fonts.manrope.regular,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: theme.borderRadius.md,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: theme.fonts.manrope.regular,
  },
  typeSelectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  typeOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: theme.borderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  typeOptionActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderWidth: 1.5,
  },
  typeOptionText: {
    fontSize: 12,
    fontFamily: theme.fonts.manrope.medium,
    color: '#4b5563',
  },
  typeOptionTextActive: {
    color: '#22c55e',
    fontWeight: 'bold',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formCol: {
    flex: 1,
  },
  submitWorkoutBtn: {
    height: 48,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitWorkoutBtnText: {
    color: '#ffffff',
    fontFamily: theme.fonts.manrope.semibold,
    fontSize: 15,
  }
});
