import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
} from "react-native";
// Importujeme auth a db
import { auth, db } from "../../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";

// PŘIDÁNO: updateDoc a increment pro přičítání bodů
import {
  collection,
  addDoc,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import QRCode from "react-native-qrcode-svg";
// PŘIDÁNO: Import kamery
import { CameraView, useCameraPermissions } from "expo-camera";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  // PŘIDÁNO: Stavy pro kameru
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const processingScan = React.useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserData(currentUser.uid);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const fetchUserData = async (uid: string) => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
    } catch (error) {
      console.error("Chyba při načítání uživatelských dat:", error);
    }
  };

  // PŘIDÁNO: Funkce, co se stane po naskenování
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (processingScan.current || scanned) return; // Zabráníme vícenásobnému načtení
    processingScan.current = true;
    setScanned(true);

    try {
      const customerRef = doc(db, "users", data);

      // Ověříme, že uživatel existuje
      const docSnap = await getDoc(customerRef);
      if (!docSnap.exists()) {
        Alert.alert("Chyba", "Neplatný kód uživatele.", [
          {
            text: "OK",
            onPress: () => {
              setScanned(false);
              processingScan.current = false;
            },
          },
        ]);
        return;
      }

      // Přičteme bod
      await updateDoc(customerRef, {
        points: increment(1),
      });

      Alert.alert("Hotovo! ☕", "Bod byl přičten.", [
        {
          text: "OK",
          onPress: () => {
            setScanned(false);
            processingScan.current = false;
          },
        },
      ]);
    } catch (error) {
      Alert.alert("Chyba", "Nepodařilo se přičíst bod.", [
        {
          text: "OK",
          onPress: () => {
            setScanned(false);
            processingScan.current = false;
          },
        },
      ]);
    }
  };

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        createdAt: new Date(),
        points: 0,
        role: "customer",
      });
      Alert.alert("Super!", "Účet vytvořen a jsi přihlášen.");
    } catch (error) {
      Alert.alert("Chyba registrace", (error as any).message);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      Alert.alert("Chyba přihlášení", (error as any).message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUserData(null);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // --- 1. POKUD JE UŽIVATEL PŘIHLÁŠENÝ ---
  if (user) {
    // BARISTA MODE
    if (userData?.role === "admin") {
      // Kontrola povolení kamery
      if (!permission) return <View />;
      if (!permission.granted) {
        return (
          <View style={styles.container}>
            <Text style={{ marginBottom: 10 }}>
              Potřebujeme přístup ke kameře
            </Text>
            <Button onPress={requestPermission} title="Povolit kameru" />
          </View>
        );
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Režim Barista 📸</Text>
          <Text style={{ marginBottom: 20 }}>Naskenuj QR kód zákazníka</Text>

          {/* Kamera - Barista */}
          <View style={styles.cameraContainer}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
            />
          </View>

          <View style={{ marginTop: 20 }}>
            <Button title="Odhlásit se" onPress={handleLogout} color="red" />
          </View>
        </View>
      );
    }

    // CUSTOMER MODE
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Moje věrnostní karta</Text>
        <View style={styles.pointsCard}>
          <Text style={styles.pointsLabel}>Počet bodů:</Text>
          <Text style={styles.pointsValue}>{userData?.points || 0} / 10</Text>
        </View>

        <View style={styles.qrContainer}>
          <QRCode value={user.uid} size={200} />
          <Text style={{ marginTop: 10, color: "gray" }}>
            Ukažte tento kód obsluze
          </Text>
        </View>
        <Text style={{ marginBottom: 20, marginTop: 20 }}>{user.email}</Text>
        <Button title="Odhlásit se" onPress={handleLogout} color="red" />
      </View>
    );
  }

  // LOGIN SCREEN
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kavárna Doma ☕</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Heslo"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <View style={styles.buttonContainer}>
        <Button title="Přihlásit se" onPress={handleLogin} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Registrovat" onPress={handleRegister} color="gray" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  buttonContainer: { width: "100%", marginBottom: 10 },
  pointsCard: {
    backgroundColor: "#f0f0f0",
    padding: 20,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
  },
  pointsLabel: { fontSize: 18, color: "#555" },
  pointsValue: { fontSize: 40, fontWeight: "bold", color: "#6200ea" },
  qrContainer: {
    alignItems: "center",
    padding: 20,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
  },

  // styly pro kameru
  cameraContainer: {
    width: 300,
    height: 300,
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  scanAgainButton: {
    position: "absolute",
    backgroundColor: "white",
    padding: 5,
    borderRadius: 5,
  },
});
