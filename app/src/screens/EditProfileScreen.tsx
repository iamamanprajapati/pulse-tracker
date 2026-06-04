import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, SafeAreaView, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface EditProfileScreenProps {
  onBack: () => void;
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ onBack }) => {
  const { user, updateUserProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [dailyStepGoal, setDailyStepGoal] = useState(user?.dailyStepGoal?.toString() || '10000');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty.');
      return;
    }

    const goalNum = parseInt(dailyStepGoal);
    if (isNaN(goalNum) || goalNum < 1000 || goalNum > 100000) {
      Alert.alert('Validation Error', 'Daily Step Goal must be an integer between 1,000 and 100,000.');
      return;
    }

    setSaving(true);
    try {
      const response = await api.put('/user/profile', {
        name: name.trim(),
        dailyStepGoal: goalNum
      });

      // Update global context profile state
      updateUserProfile({
        name: response.data.name,
        dailyStepGoal: response.data.dailyStepGoal
      });

      Alert.alert('Success', 'Athlete profile updated successfully!', [
        { text: 'OK', onPress: onBack }
      ]);
    } catch (err: any) {
      console.error('Failed to update user profile:', err);
      const errors = err.response?.data?.errors;
      const errorMsg = errors && errors.length > 0 ? errors[0].msg : (err.response?.data?.message || 'Failed to connect to profile editor.');
      Alert.alert('Error', errorMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header Navigation */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <MaterialIcons name="chevron-left" size={28} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.placeholderBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <GlassCard style={styles.formCard}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Athlete Name</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Full Name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Daily Step Goal</Text>
              <TextInput
                style={styles.textInput}
                value={dailyStepGoal}
                onChangeText={setDailyStepGoal}
                placeholder="e.g. 10000"
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.colors.primaryContainer }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color={theme.colors.onPrimary} />
              ) : (
                <Text style={styles.saveBtnText}>Save Profile Settings</Text>
              )}
            </TouchableOpacity>
          </GlassCard>
        </ScrollView>

      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8ff',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.mobileMargin,
    paddingTop: 16,
    height: 60,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.hanken.bold,
    color: theme.colors.onBackground,
  },
  placeholderBtn: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.mobileMargin,
    paddingTop: 16,
  },
  formCard: {
    padding: theme.spacing.cardPadding,
    gap: 20,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: theme.fonts.manrope.medium,
    color: theme.colors.onSurfaceVariant,
    opacity: 0.8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#bccbb9',
    borderRadius: theme.borderRadius.md,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: theme.fonts.manrope.regular,
    backgroundColor: '#ffffff',
  },
  saveBtn: {
    height: 50,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#131b2e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    color: theme.colors.onPrimary,
    fontFamily: theme.fonts.manrope.semibold,
    fontSize: 14,
  }
});
