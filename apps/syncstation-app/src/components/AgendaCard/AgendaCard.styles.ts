import { StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../styles';

export const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  itemsList: {
    marginTop: Spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  checkboxCompleted: {
    backgroundColor: Colors.success,
  },
  checkboxPending: {
    backgroundColor: Colors.error,
  },
  itemTime: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: Spacing.md,
    minWidth: 50,
  },
  itemTitle: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  itemTitleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
});
