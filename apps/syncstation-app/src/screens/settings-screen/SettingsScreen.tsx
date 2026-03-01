
import { StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  menuButton: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 50,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  menuButtonIcon: {
    marginRight: Spacing.md,
    color: Colors.primary,
  },
  menuButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
});
