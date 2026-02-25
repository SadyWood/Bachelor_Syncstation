import React, { Fragment, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { FabMenu, TabBar } from '@/components/TabBar';
import { tabNavigatorScreenOptions } from '@/navigation/AppNavigator.styles';
import { HomeScreen } from '@/screens';
import { LoginScreen } from '@/screens/login-screen';
import { WelcomeScreen } from '@/screens/welcome-screen';
import { useAuthStore } from '@/stores/authStore';

import type { FabMenuOption, TabName } from '@/components/TabBar/TabBar.types';

type AppTabsParamList = {
  Home: undefined;
  Production: undefined;
  Profile: undefined;
  Settings: undefined;
};

type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
};

const Tab = createBottomTabNavigator<AppTabsParamList>();
const Stack = createNativeStackNavigator<AuthStackParamList>();

function AppTabs() {
  const [isFabMenuVisible, setIsFabMenuVisible] = useState<boolean>(false);

  function handleFabPress() {
    setIsFabMenuVisible(true);
  }

  function handleCloseFabMenu() {
    setIsFabMenuVisible(false);
  }

  function handleMenuOptionPress(_option: FabMenuOption) {
    setIsFabMenuVisible(false);
  }

  return (
    <Fragment>
      <Tab.Navigator
        screenOptions={tabNavigatorScreenOptions}
        tabBar={({ state, navigation }) => (
          <TabBar
            activeTab={state.routeNames[state.index] as TabName}
            onTabPress={(tab: TabName) => navigation.navigate(tab)}
            onFabPress={handleFabPress}
          />
        )}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Production" component={HomeScreen} />
        <Tab.Screen name="Profile" component={HomeScreen} />
        <Tab.Screen name="Settings" component={HomeScreen} />
      </Tab.Navigator>

      <FabMenu
        isVisible={isFabMenuVisible}
        onClose={handleCloseFabMenu}
        onOptionPress={handleMenuOptionPress}
      />
    </Fragment>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome">
        {({ navigation }) => (
          <WelcomeScreen onLoginPress={() => navigation.navigate('Login')} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return isAuthenticated ? <AppTabs /> : <AuthStack />;
}
