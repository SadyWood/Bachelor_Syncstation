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

export function LogEntryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Log Entry</Text>
      <Text style={styles.subtitle}>Create a new on-set log entry</Text>
      <Text style={styles.description}>
        Log events, notes, and observations. Attach photos, videos, and files.
        Works offline and syncs when connection is available.
      </Text>
    </View>
  );
}

// Backward compatibility
export { LogEntryScreen as ExploreScreen };
