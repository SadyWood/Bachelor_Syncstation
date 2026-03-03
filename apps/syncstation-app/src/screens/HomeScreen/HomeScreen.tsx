import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './HomeScreen.styles';
import type { AgendaItem, NoticeItem } from '@/components';
import { ActiveSceneCard, AgendaCard, ContextCard } from '@/components';
import { useAuthStore } from '@/stores/authStore';
import { useContentStore } from '@/stores/ContentStore';
import { Colors } from '@/styles';

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

// TODO: Replace with API call when backend is ready
async function fetchNotices(_token: string, _tenantId: string): Promise<NoticeItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_NOTICES;
}

// TODO: Replace with API call when backend is ready
async function fetchAgenda(_token: string, _tenantId: string): Promise<AgendaItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_AGENDA;
}

function getProjectName(projectName?: string): string {
  return projectName ?? 'No project selected';
}

function getRoleName(role?: string): string {
  return role ?? 'Select a project';
}

function getDayInfo(currentDay?: number, totalDays?: number): string {
  if (!currentDay || !totalDays) {
    return '';
  }
  return `Day ${currentDay} of ${totalDays}`;
}

function getSceneDisplayName(scene?: { number: number; description: string } | null): string {
  if (!scene) {
    return 'No scene selected';
  }
  return `Scene ${scene.number} - ${scene.description}`;
}

function getTakeDisplayName(take?: { name: string; description: string } | null): string {
  if (!take) {
    return 'No take selected';
  }
  return `${take.name} - ${take.description}`;
}

function getLocationDisplay(location?: string, hasScene?: boolean): string {
  if (!hasScene) {
    return 'Select a scene';
  }
  return location ?? 'Location not set';
}

export function HomeScreen() {
  const navigation = useNavigation();

  const token = useAuthStore((state) => state.token);

  const activeProject = useContentStore((state) => state.activeProject);
  const activeScene = useContentStore((state) => state.activeScene);
  const activeTake = useContentStore((state) => state.activeTake);

  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!activeProject?.id) {
      setAgendaItems([]);
      setNotices([]);
      setIsLoading(false);
      return;
    }

    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject?.id, token]);

  async function loadData() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const tenantId = ''; // TODO: wire tenantId when available
      const authToken = token ?? '';

      const noticesData = await fetchNotices(authToken, tenantId);
      const agendaData = await fetchAgenda(authToken, tenantId);

      setNotices(noticesData);
      setAgendaItems(agendaData);
    } catch (_error) {
      setErrorMessage('Failed to load home data');
    } finally {
      setIsLoading(false);
    }
  }

  function handleChangeContext() {
    navigation.navigate('SelectContext' as never);
  }

  function handleChangeScene() {
    navigation.navigate('SelectScene' as never);
  }

  function handleAgendaItemToggle(id: string) {
    // TODO: when backend is ready, replace with optimistic update + API call
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

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
          {errorMessage ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: Colors.error }}>{errorMessage}</Text>
              <Text style={{ color: Colors.textSecondary }} onPress={() => void loadData()}>
                Tap to retry
              </Text>
            </View>
          ) : null}

          <ContextCard
            projectName={projectName}
            role={roleName}
            dayInfo={dayInfo}
            notices={notices}
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
      )}
    </SafeAreaView>
  );
}
