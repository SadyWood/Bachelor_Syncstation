import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './SelectSceneScreen.styles';
import type { SelectSceneScreenProps } from './types/SelectSceneScreen.types';

export function SelectSceneScreen({ onBack }: SelectSceneScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top'] as const}>
      <View />
    </SafeAreaView>
  );
}
