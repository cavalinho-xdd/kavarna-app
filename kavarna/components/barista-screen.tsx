import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CameraView, PermissionResponse } from "expo-camera";

interface BaristaScreenProps {
  permission: PermissionResponse | null;
  requestPermission: () => Promise<PermissionResponse>;
  scanned: boolean;
  onBarCodeScanned: (result: { data: string }) => void;
  onLogout: () => void;
}

export function BaristaScreen({
  permission,
  requestPermission,
  scanned,
  onBarCodeScanned,
  onLogout,
}: BaristaScreenProps) {
  // Kontrola povolení kamery
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.subtitle}>Potřebujeme přístup ke kameře</Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={styles.buttonPrimary}
        >
          <Text style={styles.buttonPrimaryText}>Povolit kameru</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Režim Barista 📸</Text>
      <Text style={styles.subtitle}>Naskenuj QR kód zákazníka</Text>

      {/* Kamera - Barista */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : onBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />
      </View>

      <TouchableOpacity style={styles.buttonLogout} onPress={onLogout}>
        <Text style={styles.buttonLogoutText}>Ukončit směnu</Text>
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
  },
  buttonPrimaryText: {
    color: "#FFFFFF",
    fontSize: 18,
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
  cameraContainer: {
    width: 280,
    height: 280,
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 5,
    borderColor: "#4A3728",
    marginBottom: 20,
  },
});