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
   profileImagePlacerHolder: {
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
});
