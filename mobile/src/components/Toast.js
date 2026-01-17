import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

let toastRef = null;

export function setToastRef(ref) {
  toastRef = ref;
}

export function showToast(message, type = 'info') {
  if (toastRef) {
    toastRef.show(message, type);
  }
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);
  const insets = useSafeAreaInsets();

  const show = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  React.useEffect(() => {
    setToastRef({ show });
    return () => setToastRef(null);
  }, []);

  const dismiss = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <>
      {children}
      <View style={[styles.container, { top: insets.top + spacing.base }]}>
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            {...toast}
            onDismiss={() => dismiss(toast.id)}
          />
        ))}
      </View>
    </>
  );
}

function ToastItem({ message, type, onDismiss }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Ionicons name="checkmark-circle" size={20} color={colors.green[600]} />;
      case 'error':
        return <Ionicons name="alert-circle" size={20} color={colors.red[600]} />;
      case 'warning':
        return <Ionicons name="warning" size={20} color="#f59e0b" />;
      default:
        return <Ionicons name="information-circle" size={20} color={colors.primary.light} />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return colors.green[50];
      case 'error':
        return colors.red[50];
      case 'warning':
        return '#fffbeb';
      default:
        return colors.secondary.default;
    }
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: getBgColor(),
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      {getIcon()}
      <Text style={styles.toastText} numberOfLines={2}>
        {message}
      </Text>
      <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
        <Ionicons name="close" size={18} color={colors.slate[500]} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.base,
    right: spacing.base,
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  toastText: {
    flex: 1,
    marginHorizontal: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.slate[700],
  },
  dismissButton: {
    padding: spacing.xs,
  },
});

export default ToastProvider;
