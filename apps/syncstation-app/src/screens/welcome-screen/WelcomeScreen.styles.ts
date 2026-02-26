import { StyleSheet } from 'react-native';
import { Colors } from  '@/styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bubble: {
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: Colors.primary,
    overflow: 'hidden',
  },
  bubblePlaceholder: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    top: '40%',
    alignItems: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: 0.5,
  },
  powered: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  btnWrapper: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    marginTop: 16,
  },
  loginBtn: {
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 80,
    paddingVertical: 16,
    borderRadius: 50,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },


});
