import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './SelectSceneScreen.styles';
import { Colors } from '../../styles';
import type { SelectSceneScreenProps } from './types/SelectSceneScreen.types';

export function SelectSceneScreen({ onBack }: SelectSceneScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top'] as const}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.textOnPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Scene</Text>
      </View>
      <View style={styles.divider} />
    </SafeAreaView>
  );
}
