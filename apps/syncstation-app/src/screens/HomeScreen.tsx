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

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hoolsy Consumer App</Text>
      <Text style={styles.subtitle}>Welcome to the home screen</Text>
      <Text style={styles.description}>
        This is a placeholder for the Consumer App MVP. Students will build subject browsing,
        timeline sync, and shopping features here.
      </Text>
    </View>
  );
}
