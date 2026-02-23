import React, { useRef, useEffect, useRef} from "react";
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
import {multiply} from "react-native/Libraries/Animated/AnimatedExports";

const { width, height } = Dimensions.get('window');

const BUBBLES = [
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
