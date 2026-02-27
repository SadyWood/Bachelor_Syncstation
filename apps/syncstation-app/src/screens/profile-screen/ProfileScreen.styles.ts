import { StyleSheet } from 'react-native';
import { Colors } from '@/styles';
import { Spacing } from '@/styles';


export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  profileCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: Colors.text,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
   profileImagePlaceholder: {
     width: '100%',
     height: '100%',
     backgroundColor: Colors.cardBackground,
     justifyContent: 'center',
     alignItems: 'center',
     },
  infoCard: {
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.md,
    borderRadius: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  infoIcon: {
    marginRight: Spacing.md,
    color: Colors.primary,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 16,
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
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: Colors.primary,
    borderRadius: 50,
    padding: Spacing.md,
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    fontSize: 20,
    alignItems: 'center',
    color: Colors.textOnPrimary,
    fontWeight: '700',
    marginLeft: Spacing.sm,
  },
});

