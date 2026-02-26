import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './ActiveSceneCard.styles';
import { Colors } from '../../styles';
import type { ActiveSceneCardProps } from './types/ActiveSceneCard.types';

export function ActiveSceneCard({
  sceneName,
  takeName,
  location,
  onChangePress,
}: ActiveSceneCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Active Scene</Text>

      <View style={styles.infoRow}>
        <Ionicons name="film-outline" size={18} color="#4A90D9" />
        <Text style={styles.infoText}>{sceneName}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="folder-outline" size={18} color={Colors.textSecondary} />
        <Text style={styles.infoText}>{takeName}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={18} color={Colors.primary} />
        <Text style={styles.infoText}>{location}</Text>
      </View>

      <TouchableOpacity style={styles.changeButton} onPress={onChangePress}>
        <Text style={styles.changeButtonText}>Change</Text>
        <Ionicons name="chevron-down" size={16} color={Colors.textOnPrimary} />
      </TouchableOpacity>
    </View>
  );
}
