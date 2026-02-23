import React from 'react';
import { View, TouchableOpacity, TouchableWithoutFeedback, Text, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../styles';
import { fabMenuStyles as styles } from './TabBar.styles';
import type { FabMenuProps, FabMenuOption } from './TabBar.types';

interface MenuOption {
  key: FabMenuOption;
  icon: string;
  label: string;
  top: number;
  left: number;
}

const MENU_OPTIONS: MenuOption[] = [
  { key: 'FullLog', icon: 'grid-outline', label: 'Full Log', top: 0, left: 110 },
  { key: 'NewSubject', icon: 'list-outline', label: 'New Subject', top: 60, left: 20 },
  { key: 'Photo', icon: 'image-outline', label: 'Photo', top: 60, left: 200 },
  { key: 'Voice', icon: 'mic-outline', label: 'Voice', top: 150, left: 40 },
  { key: 'Video', icon: 'videocam-outline', label: 'Video', top: 150, left: 180 },
];

export function FabMenu({ isVisible, onClose, onOptionPress }: FabMenuProps) {
  function handleOptionPress(option: FabMenuOption) {
    onOptionPress(option);
    onClose();
  }

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.menuContainer}>
              {MENU_OPTIONS.map((option) => (
                <View
                  key={option.key}
                  style={[styles.menuOption, { top: option.top, left: option.left }]}
                >
                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => handleOptionPress(option.key)}
                  >
                    <Ionicons
                      name={option.icon as keyof typeof Ionicons.glyphMap}
                      size={26}
                      color={Colors.primary}
                    />
                  </TouchableOpacity>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                </View>
              ))}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}