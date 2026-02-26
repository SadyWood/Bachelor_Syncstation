export type TabName = 'Home' | 'Production' | 'Add' | 'Profile' | 'Settings';

export interface TabBarProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
  onFabPress: () => void;
}

export type FabMenuOption = 'FullLog' | 'NewSubject' | 'Photo' | 'Voice' | 'Video';

export interface FabMenuProps {
  isVisible: boolean;
  onClose: () => void;
  onOptionPress: (option: FabMenuOption) => void;
}
