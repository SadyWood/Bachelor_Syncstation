import { StyleSheet} from "react-native";
import { Colors } from '@/styles';
import { Spacing } from '@/styles';

export const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flexGrow: 1,
    padding: Spacing.lg,
    backgroundColor: Colors.background,
  },
})
