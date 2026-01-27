import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as Haptics from "expo-haptics";
import Animated, {
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { ThemedText } from "./themed-text";

interface LoyaltyCardProps {
  userId: string;
  points: number;
  onPointPress?: (index: number) => void;
  lastPointAdded?: number;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = Math.min(width * 0.9, 380);
const CARD_HEIGHT = CARD_WIDTH * 0.65;

// --- Komponenta Hrníčku ---
const AnimatedCoffeeCupIcon = ({
  filled,
  size = 40,
  shouldAnimate = false,
}: {
  filled: boolean;
  size?: number;
  shouldAnimate?: boolean;
}) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (shouldAnimate) {
      scale.value = withSequence(
        withSpring(1.5, { reduceMotion: ReduceMotion.Never }),
        withSpring(1, { reduceMotion: ReduceMotion.Never })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [shouldAnimate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path
          d="M20 30 L20 75 Q20 80 25 80 L75 80 Q80 80 80 75 L80 30 Z"
          fill={filled ? "#8B4513" : "#FFFFFF"}
          stroke="#4A4A4A"
          strokeWidth="3"
        />
        <Path
          d="M80 40 Q95 40 95 55 Q95 70 80 70"
          fill="none"
          stroke="#4A4A4A"
          strokeWidth="3"
        />
        <Path
          d="M40 45 Q40 40 45 40 Q50 40 50 45 Q50 40 55 40 Q60 40 60 45 Q60 55 50 60 Q40 55 40 45"
          fill={filled ? "#FFFFFF" : "#4A4A4A"}
        />
      </Svg>
    </Animated.View>
  );
};

export function LoyaltyCard({
  userId,
  points,
  onPointPress,
  lastPointAdded,
}: LoyaltyCardProps) {
  const [showQr, setShowQr] = useState(false);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (lastPointAdded && points > 0) {
      const lastIndex = points - 1;
      setAnimatingIndex(lastIndex);
      const timer = setTimeout(() => setAnimatingIndex(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [lastPointAdded, points]);

  const toggleState = () => {
    setShowQr((prev) => !prev);
  };

  const handleCardPress = () => {
    Haptics.selectionAsync();

    // 1. Zmenšit a zprůhlednit (Fade Out) - RYCHLEJI (100ms)
    scale.value = withTiming(0.92, { duration: 100, reduceMotion: ReduceMotion.Never });
    opacity.value = withTiming(0, { duration: 100, reduceMotion: ReduceMotion.Never }, (finished) => {
      if (finished) {
        runOnJS(toggleState)();
      }
    });
  };

  useEffect(() => {
    // 2. Zpět nahoru (Fade In) - MENŠÍ DAMPING (rychlejší návrat)
    scale.value = withSpring(1, { damping: 15, stiffness: 300, reduceMotion: ReduceMotion.Never });
    opacity.value = withTiming(1, { duration: 150, reduceMotion: ReduceMotion.Never });
  }, [showQr]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <TouchableOpacity onPress={handleCardPress} activeOpacity={1}>
      <View style={styles.cardWrapper}>
        <Animated.View style={[styles.card, containerStyle]}>
          {!showQr ? (
            <>
              <ThemedText style={styles.title}>Kavárna Doma</ThemedText>
              <View style={styles.stampsContainer}>
                <View style={styles.stampsRow}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.stampSlot}
                      onPress={() => onPointPress?.(i)}
                      activeOpacity={0.7}
                      disabled={!onPointPress}
                    >
                      <AnimatedCoffeeCupIcon
                        filled={i < points}
                        size={42}
                        shouldAnimate={animatingIndex === i}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.stampsRow}>
                  {[5, 6, 7, 8, 9].map((i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.stampSlot}
                      onPress={() => onPointPress?.(i)}
                      activeOpacity={0.7}
                      disabled={!onPointPress}
                    >
                      <AnimatedCoffeeCupIcon
                        filled={i < points}
                        size={42}
                        shouldAnimate={animatingIndex === i}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <ThemedText style={styles.hint}>10. káva zdarma ☕</ThemedText>
            </>
          ) : (
            <>
              <ThemedText style={styles.backTitle}>Můj QR kód</ThemedText>
              <View style={styles.qrContainer}>
                <QRCode value={userId} size={110} />
              </View>
              <ThemedText style={styles.backHint}>Ukaž obsluze</ThemedText>
            </>
          )}
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignSelf: "center",
    shadowColor: "#4A3728",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    width: "100%",
    height: "100%",
    backgroundColor: "#FDF8F3",
    borderRadius: 24,
    padding: 20,
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8DDD4",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    fontStyle: "italic",
    color: "#4A3728",
  },
  stampsContainer: {
    gap: 10,
  },
  stampsRow: {
    flexDirection: "row",
    gap: 10,
  },
  stampSlot: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#F0E6DD",
  },
  hint: {
    fontSize: 14,
    color: "#8B7355",
    fontWeight: "500",
  },
  backTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4A3728",
  },
  qrContainer: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8DDD4",
  },
  backHint: {
    fontSize: 16,
    color: "#8B7355",
    marginBottom: 4,
  },
});