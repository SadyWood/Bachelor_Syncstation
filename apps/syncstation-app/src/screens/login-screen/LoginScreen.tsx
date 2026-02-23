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

const { width, height } = Dimensions.get('window');

const BUBBLES = [
  { top: 0.04, left: 0.10, size: 0.22, delay: 0 },
  { top: 0.09, left: 0.38, size: 0.40, delay: 100 },
  { top: 0.24, left: 0.78, size: 0.20, delay: 200 },
];
