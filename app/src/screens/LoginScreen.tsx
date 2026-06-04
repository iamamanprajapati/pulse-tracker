import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, Image, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const tokenPayload = {
        token: 'mock-google-token',
        mockEmail: 'alex@pulsetrack.com',
        mockName: 'Alex Henderson',
        mockPhoto: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVWf_EgZ3ed05m---xLADr8lrRgvXEJk0hUfWx4YJ3Qk1LyBlK4PxAdPKtNlZzkBRkDpUz-v1OnJ3iVD9w0IxLzCd5k7iBZWKDspsxsCSPwdsFWj1YqUeEytEbvbxmdNdo2sqgzrj9WCD0O9WxbFKubtW8uUQL6NcRZwHemHa7hvjvMeRoEgmD3pbTrovkskbo-wcX_25tlFYAaZcI6DHoLGpP136JuRzqQtPbtrej-0mmZz4HLXUU0pRnJAps_tKhCZJGvxVOGInu',
      };

      const response = await api.post('/auth/google', tokenPayload);
      const { token, user } = response.data;
      await login(token, user);
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      setErrorMsg('Authentication connection failed. Please ensure backend server is active.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await api.post('/auth/google', {
        token: 'mock-google-token',
        mockEmail: 'guest_athlete@pulsetrack.com',
        mockName: 'Guest Athlete',
        mockPhoto: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVWf_EgZ3ed05m---xLADr8lrRgvXEJk0hUfWx4YJ3Qk1LyBlK4PxAdPKtNlZzkBRkDpUz-v1OnJ3iVD9w0IxLzCd5k7iBZWKDspsxsCSPwdsFWj1YqUeEytEbvbxmdNdo2sqgzrj9WCD0O9WxbFKubtW8uUQL6NcRZwHemHa7hvjvMeRoEgmD3pbTrovkskbo-wcX_25tlFYAaZcI6DHoLGpP136JuRzqQtPbtrej-0mmZz4HLXUU0pRnJAps_tKhCZJGvxVOGInu'
      });
      const { token, user } = response.data;
      await login(token, user);
    } catch (err) {
      console.error('Guest login failed:', err);
      setErrorMsg('Failed to log in as guest. Please make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Dark sports aesthetic background with neon tracking curves overlay */}
      <View style={styles.darkBackgroundOverlay} />
      <View style={styles.neonTrackCurve} />
      <View style={styles.neonTrackCurveSecond} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <MaterialIcons name="bolt" size={32} color="#22c55e" />
            <Text style={styles.logoText}>PULSETRACK</Text>
          </View>
        </View>

        {/* Center Content Card */}
        <View style={styles.centerContainer}>
          <View style={styles.authCard}>
            <Text style={styles.cardTitle}>Fuel Your Ambition</Text>
            <Text style={styles.cardSubtitle}>
              The next generation of high-performance health tracking.
            </Text>

            {errorMsg && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Google Continue button */}
            <TouchableOpacity 
              style={styles.googleBtn} 
              onPress={handleGoogleSignIn}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#111827" />
              ) : (
                <>
                  <Image 
                    source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg' }} 
                    style={styles.googleIcon} 
                  />
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.orText}>or</Text>

            {/* PulseID button */}
            <TouchableOpacity 
              style={styles.pulseIdBtn} 
              onPress={handleGoogleSignIn}
              activeOpacity={0.85}
            >
              <Text style={styles.pulseIdBtnText}>Sign in with PulseID</Text>
            </TouchableOpacity>

            {/* Explore Guest link */}
            <TouchableOpacity 
              style={styles.guestLink} 
              onPress={handleGuestLogin}
            >
              <Text style={styles.guestLinkText}>Explore as Guest</Text>
              <MaterialIcons name="arrow-forward" size={14} color="#a1a1aa" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer legal text */}
        <View style={styles.footer}>
          <Text style={styles.footerLinkText}>Terms of Service</Text>
          <Text style={styles.footerDot}>•</Text>
          <Text style={styles.footerLinkText}>Privacy Policy</Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b', // Pitch dark
  },
  darkBackgroundOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  neonTrackCurve: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 450,
    height: 450,
    borderRadius: 225,
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.15)', // green neon track line
  },
  neonTrackCurveSecond: {
    position: 'absolute',
    bottom: -130,
    right: -80,
    width: 450,
    height: 450,
    borderRadius: 225,
    borderWidth: 1,
    borderColor: 'rgba(33, 112, 228, 0.15)', // blue neon track line
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 64,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 24,
    fontFamily: theme.fonts.hanken.bold,
    letterSpacing: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingBottom: 20,
  },
  authCard: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontFamily: theme.fonts.hanken.bold,
    textAlign: 'center',
    marginBottom: 10,
  },
  cardSubtitle: {
    color: '#a1a1aa',
    fontSize: 14,
    fontFamily: theme.fonts.manrope.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
    paddingHorizontal: 16,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    width: '100%',
    height: 52,
    borderRadius: 26, // Pill shape
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 16,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleBtnText: {
    color: '#18181b',
    fontSize: 15,
    fontFamily: theme.fonts.manrope.semibold,
  },
  orText: {
    color: '#71717a',
    fontSize: 13,
    fontFamily: theme.fonts.manrope.medium,
    marginVertical: 12,
  },
  pulseIdBtn: {
    backgroundColor: '#22c55e', // Vibrant Kinetic Green
    width: '100%',
    height: 52,
    borderRadius: 26, // Pill shape
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  pulseIdBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: theme.fonts.manrope.semibold,
  },
  guestLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  guestLinkText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontFamily: theme.fonts.manrope.semibold,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 20,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    fontFamily: theme.fonts.manrope.medium,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  footerLinkText: {
    color: '#71717a',
    fontSize: 11,
    fontFamily: theme.fonts.manrope.regular,
  },
  footerDot: {
    color: '#52525b',
    fontSize: 10,
  }
});
