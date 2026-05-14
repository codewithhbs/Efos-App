import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../utils/dummyData';

// ======================== LOADER COMPONENT ========================
export const Loader = ({
  size = 'large',
  color = COLORS.primary,
  message = 'Loading...',
}) => {
  return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.loaderText}>{message}</Text>}
    </View>
  );
};

// ======================== AUTH WARNING COMPONENT ========================
export const AuthWarn = ({
  title = 'Authentication Required',
  message = 'Please sign in to continue',
  onLoginPress,
}) => {
  return (
    <View style={styles.warnContainer}>
      <View style={styles.iconContainer}>
        <Text style={styles.warningIcon}>⚠️</Text>
      </View>

      <Text style={styles.warnTitle}>{title}</Text>
      <Text style={styles.warnMessage}>{message}</Text>

      {onLoginPress && (
        <TouchableOpacity onPress={onLoginPress} activeOpacity={0.7}>
          <Text style={styles.loginLink}>Sign in now →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ======================== STYLES ========================
const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg || '#f8f9fa',
    padding: 20,
  },

  loaderText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary || '#666',
    fontWeight: '500',
  },

  // Auth Warning Styles
  warnContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg || '#f8f9fa',
    paddingHorizontal: 40,
  },

  iconContainer: {
    marginBottom: 24,
  },

  warningIcon: {
    fontSize: 68,
  },

  warnTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text || '#333',
    textAlign: 'center',
    marginBottom: 12,
  },

  warnMessage: {
    fontSize: 15,
    color: COLORS.textSecondary || '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },

  loginLink: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});
