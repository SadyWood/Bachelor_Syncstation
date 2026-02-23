import { StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  offlineIcon: {
    position: 'absolute',
    right: Spacing.md,
    top: Spacing.xl,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: Spacing.xxl,
  },
});
