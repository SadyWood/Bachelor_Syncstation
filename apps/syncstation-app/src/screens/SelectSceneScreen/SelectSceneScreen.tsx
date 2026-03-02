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
  { id: '3', number: 3, name: 'Scene 3', description: 'Police station', location: 'Miami - Police HQ' },
  { id: '4', number: 4, name: 'Scene 4', description: 'M&M explosion', location: 'Miami - Warehouse district' },
  { id: '5', number: 5, name: 'Scene 5', description: 'Reggie first meeting', location: 'Miami - Restaurant' },
  { id: '6', number: 6, name: 'Scene 6', description: 'Car chase', location: 'CA - Hollywood street 2' },
  { id: '7', number: 7, name: 'Scene 7', description: 'Rooftop showdown', location: 'Miami - Downtown tower' },
  { id: '8', number: 8, name: 'Scene 8', description: 'Hospital visit', location: 'LA - General Hospital' },
];

async function fetchScenes(
  _token: string,
  _tenantId: string,
  _projectId: string,
): Promise<Scene[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_SCENES;
}

export function SelectSceneScreen({
  onBack,
  onSelectScene,
}: SelectSceneScreenProps) {
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

  function filterScenes(sceneList: Scene[]): Scene[] {
    if (!searchQuery.trim()) {
      return sceneList;
    }

    const query = searchQuery.toLowerCase();

    return sceneList.filter(
      (scene) =>
        scene.name.toLowerCase().includes(query) ||
                scene.description.toLowerCase().includes(query) ||
                scene.location.toLowerCase().includes(query),
    );
  }

  function renderSceneCard(scene: Scene) {
    return (
      <TouchableOpacity
        key={scene.id}
        style={styles.sceneCard}
        onPress={() => handleScenePress(scene)}
      >
        <Ionicons name="folder" size={24} color={Colors.sceneBlue} style={styles.sceneIcon} />

        <View style={styles.sceneInfo}>
          <Text style={styles.sceneText}>
            <Text style={styles.sceneNumber}>
              Scene {scene.number}
            </Text>
            <Text style={styles.sceneDescription}>
              {' '}
              - {scene.description}
            </Text>
          </Text>
        </View>

        <Ionicons name="arrow-forward" size={20} color={Colors.text} style={styles.arrowIcon} />
      </TouchableOpacity>
    );
  }

  const filteredScenes = filterScenes(scenes);

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
        <View style={styles.loadingContainer}> <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput style={styles.searchInput}
              placeholder="Search scene..." placeholderTextColor={Colors.textSecondary}
              value={searchQuery} onChangeText={setSearchQuery}
            />
          </View>

          <Text style={styles.projectTitle}> {activeProject?.name ?? 'Project'} </Text>

          {filteredScenes.length > 0 ? (
            filteredScenes.map(renderSceneCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="film-outline" size={48} color={Colors.textSecondary}/>
              <Text style={styles.emptyStateText}> No scenes found </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
