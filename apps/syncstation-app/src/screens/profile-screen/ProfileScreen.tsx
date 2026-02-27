import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { styles } from './ProfileScreen.styles';
import { useAuthStore } from '@/stores/authStore';

//bytte ut denne med data fra authStore senere!
const MOCK_USER = {
  name: 'Tom Blart',
  birthdate: '01.06.1992',
  email: 'Tom801@gmail.com',
  role: 'Makeup Artist',
};

export function ProfileScreen() {
  const logout = useAuthStore((s) => s.logout);

  function handleLogout() {
    logout();
  }

  return (
    <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.header}>Profile</Text>

              <View style={styles.profileCard}>
                <View style={styles.profileImageContainer}>
                  <View style={styles.profileImagePlaceholder}>
                  <Text>Profile Image</Text>
                </View>
              </View>


              <View style={styles.infoCard}>
            <Text style={styles.name}>{MOCK_USER.name}</Text>

                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>🎂</Text>
                  <Text style={styles.infoText}>{MOCK_USER.birthdate}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>📧</Text>
                  <Text style={styles.infoText}>{MOCK_USER.email}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>👤</Text>
                  <Text style={styles.infoText}>{MOCK_USER.role}</Text>
                  </View>
                </View>
              </View>

            <Text style={styles.sectionTitle}>Account</Text>
            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuButtonIcon}>🔒</Text>
              <Text style={styles.menuButtonText}>Change Password</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>My Data</Text>
            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuButtonIcon}>📋</Text>
              <Text style={styles.menuButtonText}>My Logposts</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuButtonIcon}>📷</Text>
              <Text style={styles.menuButtonText}>My Media</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuButtonIcon}>📤</Text>
              <Text style={styles.menuButtonText}>Export Data</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButton}>🚪</Text>
            </TouchableOpacity>
          </ScrollView>
    </View>
  );
}
