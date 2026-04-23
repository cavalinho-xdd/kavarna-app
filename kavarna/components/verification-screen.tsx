import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface VerificationScreenProps {
  email: string | null;
  onCheckVerification: () => void;
  onResendEmail: () => void;
  onLogout: () => void;
}

export function VerificationScreen({
  email,
  onCheckVerification,
  onResendEmail,
  onLogout,
}: VerificationScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ověřte svůj email ✉️</Text>
      <Text style={styles.subtitle}>
        Poslali jsme potvrzovací odkaz na adresu:
      </Text>
      <Text style={[styles.subtitle, { fontWeight: "bold", color: "#4A3728" }]}>
        {email}
      </Text>
      <Text style={styles.subtitle}>
        Pro používání věrnostní karty prosím potvrďte svou emailovou adresu.
      </Text>

      <TouchableOpacity
        style={styles.buttonPrimary}
        onPress={onCheckVerification}
      >
        <Text style={styles.buttonPrimaryText}>Mám ověřeno (Obnovit)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonSecondary} onPress={onResendEmail}>
        <Text style={styles.buttonSecondaryText}>Poslat email znovu</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonLogout} onPress={onLogout}>
        <Text style={styles.buttonLogoutText}>Odhlásit se</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF6F3",
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
  subtitle: {
    fontSize: 18,
    color: "#8B7355",
    marginBottom: 24,
    textAlign: "center",
  },
  buttonPrimary: {
    width: "100%",
    height: 56,
    backgroundColor: "#4A3728",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
    shadowColor: "#4A3728",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPrimaryText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  buttonSecondary: {
    width: "100%",
    height: 56,
    backgroundColor: "transparent",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E8DDD4",
  },
  buttonSecondaryText: {
    color: "#8B7355",
    fontSize: 16,
    fontWeight: "600",
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
});