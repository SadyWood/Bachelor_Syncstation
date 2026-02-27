import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { styles } from './WelcomeScreen.styles';

const { width, height } = Dimensions.get('window');

const BUBBLES = [
  { top: 0.19, left: 0.08, size: 0.22, delay: 0 },
  { top: 0.09, left: 0.38, size: 0.40, delay: 100 },
  { top: 0.24, left: 0.78, size: 0.20, delay: 200 },
  { top: 0.62, left: 0.02, size: 0.38, delay: 150 },
  { top: 0.60, left: 0.44, size: 0.22, delay: 50 },
  { top: 0.76, left: 0.68, size: 0.28, delay: 250 },
];

type BubbleProps = {
  top: number;
  left: number;
  size: number;
  delay: number;
};

function FloatingBubble({ top, left, size, delay }: BubbleProps) {
  const fadeAnimation = useRef(new Animated.Value(0));
  const diameter = width * size;

  useEffect(() => {
    Animated.timing(fadeAnimation.current, {
      toValue: 1,
      duration: 1000,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          top: height * top,
          left: width * left,
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          opacity: fadeAnimation.current,
        },
      ]}
    >
      <View style={[styles.bubblePlaceholder, { borderRadius: diameter / 2 }]} />
    </Animated.View>
  );
}

type Props = {
  onLoginPress: () => void;
};

export function WelcomeScreen({ onLoginPress }: Props) {
  const fadeTitle = useRef(new Animated.Value(0));
  const slideButton = useRef(new Animated.Value(30));
  const fadeButton = useRef(new Animated.Value(0));

  useEffect(() => {
    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(fadeTitle.current, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(fadeButton.current, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(slideButton.current, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {BUBBLES.map((b, i) => (
        <FloatingBubble key={i} {...b} />
      ))}

      <Animated.View style={[styles.center, { opacity: fadeTitle.current }]}>
        <Text style={styles.title}>Set On Sync</Text>
        <Text style={styles.powered}>Powered by Hoolsy</Text>
      </Animated.View>

      <Animated.View style={[styles.btnWrapper, { opacity: fadeButton.current, transform: [{ translateY: slideButton.current }] },
      ]}
      >

        <TouchableOpacity style={styles.loginBtn} onPress={onLoginPress} activeOpacity={0.85}>
          <Text style={styles.loginBtnText}>Log in</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
