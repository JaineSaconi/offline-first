import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";

type ToastProps = {
  success: boolean;
  toastKey: number;
};

export function Toast({ success, toastKey }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(-10);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(2500),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [toastKey]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        toastStyles.container,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: success ? "#4caf50" : "#f44336",
        },
      ]}
    >
      <Text style={toastStyles.text}>{success ? "Sucesso" : "Falha"}</Text>
    </Animated.View>
  );
}

const toastStyles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 24,
    left: 24,
    right: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    zIndex: 999,
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
