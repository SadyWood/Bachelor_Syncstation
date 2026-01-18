import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ProjectsScreen } from '../screens/HomeScreen';
import { LogEntryScreen } from '../screens/ExploreScreen';
import { SettingsScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0066cc',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarActiveTintColor: '#0066cc',
      }}
    >
      <Tab.Screen
        name="Projects"
        component={ProjectsScreen}
        options={{
          title: 'Projects',
        }}
      />
      <Tab.Screen
        name="LogEntry"
        component={LogEntryScreen}
        options={{
          title: 'New Log',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}
