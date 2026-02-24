import React, { useEffect, useState } from 'react';
import {  Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../../styles';
import { styles } from './SelectContextScreen.styles';
import type { SelectContextScreenProps } from './SelectContextScreen.types';

export function SelectContextScreen({ onBack, onSelectProject }: SelectContextScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Project</Text>
      </View>
    </SafeAreaView>
  );
}
