import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LoyaltyCard } from "./loyalty-card";
import { LinearGradient } from "expo-linear-gradient";

interface CustomerScreenProps {
  userId: string;
  email: string | null;
  points: number;
  lastPointAdded: number;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export function CustomerScreen({
  userId,
  email,
  points,
  lastPointAdded,
  onLogout,
  onDeleteAccount,
}: CustomerScreenProps) {
  return (
    <LinearGradient
      colors={["#FDFbf8", "#F2E6D8"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Text style={styles.title}>Moje věrnostní karta</Text>

      <LoyaltyCard
        userId={userId}
        points={points}
        lastPointAdded={lastPointAdded}
      />

      <Text style={styles.hintText}>Klikni na kartu pro zobrazení QR kódu</Text>

      <TouchableOpacity style={styles.buttonLogout} onPress={onLogout}>
        <Text style={styles.buttonLogoutText}>Odhlásit se ({email})</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonDelete} onPress={onDeleteAccount}>
        <Text style={styles.buttonDeleteText}>Smazat účet</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#FAF6F3", // Nahrazeno gradientem
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4A3728",
    marginBottom: 32,
    textAlign: "center",
  },
  hintText: {
    marginTop: 24,
    color: "#8B7355",
    fontStyle: "italic",
  },
  buttonLogout: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    backgroundColor: "#FFEBEE",
  },
  buttonLogoutText: {
    color: "#C62828",
    fontWeight: "600",
    fontSize: 14,
  },
  buttonDelete: {
    marginTop: 12,
    padding: 8,
  },
  buttonDeleteText: {
    color: "#9E9E9E",
    fontSize: 12,
    textDecorationLine: "underline",
  },
});