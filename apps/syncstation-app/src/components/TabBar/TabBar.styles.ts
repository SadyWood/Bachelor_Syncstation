import { StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../styles';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.tabBarBackground,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingBottom: Spacing.lg,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    minWidth: 60,
  },
  tabIcon: {
    marginBottom: Spacing.xs,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: Colors.tabBarActive,
  },
  tabLabelInactive: {
    color: Colors.tabBarInactive,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.cardBackground,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});

export const fabMenuStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  menuContainer: {
    position: 'absolute',
    bottom: 120,
    alignItems: 'center',
    justifyContent: 'center',
    width: 280,
    height: 240,
  },
  menuOption: {
    position: 'absolute',
    alignItems: 'center',
  },
  optionButton: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.cardBackground,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    marginTop: Spacing.xs,
    fontSize: 11,
    fontWeight: '500',
    color: Colors.text,
  },
});
