import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { Fragment, useState } from 'react';
import { FabMenu, TabBar, type FabMenuOption, type TabName } from '@/components/TabBar';
import { HomeScreen } from '@/screens';
import { LoginScreen } from '@/screens/login-screen';
import { ProfileScreen } from '@/screens/profile-screen';
import { WelcomeScreen } from '@/screens/welcome-screen';
import { useAuthStore } from '@/stores/authStore';
import { tabNavigatorScreenOptions } from './AppNavigator.styles';


type AppTabsParamList = {
  Home: undefined;
  Production: undefined;
  Profile: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<AppTabsParamList>();
const Stack = createNativeStackNavigator();


export function AppTabs() {
  const [isFabMenuVisible, setIsFabMenuVisible] = useState<boolean>(false);

  function handleFabPress() {
    setIsFabMenuVisible(true);
  }

  function handleCloseFabMenu() {
    setIsFabMenuVisible(false);
  }

  function handleMenuOptionPress(_option: FabMenuOption) {
    // TODO: koble til riktig flow senere
    setIsFabMenuVisible(false);
  }

  return (
    <Fragment>
      <Tab.Navigator
        screenOptions={tabNavigatorScreenOptions}
        tabBar={({ state, navigation }) => {
          const activeRouteName = state.routeNames[state.index] as TabName;

          function handleTabPress(tab: TabName) {
            navigation.navigate(tab);
          }

          return (
            <TabBar
              activeTab={activeRouteName}
              onTabPress={handleTabPress}
              onFabPress={handleFabPress}
            />
          );
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Production" component={HomeScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
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

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="App" component={AppTabs}/>
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}
