import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActiveSceneCard, AgendaCard, ContextCard } from '@/components';
import type { AgendaItem, NoticeItem } from '@/components';
import { useAuthStore } from '@/stores/authStore';
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

async function fetchNotices(_token: string, _tenantId: string): Promise<NoticeItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_NOTICES;
}

async function fetchAgenda(_token: string, _tenantId: string): Promise<AgendaItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_AGENDA;
}

export function HomeScreen() {
  const navigation = useNavigation();
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);

  const token = useAuthStore((s) => s.token);

  const activeProject = useContentStore((state) => state.activeProject);
  const activeScene = useContentStore((state) => state.activeScene);
  const activeTake = useContentStore((state) => state.activeTake);

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject]);

  async function loadData() {
    const tenantId = '';
    const authToken = token ?? '';
    const noticesData = await fetchNotices(authToken, tenantId);
    const agendaData = await fetchAgenda(authToken, tenantId);
    setNotices(noticesData);
    setAgendaItems(agendaData);
  }

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

  const sceneDisplayName = useMemo(() => {
    if (!activeScene) {
      return 'No scene selected';
    }
    return `Scene ${activeScene.number} - ${activeScene.description}`;
  }, [activeScene]);

  const takeDisplayName = useMemo(() => {
    if (!activeTake) {
      return 'No take selected';
    }
    return `${activeTake.name} - ${activeTake.description}`;
  }, [activeTake]);

  const locationDisplay = useMemo(() => {
    if (!activeScene) {
      return 'Select a scene';
    }
    return activeScene.location ?? 'Location not set';
  }, [activeScene]);

  return (
    <SafeAreaView style={styles.container} edges={['top'] as const}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
        <Ionicons name="wifi" size={24} color={Colors.error} style={styles.offlineIcon} />
      </View>

      <View style={styles.divider} />

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
        <ContextCard
          projectName={activeProject?.name ?? 'No project selected'}
          role={activeProject?.role ?? 'Select a project'}
          dayInfo={activeProject ? `Day ${activeProject.currentDay} of ${activeProject.totalDays}` : ''}
          notices={notices}
          onChangePress={handleChangeContext}
        />

        <ActiveSceneCard
          sceneName={sceneDisplayName}
          takeName={takeDisplayName}
          location={locationDisplay}
          onChangePress={handleChangeScene}
        />

        <AgendaCard items={agendaItems} onItemToggle={handleAgendaItemToggle} />
      </ScrollView>
    </SafeAreaView>
  );
}
