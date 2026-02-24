import { StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/styles';
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: Spacing.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  projectCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  projectName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  projectRole: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
