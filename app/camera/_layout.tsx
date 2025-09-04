import React from 'react';
import { Stack } from 'expo-router';

export default function CameraLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Caméra',
        }}
      />
      <Stack.Screen
        name="photos"
        options={{
          title: 'Photos',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
