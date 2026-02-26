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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  projectName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  role: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  dayInfo: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  changeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeButtonText: {
    color: Colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginRight: Spacing.xs,
  },
  noticeBoardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  noticeBoardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  unreadBadge: {
    backgroundColor: Colors.success,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  unreadBadgeText: {
    color: Colors.textOnPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  noticeList: {
    marginTop: Spacing.sm,
  },
  noticeItem: {
    backgroundColor: Colors.noticeBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  noticeTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  noticeMessage: {
    fontSize: 13,
    color: Colors.noticeText,
    marginTop: 2,
  },
});
