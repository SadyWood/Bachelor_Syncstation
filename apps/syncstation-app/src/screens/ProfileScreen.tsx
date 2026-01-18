import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    color: '#666',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    color: '#888',
    lineHeight: 20,
  },
});

export function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Sync Status & Account Settings</Text>
      <Text style={styles.description}>
        View sync queue, manage offline data, and configure your account settings.
      </Text>
    </View>
  );
}

// Backward compatibility
export { SettingsScreen as ProfileScreen };
