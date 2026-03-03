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
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    position: 'absolute',
    fontSize: 24,
    textAlign: 'center',
    fontWeight: '700',
    left: 0,
    right: 0,
    color: Colors.text,
    marginLeft: Spacing.md,
    zIndex: -1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
    textDecorationLine: 'underline',
  },
  sceneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sceneIcon: {
    marginRight: Spacing.md,
  },
  sceneInfo: {
    flex: 1,
  },
  sceneText: {
    fontSize: 16,
    color: Colors.text,
  },
  sceneNumber: {
    fontWeight: '700',
  },
  sceneDescription: {
    fontWeight: '400',
  },
  arrowIcon: {
    marginLeft: Spacing.sm,
  },
});
