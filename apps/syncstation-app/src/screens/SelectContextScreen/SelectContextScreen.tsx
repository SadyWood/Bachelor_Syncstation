import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {Colors} from "@/styles";
import { styles } from './SelectContextScreen.styles';
import type { Project, SelectContextScreenProps } from './SelectContextScreen.types';

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

export function SelectContextScreen({ onBack, onSelectProject }: SelectContextScreenProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadProjects();
  }, []);

  async function loadProjects() {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProjects(MOCK_PROJECTS);
    } finally {
      setIsLoading(false);
    }
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

  const filteredProjects = filterProjects(projects);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.textOnPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Project</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search project..."
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <Text style={styles.sectionTitle}>Your projects</Text>
          <View style={styles.sectionUnderline} />

          {filteredProjects.map((project) => (
            <TouchableOpacity
              key={project.id}
              style={styles.projectCard}
              onPress={() => onSelectProject(project)}
            >
              <Text style={styles.projectName}>{project.name}</Text>
              <Text style={styles.projectRole}>{project.role}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
