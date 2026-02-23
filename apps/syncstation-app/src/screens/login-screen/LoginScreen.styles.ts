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
  imageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    height: 110,
  },
  circle: {
    borderWidth: 2.5,
    borderColor: Colors.primary,
    overflow: 'hidden',
  },
  circlePlaceholder: {
    flex: 1,
    backgroundColor: Colors.text,
  },

})
