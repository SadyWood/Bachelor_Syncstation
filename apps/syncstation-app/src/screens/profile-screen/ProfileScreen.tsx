import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { styles } from './ProfileScreen.styles';
import { useAuthStore } from '@/stores/authStore';

//bytte ut denne med data fra authStore senere!
const MOCK_USER = {
  name: 'Tom Blart',
  birthdate: '01.06.1992',
  email: 'Tom801@gmail.com',
  role: 'Makeup Artist',
};
