import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography } from '../styles/theme';

const { width } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate logo scale and opacity
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Wait then finish
      setTimeout(() => {
        onFinish?.();
      }, 800);
    });
  }, []);

  return (
    <LinearGradient
      colors={[colors.secondary.default, colors.secondary.light, colors.secondary.default]}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }],
              opacity: logoOpacity,
            },
          ]}
        >
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>✦</Text>
          </View>
        </Animated.View>

        <Animated.Text
          style={[
            styles.brandName,
            { opacity: textOpacity },
          ]}
        >
          MintSlip
        </Animated.Text>

        <Animated.Text
          style={[
            styles.tagline,
            { opacity: taglineOpacity },
          ]}
        >
          Professional Document Generation
        </Animated.Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary.light,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  logoIcon: {
    fontSize: 48,
    color: colors.primary.foreground,
  },
  brandName: {
    fontSize: 42,
    fontWeight: typography.fontWeight.bold,
    color: colors.slate[800],
    marginBottom: 8,
  },
  tagline: {
    fontSize: typography.fontSize.base,
    color: colors.muted.foreground,
  },
});
