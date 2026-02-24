import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [projects] = useState<Project[]>(MOCK_PROJECTS);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Project</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Your projects</Text>
        {projects.map((project) => (
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
    </SafeAreaView>
  );
}
