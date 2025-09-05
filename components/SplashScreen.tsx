import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

interface SplashScreenComponentProps {
  onFinish: () => void;
}

export default function SplashScreenComponent({ onFinish }: SplashScreenComponentProps) {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const zoomAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Prévenir le masquage automatique du splashscreen
    SplashScreen.preventAutoHideAsync();

    // Séquence d'animations : scale + rotation + zoom
    Animated.sequence([
      // Animation d'entrée avec scale et rotation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 10,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
      // Animation de zoom après l'entrée
      Animated.timing(zoomAnim, {
        toValue: 1.2,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Masquer le splashscreen après un délai
    const timer = setTimeout(async () => {
      await SplashScreen.hideAsync();
      onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onFinish, scaleAnim, rotateAnim, zoomAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.Image
          source={require('../assets/icon.jpg')}
          style={[
            styles.logo,
            {
              transform: [
                { scale: scaleAnim },
                { rotate: rotate },
                { scale: zoomAnim }
              ],
            },
          ]}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    width: 350,
    height: 350,
    marginBottom: 20,
  },
});
