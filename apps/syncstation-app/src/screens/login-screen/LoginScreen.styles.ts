import { StyleSheet} from "react-native";
import { Colors } from '@/styles';
import { Spacing } from '@/styles';

export const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flexGrow: 1,
    padding: Spacing.lg,
    backgroundColor: Colors.background,
  },
  imageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    height: 110,
  },
  circle: {
    borderWidth: 2.5,
    borderColor: Colors.primary,
    overflow: 'hidden',
  },
  circlePlaceholder: {
    flex: 1,
    backgroundColor: Colors.text,
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  powered: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.primary,
    marginTop: 2,
  },
  form: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 50,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    fontSize: 14,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  error: {
    color: Colors.error,
    fontSize: 14,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  loginBtn: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 50,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  forgotPassword: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.text,
  },
})
