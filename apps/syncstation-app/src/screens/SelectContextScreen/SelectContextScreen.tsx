import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/styles';
import { styles } from './SelectContextScreen.styles';
import type { Project, SelectContextScreenProps } from './SelectContextScreen.types';
import { useAuthStore } from '@/stores/authStore';

const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Bad Boys',
    role: 'Makeup Artist',
    currentDay: 12,
    totalDays: 210,
    shootingDate: null,
    hasNotices: true,
  },
  {
    id: '2',
    name: 'Barbie',
    role: 'Makeup Artist',
    currentDay: 12,
    totalDays: 210,
    shootingDate: '6 March',
    hasNotices: true,
  },
];

const MOCK_RECENTS: Project[] = [
  {
    id: '1',
    name: 'Bad Boys',
    role: 'Makeup Artist',
    currentDay: 12,
    totalDays: 210,
    shootingDate: null,
    hasNotices: true,
  },
];

async function fetchProjects(_token: string, _tenantId: string): Promise<Project[]> {
  // TODO: Replace with actual API call when backend is ready
  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_PROJECTS;
}

export function SelectContextScreen({ onBack, onSelectProject }: SelectContextScreenProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [recents, setRecents] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadProjects();
  }, []);

  const token = useAuthStore((s) => s.token);

  async function loadProjects() {
    setIsLoading(true);
    try {
      const data = await fetchProjects(token ?? '', '');
      setProjects(data);
      setRecents(MOCK_RECENTS);
    } finally {
      setIsLoading(false);
    }

    function handleProjectPress(project: Project) {
      onSelectProject(project);
    }

    function filterProjects(projectList: Project[]): Project[] {
      if (!searchQuery.trim()) return projectList;
      const query = searchQuery.toLowerCase();
      return projectList.filter(
        (project) =>
          project.name.toLowerCase().includes(query) ||
          project.role.toLowerCase().includes(query),
      );
    }

    function renderProjectCard(project: Project, keyPrefix = '') {
      const isShootingToday = project.shootingDate === null;
      const key = keyPrefix ? `${keyPrefix}-${project.id}` : project.id;

      return (
        <TouchableOpacity
          key={key}
          style={styles.projectCard}
          onPress={() => handleProjectPress(project)}
        >
          <View style={styles.projectHeader}>
            <View>
              <Text style={styles.projectName}>{project.name}</Text>
              <Text style={styles.projectRole}>{project.role}</Text>
            </View>
            <View style={styles.projectMeta}>
              <View style={[
                styles.shootingBadge,
                isShootingToday ? styles.shootingToday : styles.shootingLater,
              ]}>
                <Text style={styles.shootingBadgeText}>
                  {isShootingToday ? 'Shooting Today' : `Shooting ${project.shootingDate}`}
                </Text>
              </View>
              <Text style={styles.dayInfo}>
                Day {project.currentDay} of {project.totalDays}
              </Text>
            </View>
          </View>

          {project.hasNotices && (
            <>
              <View style={styles.projectDivider}/>
              <Text style={styles.noticeText}>PS: You have messages on notice board</Text>
            </>
          )}
        </TouchableOpacity>
      );
    }

    const filteredProjects = filterProjects(projects);
    const filteredRecents = filterProjects(recents);

    return (
      <SafeAreaView style={styles.container} edges={['top'] as const}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.textOnPrimary}/>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Project</Text>
        </View>

        <View style={styles.divider}/>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary}/>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon}/>
              <TextInput
                style={styles.searchInput}
                placeholder="Search project..."
                placeholderTextColor={Colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <Text style={styles.sectionTitle}>Your projects</Text>
            <View style={styles.sectionUnderline}/>

            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => renderProjectCard(project))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="film-outline" size={48} color={Colors.textSecondary}/>
                <Text style={styles.emptyStateText}>No projects found</Text>
              </View>
            )}

            <View style={styles.sectionDivider}/>

            <Text style={styles.sectionTitle}>Recents</Text>
            <View style={styles.sectionUnderline}/>

            {filteredRecents.length > 0 ? (
              filteredRecents.map((project) => renderProjectCard(project, 'recent'))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={48} color={Colors.textSecondary}/>
                <Text style={styles.emptyStateText}>No recent projects</Text>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }
}
