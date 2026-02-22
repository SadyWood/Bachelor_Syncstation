import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { LogEntryScreen } from '../screens/ExploreScreen';
import { ProjectsScreen } from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/ProfileScreen';
import { WelcomeScreen } from '../screens/welcome-screen';
import { useAuthStore} from "@/stores/authStore";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AppTabs() {
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

export function AppNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {isAuthenticated ? (
        <Stack.Screen name="App" component={AppTabs}/>
      ) : (
        <Stack.Screen name="Welcome">
          {() => (
            <WelcomeScreen onLoginPress={() => {
              useAuthStore.getState().login('test@test.com', 'password');
            }}
            />
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}
