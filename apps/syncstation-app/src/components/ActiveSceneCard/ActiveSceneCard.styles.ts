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
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    textDecorationLine: 'underline',
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  changeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: Spacing.sm,
  },
  changeButtonText: {
    color: Colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginRight: Spacing.xs,
  },
});