import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './AgendaCard.styles';
import { Colors } from '../../styles';
import type { AgendaCardProps } from './AgendaCard.types';

export function AgendaCard({ items, onItemToggle }: AgendaCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.title}>Todays Agenda</Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={Colors.text}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.itemsList}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.item, index === items.length - 1 && styles.itemLast]}
              onPress={() => onItemToggle(item.id)}
            >
              <View
                style={[
                  styles.checkbox,
                  item.isCompleted ? styles.checkboxCompleted : styles.checkboxPending,
                ]}
              >
                {item.isCompleted && (
                  <Ionicons name="checkmark" size={16} color={Colors.textOnPrimary} />
                )}
              </View>
              <Text style={styles.itemTime}>{item.time}</Text>
              <Text
                style={[styles.itemTitle, item.isCompleted && styles.itemTitleCompleted]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
