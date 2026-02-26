import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { styles } from './TabBar.styles';
import { Colors } from '../../styles';
import type { TabBarProps, TabName } from './types/TabBar.types';

const TAB_ICONS: Record<Exclude<TabName, 'Add'>, string> = {
  Home: 'home-outline',
  Production: 'desktop-outline',
  Profile: 'person-outline',
  Settings: 'settings-outline',
};

const TAB_ICONS_ACTIVE: Record<Exclude<TabName, 'Add'>, string> = {
  Home: 'home',
  Production: 'desktop',
  Profile: 'person',
  Settings: 'settings',
};

export function TabBar({ activeTab, onTabPress, onFabPress }: TabBarProps) {
  function renderTabItem(tab: Exclude<TabName, 'Add'>) {
    const isActive = activeTab === tab;
    const iconName = isActive ? TAB_ICONS_ACTIVE[tab] : TAB_ICONS[tab];
    const iconColor = isActive ? Colors.tabBarActive : Colors.tabBarInactive;

    return (
      <TouchableOpacity
        key={tab}
        style={styles.tabItem}
        onPress={() => onTabPress(tab)}
      >
        <Ionicons
          name={iconName as keyof typeof Ionicons.glyphMap}
          size={24}
          color={iconColor}
          style={styles.tabIcon}
        />
        <Text
          style={[
            styles.tabLabel,
            isActive ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
        >
          {tab}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {renderTabItem('Home')}
      {renderTabItem('Production')}

      <TouchableOpacity style={styles.fabButton} onPress={onFabPress}>
        <Ionicons name="add" size={32} color={Colors.primary} />
      </TouchableOpacity>

      {renderTabItem('Profile')}
      {renderTabItem('Settings')}
    </View>
  );
}
