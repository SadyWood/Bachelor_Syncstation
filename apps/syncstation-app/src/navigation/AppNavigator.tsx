import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { Fragment, useState } from 'react';
import type { FabMenuOption, TabName } from '@/components/TabBar/types/TabBar.types';
import type { Project } from '@/screens/SelectContextScreen/types/SelectContextScreen.types';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { FabMenu, TabBar } from '@/components/TabBar';
import { tabNavigatorScreenOptions } from '@/navigation/AppNavigator.styles';
import { HomeScreen, SelectContextScreen } from '@/screens';
import { LoginScreen } from '@/screens/login-screen';
import { WelcomeScreen } from '@/screens/welcome-screen';
import { ProfileScreen } from '@/screens/profile-screen';
// TODO: import when is ready
// import { SettingsScreen } from '@/screens/settings-screen';
// import { ProductionScreen } from '@/screens/production-screen';
// import { SelectSceneScreen } from '@/screens/select-scene-screen';
// import { SelectTakeScreen } from '@/screens/select-take-screen';
// import { CreateLogScreen } from '@/screens/create-log-screen';
// import { SubjectScreen } from '@/screens/subject-screen';
import { useAuthStore } from '@/stores/authStore';
import { useContentStore } from '@/stores/ContentStore';

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

  SelectScene: undefined;
  SelectTake: undefined;
  CreateLog: undefined;
  Subject: undefined;
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
        <Tab.Screen name="Production" component={HomeScreen} /> {/* TODO: ProductionScreen */}
        <Tab.Screen name="Profile" component={HomeScreen} />
        <Tab.Screen name="Settings" component={HomeScreen} /> {/* TODO: SettingsScreen */}
      </Tab.Navigator>

      <FabMenu isVisible={isFabMenuVisible} onClose={handleCloseFabMenu} onOptionPress={handleMenuOptionPress} />
    </Fragment>
  );
}

function AuthStack() {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Welcome">
        {({ navigation }) => <WelcomeScreen onLoginPress={() => navigation.navigate('Login')} />}
      </AuthStackNav.Screen>
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
    </AuthStackNav.Navigator>
  );
}

type SelectContextProps = NativeStackScreenProps<RootStackParamList, 'SelectContext'>;

function SelectContextRoute({ navigation }: SelectContextProps) {
  const setActiveProject = useContentStore((state) => state.setActiveProject);

  function handleSelectProject(project: Project) {
    setActiveProject(project);
    navigation.goBack();
  }

  function handleBack() {
    navigation.goBack();
  }

  return <SelectContextScreen onBack={handleBack} onSelectProject={handleSelectProject} />;
}

// TODO: Replace homescreen with selectscenescreen when ready
type SelectSceneProps = NativeStackScreenProps<RootStackParamList, 'SelectScene'>;

function SelectSceneRoute(_props: SelectSceneProps) {
  return <HomeScreen />;
}

// TODO: replace Homescreen with selecttakescreen when ready
type SelectTakeProps = NativeStackScreenProps<RootStackParamList, 'SelectTake'>;

function SelectTakeRoute(_props: SelectTakeProps) {
  return <HomeScreen />;
}

// TODO: replace homescreen with createlogscreen when ready
type CreateLogProps = NativeStackScreenProps<RootStackParamList, 'CreateLog'>;

function CreateLogRoute(_props: CreateLogProps) {
  return <HomeScreen />;
}

// TODO: replace homescreen with subjectscreen when ready
type SubjectProps = NativeStackScreenProps<RootStackParamList, 'Subject'>;

function SubjectRoute(_props: SubjectProps) {
  return <HomeScreen />;
}

export function AppNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <RootStack.Screen name="App" component={AppTabs} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthStack} />
      )}

      <RootStack.Screen name="SelectContext" component={SelectContextRoute} />
      <RootStack.Screen name="SelectScene" component={SelectSceneRoute} />
      <RootStack.Screen name="SelectTake" component={SelectTakeRoute} />
      <RootStack.Screen name="CreateLog" component={CreateLogRoute} />
      <RootStack.Screen name="Subject" component={SubjectRoute} />
    </RootStack.Navigator>
  );
}
