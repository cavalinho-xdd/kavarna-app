import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import Animated, {
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

// Ikona hrníčku s kávou - animovaná verze
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
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (shouldAnimate) {
      scale.value = withSequence(
        withSpring(1.5, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 10, stiffness: 100 }),
      );

      pulse.value = withSequence(
        withTiming(1.2, { duration: 150 }),
        withTiming(1, { duration: 150 }),
        withTiming(1.2, { duration: 150 }),
        withTiming(1, { duration: 150 }),
      );
    }
  }, [shouldAnimate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulse.value }],
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
  const rotation = useSharedValue(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (lastPointAdded && points > 0) {
      const lastIndex = points - 1;
      setAnimatingIndex(lastIndex);

      const timer = setTimeout(() => {
        setAnimatingIndex(null);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [lastPointAdded, points]);

  const handleCardPress = () => {
    rotation.value = withSpring(rotation.value + 180, {
      damping: 15,
      stiffness: 90,
    });
    setIsFlipped(!isFlipped);
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rad = rotation.value * (Math.PI / 180);
    const zIndex = Math.cos(rad) > 0 ? 100 : 0;
    const scale = 1 + 0.1 * Math.sin(rad);

    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotation.value}deg` },
        { scale },
      ],
      backfaceVisibility: "hidden",
      zIndex,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rad = (rotation.value + 180) * (Math.PI / 180);
    const zIndex = Math.cos(rad) > 0 ? 100 : 0;
    const scale = 1 + 0.1 * Math.sin(rotation.value * (Math.PI / 180));

    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotation.value + 180}deg` },
        { scale },
      ],
      backfaceVisibility: "hidden",
      zIndex,
    };
  });

  return (
    <TouchableOpacity onPress={handleCardPress} activeOpacity={0.9}>
      <View style={styles.cardContainer}>
        {/* Přední strana - jen hrníčky */}
        <Animated.View
          style={[styles.card, styles.cardFront, frontAnimatedStyle]}
        >
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
        </Animated.View>

        {/* Zadní strana - jen QR kód */}
        <Animated.View
          style={[styles.card, styles.cardBack, backAnimatedStyle]}
        >
          <ThemedText style={styles.backTitle}>Můj QR kód</ThemedText>

          <View style={styles.qrContainer}>
            <QRCode value={userId} size={110} />
          </View>

          <ThemedText style={styles.backHint}>Ukaž obsluze</ThemedText>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignSelf: "center",
  },
  card: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardFront: {
    backgroundColor: "#FDF8F3",
  },
  cardBack: {
    backgroundColor: "#FDF8F3",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    fontStyle: "italic",
    color: "#4A3728",
    textAlign: "center",
  },
  stampsContainer: {
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  stampsRow: {
    flexDirection: "row",
    gap: 10,
  },
  stampSlot: {
    width: 52,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E8DDD4",
  },
  hint: {
    fontSize: 14,
    color: "#8B7355",
    textAlign: "center",
  },
  backTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4A3728",
    textAlign: "center",
  },
  qrContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
  },
  backHint: {
    fontSize: 14,
    color: "#8B7355",
    textAlign: "center",
  },
});
