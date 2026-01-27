import React from "react";
import {
  Pressable,
  StyleProp,
  ViewStyle,
  StyleSheet,
  GestureResponderEvent,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  ReduceMotion,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

interface AnimatedButtonProps {
  onPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  scaleTo?: number; // Jak moc se má zmenšit (default 0.96)
  haptic?: boolean; // Jestli má vibrovat (default true)
}

export function AnimatedButton({
  onPress,
  style,
  children,
  scaleTo = 0.96,
  haptic = true,
}: AnimatedButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(scaleTo, {
      damping: 10,
      stiffness: 400,
      reduceMotion: ReduceMotion.Never,
    });
    if (haptic) {
      Haptics.selectionAsync();
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 400,
      reduceMotion: ReduceMotion.Never,
    });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}
