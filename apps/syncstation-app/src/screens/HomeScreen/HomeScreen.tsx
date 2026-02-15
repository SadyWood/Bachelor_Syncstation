import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './HomeScreen.styles';
import type { AgendaItem, NoticeItem } from '@/components';
import { ActiveSceneCard, AgendaCard, ContextCard } from '@/components';
import { Colors } from '@/styles';

// Mock data - will be replaced with real data later
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

export function HomeScreen() {
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(MOCK_AGENDA);

  function handleChangeContext() {
    // TODO: Navigate to context selection
  }

  function handleChangeScene() {
    // TODO: Navigate to scene selection
  }

  function handleAgendaItemToggle(id: string) {
    setAgendaItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item,
      ),
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top'] as const}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
        <Ionicons
          name="wifi-outline"
          size={24}
          color={Colors.error}
          style={styles.offlineIcon}
        />
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Content */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContainer}
      >
        <ContextCard
          projectName="Bad Boys"
          role="Makeup Artist"
          dayInfo="Day 15 of 120"
          notices={MOCK_NOTICES}
          onChangePress={handleChangeContext}
        />

        <ActiveSceneCard
          sceneName="Scene 6 - Car chase"
          takeName="Take 2 - Mike POV"
          location="CA - Hollywood street 2"
          onChangePress={handleChangeScene}
        />

        <AgendaCard items={agendaItems} onItemToggle={handleAgendaItemToggle} />
      </ScrollView>
    </SafeAreaView>
  );
}
