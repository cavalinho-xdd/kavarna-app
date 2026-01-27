import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface AuthScreenProps {
  email: string;
  setEmail: (text: string) => void;
  password: string;
  setPassword: (text: string) => void;
  onLogin: () => void;
  onRegister: () => void;
}

export function AuthScreen({
  email,
  setEmail,
  password,
  setPassword,
  onLogin,
  onRegister,
}: AuthScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kavárna Doma ☕</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#Aca"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Heslo"
        placeholderTextColor="#Aca"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.buttonPrimary} onPress={onLogin}>
        <Text style={styles.buttonPrimaryText}>Přihlásit se</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonSecondary} onPress={onRegister}>
        <Text style={styles.buttonSecondaryText}>Založit účet</Text>
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
  input: {
    width: "100%",
    height: 56,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#4A3728",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E8DDD4",
    shadowColor: "#4A3728",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
});