import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/styles';

import { styles } from './SelectTakeScreen.styles';
import type { SelectTakeScreenProps } from './types/SelectTakeScreen.types';

export function SelectTakeScreen({ onBack }: SelectTakeScreenProps) {
  const handleBackPress = useCallback(() => {
    onBack();
  }, [onBack]);

  return (
    <SafeAreaView style={styles.container} edges={['top'] as const}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBackPress} accessibilityRole="button">
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>

        <Text style={styles.headerTitle}>Select take</Text>
      </View>

      <View style={styles.divider} />
    </SafeAreaView>
  );
}
