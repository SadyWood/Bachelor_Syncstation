import React, { useRef, useEffect, useState} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { styles } from './LoginScreen.styles';
import { useAuthStore } from "@/stores/authStore";


const { width, height } = Dimensions.get('window');

const CIRCLES = [
  { top: 0.04, left: 0.10, size: 0.22, delay: 0 },
  { top: 0.09, left: 0.38, size: 0.40, delay: 100 },
  { top: 0.24, left: 0.78, size: 0.20, delay: 200 },
];

type CircleProps = {
  top: number,
  left: number,
  size: number,
  delay: number,
};

function AnimatedCircle({ top, left, size, delay }: CircleProps) {
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const diameter = width * size;

  useEffect(() => {
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 800,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return(
    <Animated.View style={[
      styles.circle, {
        top: height * top,
        left: width * left,
        width: diameter,
        height: diameter,
        borderRadius: diameter / 2,
        opacity: fadeAnimation,
      },
    ]}
    >
      <View style={[styles.circlePlaceholder, { borderRadius: diameter/ 2}]} />
    </Animated.View>
  );
}

type Props = {
  onBack?: () => void;
};

export function LoginScreen({ onBack }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore((s) => s.login);

  const slideAnimated = useRef(new Animated.Value(40)).current;
  const fadeAnimated = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnimated, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnimated, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  async function handleLogin() {
    if (!email || !password) {
      setError('Fyll inn brukernavn/mail og passord!!');
      return;
    }
    setLoading(true);
    setError('');
    await login(email, password);
    setLoading(false);
  }
  return (
    <KeyboardAvoidingView
    style={styles.flex}
  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
  >
    <ScrollView contentContainerStyle={styles.container}
  keyboardShouldPersistTaps="handled"
  >
    {CIRCLES.map((c, i) => (
      <AnimatedCircle key={i} {...c} />
      ))}
  <Animated.View style={[ styles.titleBlock, {
    opacity: fadeAnimated, transform: [{ translateY: slideAnimated }] },
  ]}
    >
    <Text style={styles.title}>Set On Sync</Text>
    <Text style={styles.powered}>Powered by Hoolsy</Text>
  </Animated.View>
  </ScrollView>
  </KeyboardAvoidingView>
  )
}
