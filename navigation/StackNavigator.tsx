// navigation/StackNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import StatsScreen from '../screens/StatsScreen';

export type RootStackParamList = {
  Home: undefined;
  Stats: { range: 'daily'|'weekly'|'monthly' };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function StackNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home"  component={HomeScreen} options={{ title: 'Sleep Companion' }} />
      <Stack.Screen name="Stats" component={StatsScreen} options={{ title: 'Sleep Stats' }} />
    </Stack.Navigator>
  );
}
