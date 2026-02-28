import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { Fragment, useState } from 'react';
import { FabMenu, TabBar } from '@/components/TabBar';
import type { FabMenuOption, TabName } from '@/components/TabBar/types/TabBar.types';
import { tabNavigatorScreenOptions } from '@/navigation/AppNavigator.styles';
import { HomeScreen, SelectContextScreen } from '@/screens';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { LoginScreen } from '@/screens/login-screen';
import { WelcomeScreen } from '@/screens/welcome-screen';
import { useAuthStore } from '@/stores/authStore';
import { useContentStore } from '@/stores/ContentStore';
import type { Project } from '@/screens/SelectContextScreen/types/SelectContextScreen.types';

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

type RootStackParamList = {
  Auth: undefined;
  App: NavigatorScreenParams<AppTabsParamList>;
  SelectContext: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<AppTabsParamList>();


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
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Welcome">
        {({ navigation }) => (
          <WelcomeScreen onLoginPress={() => navigation.navigate('Login')} />
        )}
      </AuthStackNav.Screen>
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
    </AuthStackNav.Navigator>
  );
}

type SelectContextProps = NativeStackScreenProps<
  RootStackParamList,
  'SelectContext'
>;

function SelectContextRoute({ navigation }: SelectContextProps) {
  const setActiveProject = useContentStore(
    (state) => state.setActiveProject,
  );

  function handleSelectProject(project: Project) {
    setActiveProject(project);
    navigation.goBack();
  }

  function handleBack() {
    navigation.goBack();
  }

  return (
    <SelectContextScreen
      onBack={handleBack}
      onSelectProject={handleSelectProject}
    />
  );
}

export function AppNavigator() {
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated,
  );

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <RootStack.Screen name="App" component={AppTabs} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthStack} />
      )}

      <RootStack.Screen name="SelectContext"  component={SelectContextRoute}/>
    </RootStack.Navigator>
  );
}
