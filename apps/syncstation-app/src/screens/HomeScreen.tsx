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

export function ProjectsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Projects</Text>
      <Text style={styles.subtitle}>Select a project to start logging</Text>
      <Text style={styles.description}>
        This is a placeholder for the Syncstation MVP. Students will build project browsing,
        content node selection, and on-set logging features here.
      </Text>
    </View>
  );
}

// Backward compatibility
export { ProjectsScreen as HomeScreen };
