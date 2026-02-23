import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { Fragment, useState } from 'react';
import { FabMenu, TabBar } from '@/components/TabBar';
import { HomeScreen } from '@/screens';
import { tabNavigatorScreenOptions } from './AppNavigator.styles';
import type { FabMenuOption, TabName } from '@/components/TabBar/TabBar.types';

type AppTabsParamList = {
  Home: undefined;
  Production: undefined;
  Profile: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<AppTabsParamList>();

export function AppNavigator() {
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
