import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { styles } from './SettingScreen.styles';


export function SettingsScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Settings</Text>

        <Text style={styles.sectionTitle}>Data & Storage</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuButtonIcon}>🗑️</Text>
          <Text style={styles.menuButtonText}>Clear Cache/Reset</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>App</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuButtonIcon}>🎨</Text>
          <Text style={styles.menuButtonText}>Appearance</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuButtonIcon}>🔔</Text>
          <Text style={styles.menuButtonText}>Notification</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
