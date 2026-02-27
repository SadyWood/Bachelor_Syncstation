import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './ContextCard.styles';
import { Colors } from '../../styles';
import type { ContextCardProps } from './types/ContextCard.types';

export function ContextCard({
  projectName,
  role,
  dayInfo,
  notices,
  onChangePress,
}: ContextCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>Current Context</Text>
          <Text style={styles.projectName}>{projectName}</Text>
          <Text style={styles.role}>{role}</Text>
          <Text style={styles.dayInfo}>{dayInfo}</Text>
        </View>

        <TouchableOpacity style={styles.changeButton} onPress={onChangePress}>
          <Text style={styles.changeButtonText}>Change</Text>
          <Ionicons name="chevron-down" size={16} color={Colors.textOnPrimary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.noticeBoardHeader}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.noticeBoardTitle}>Notice Board</Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={Colors.primary}
        />
        {notices.length > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{notices.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.noticeList}>
          {notices.map((notice) => (
            <View key={notice.id} style={styles.noticeItem}>
              <Text style={styles.noticeTime}>{notice.time}</Text>
              <Text style={styles.noticeMessage}>{notice.message}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
