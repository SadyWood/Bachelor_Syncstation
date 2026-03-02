import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActiveSceneCard, AgendaCard, ContextCard } from '@/components';
import type { AgendaItem, NoticeItem } from '@/components';
import { useContentStore } from '@/stores/ContentStore';
import { Colors } from '@/styles';
import { styles } from './HomeScreen.styles';

const MOCK_NOTICES: NoticeItem[] = [
  { id: '1', time: '13.45', message: 'Lunch extended due to weather, resume 15.00' },
  { id: '2', time: '13.45', message: 'Lunch extended due to weather, resume 15.00' },
  { id: '3', time: '13.45', message: 'Lunch extended due to weather, resume 15.00' },
  { id: '4', time: '13.45', message: 'Lunch extended due to weather, resume 15.00' },
];

const MOCK_AGENDA: AgendaItem[] = [
  { id: '1', time: '09:45', title: 'Team meetup', isCompleted: true },
  { id: '2', time: '09:45', title: 'Team meetup', isCompleted: true },
  { id: '3', time: '09:45', title: 'Team meetup', isCompleted: true },
  { id: '4', time: '09:45', title: 'Team meetup', isCompleted: false },
  { id: '5', time: '09:45', title: 'Team meetup', isCompleted: false },
  { id: '6', time: '09:45', title: 'Team meetup', isCompleted: false },
];

function getProjectName(projectName?: string) {
  return projectName ?? 'No project selected';
}

function getRoleName(role?: string) {
  return role ?? 'Select a project';
}

function getDayInfo(currentDay?: number, totalDays?: number) {
  if (!currentDay || !totalDays) {
    return '';
  }
  return `Day ${currentDay} of ${totalDays}`;
}

function getSceneDisplayName(scene?: { number: number; description: string } | null) {
  if (!scene) {
    return 'No scene selected';
  }
  return `Scene ${scene.number} - ${scene.description}`;
}

function getTakeDisplayName(take?: { name: string; description: string } | null) {
  if (!take) {
    return 'No take selected';
  }
  return `${take.name} - ${take.description}`;
}

function getLocationDisplay(location?: string, hasScene?: boolean) {
  if (!hasScene) {
    return 'Select a scene';
  }
  return location ?? 'Location not set';
}

export function HomeScreen() {
  const navigation = useNavigation();
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(MOCK_AGENDA);

  const activeProject = useContentStore((state) => state.activeProject);
  const activeScene = useContentStore((state) => state.activeScene);
  const activeTake = useContentStore((state) => state.activeTake);

  function handleChangeContext() {
    navigation.navigate('SelectContext' as never);
  }

  function handleChangeScene() {
    navigation.navigate('SelectScene' as never);
  }

  function handleAgendaItemToggle(id: string) {
    setAgendaItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item,
      ),
    );
  }

  const projectName = getProjectName(activeProject?.name);
  const roleName = getRoleName(activeProject?.role);
  const dayInfo = getDayInfo(activeProject?.currentDay, activeProject?.totalDays);

  const sceneName = getSceneDisplayName(activeScene);
  const takeName = getTakeDisplayName(activeTake);
  const location = getLocationDisplay(activeScene?.location, Boolean(activeScene));

  return (
    <SafeAreaView style={styles.container} edges={['top'] as const}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
        <Ionicons name="wifi" size={24} color={Colors.error} style={styles.offlineIcon} />
      </View>

      <View style={styles.divider} />

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
        <ContextCard
          projectName={projectName}
          role={roleName}
          dayInfo={dayInfo}
          notices={MOCK_NOTICES}
          onChangePress={handleChangeContext}
        />

        <ActiveSceneCard
          sceneName={sceneName}
          takeName={takeName}
          location={location}
          onChangePress={handleChangeScene}
        />

        <AgendaCard items={agendaItems} onItemToggle={handleAgendaItemToggle} />
      </ScrollView>
    </SafeAreaView>
  );
}
