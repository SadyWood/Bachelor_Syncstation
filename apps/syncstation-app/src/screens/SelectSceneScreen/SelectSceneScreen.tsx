import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './SelectSceneScreen.styles';
import type { Scene, SelectSceneScreenProps } from './types/SelectSceneScreen.types';
import { useContentStore } from '@/stores/ContentStore';
import { Colors } from '@/styles';

const MOCK_SCENES: Scene[] = [
  { id: '1', number: 1, name: 'Scene 1', description: 'Mike phone call', location: 'LA - Office building' },
  { id: '2', number: 2, name: 'Scene 2', description: 'Marcus home', location: 'LA - Suburb house' },
];

export function SelectSceneScreen({ onBack }: SelectSceneScreenProps) {
  const [isLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [scenes] = useState<Scene[]>([]);
  const activeProject = useContentStore((state) => state.activeProject);
  return (
    <SafeAreaView style={styles.container} edges={['top'] as const}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.textOnPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Scene</Text>
      </View>
      <View style={styles.divider} />
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search scene..."
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <Text style={styles.projectTitle}>{activeProject?.name ?? 'Project'}</Text>
          <View>{scenes.length + MOCK_SCENES.length}</View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
