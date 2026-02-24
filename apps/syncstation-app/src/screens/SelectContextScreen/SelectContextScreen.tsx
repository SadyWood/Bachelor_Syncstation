import { View, Text } from 'react-native';
import { styles } from './SelectContextScreen.styles';
import type { SelectContextScreenProps } from './SelectContextScreen.types';

export function SelectContextScreen({ onClose }: SelectContextScreenProps) {
  return (
    <View style={styles.container}>
      <Text>Select Context</Text>
    </View>
  );
}
