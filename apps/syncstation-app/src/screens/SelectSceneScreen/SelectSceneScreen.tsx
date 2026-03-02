import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
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
async function fetchScenes(
  _token: string,
  _tenantId: string,
  _projectId: string,
): Promise<Scene[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_SCENES;
}

export function SelectSceneScreen({ onBack, onSelectScene }: SelectSceneScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const activeProject = useContentStore((state) => state.activeProject);

  useEffect(() => {
    void loadScenes();
  }, []);

  async function loadScenes() {
    setIsLoading(true);
    try {
      const token = '';
      const tenantId = '';
      const projectId = activeProject?.id ?? '';
      const data = await fetchScenes(token, tenantId, projectId);
      setScenes(data);
    } finally {
      setIsLoading(false);
    }
  }

  function handleScenePress(scene: Scene) {
    onSelectScene(scene);
  }

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
