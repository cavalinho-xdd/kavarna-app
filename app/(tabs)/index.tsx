import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Button,
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
// Importujeme auth a db
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { auth, db } from "../../firebaseConfig"; // Zkontrolujte cestu k firebaseConfig

// PŘIDÁNO: updateDoc a increment pro přičítání bodů
import {
  doc,
  getDoc,
  increment,
  setDoc,
  updateDoc
} from "firebase/firestore";
import QRCode from "react-native-qrcode-svg";
// PŘIDÁNO: Import kamery
import { CameraView, useCameraPermissions } from "expo-camera";

const { width } = Dimensions.get("window");

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  // PŘIDÁNO: Stavy pro animaci karty
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [isFlipped, setIsFlipped] = useState(false);

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

  // PŘIDÁNO: Funkce pro otočení karty
  const flipCard = () => {
    if (isFlipped) {
      Animated.spring(animatedValue, {
        toValue: 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(animatedValue, {
        toValue: 180,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    }
    setIsFlipped(!isFlipped);
  };

  // Interpolace hodnot pro rotaci
  const frontInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });
  const backInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const frontAnimatedStyle = { transform: [{ rotateY: frontInterpolate }] };
  const backAnimatedStyle = { transform: [{ rotateY: backInterpolate }] };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#5D4037" />
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
            <Button title="Odhlásit se" onPress={handleLogout} color="#8D6E63" />
          </View>
        </View>
      );
    }

    // CUSTOMER MODE - Věrnostní karta
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Moje věrnostní karta</Text>
        <Text style={styles.subtitle}>Klepni pro otočení na QR kód</Text>

        <TouchableOpacity onPress={flipCard} activeOpacity={1}>
          <View>
            {/* PŘEDNÍ STRANA - BODY */}
            <Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle]}>
              <Text style={styles.cardTitle}>Kavárna Doma ☕</Text>
              
              <View style={styles.gridContainer}>
                {/* Vykreslení 10 políček pro razítka */}
                {Array.from({ length: 10 }).map((_, index) => {
                  const points = userData?.points || 0;
                  const isCollected = index < points;
                  return (
                    <View key={index} style={[styles.stampBox, isCollected && styles.stampBoxFilled]}>
                      {isCollected ? (
                        <Text style={{fontSize: 20}}>☕</Text>
                      ) : (
                        <Text style={{color: '#A1887F', fontSize: 10}}>{index + 1}</Text>
                      )}
                    </View>
                  );
                })}
              </View>

              <Text style={styles.pointsText}>{userData?.points || 0} / 10 bodů</Text>
            </Animated.View>

            {/* ZADNÍ STRANA - QR KÓD */}
            <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
              <Text style={styles.cardTitle}>Váš kód</Text>
              <View style={styles.qrWrapper}>
                <QRCode value={user.uid} size={150} color="#3E2723" backgroundColor="#ECE0D1" />
              </View>
              <Text style={styles.scanInstruction}>Ukažte obsluze pro přičtení bodu</Text>
            </Animated.View>
          </View>
        </TouchableOpacity>

        <View style={{ marginTop: 40, width: '80%' }}>
          <Text style={{ textAlign: "center", marginBottom: 10, color: "#5D4037" }}>{user.email}</Text>
          <Button title="Odhlásit se" onPress={handleLogout} color="#8D6E63" />
        </View>
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
    backgroundColor: "#F5F5DC", 
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    marginBottom: 20,
    color: "#3E2723" 
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#8D6E63", 
    backgroundColor: "#FFF8E1", 
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  buttonContainer: { width: "100%", marginBottom: 10 },
  pointsCard: {
    backgroundColor: "#D7CCC8", 
    padding: 20,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#A1887F",
  },
  pointsLabel: { fontSize: 18, color: "#4E342E" }, 
  pointsValue: { fontSize: 40, fontWeight: "bold", color: "#3E2723" },
  qrContainer: {
    alignItems: "center",
    padding: 20,
    borderWidth: 1,
    borderColor: "#8D6E63",
    borderRadius: 10,
    backgroundColor: "#FFF8E1",
  },
  subtitle: {
    fontSize: 16,
    color: "#6D4C41",
    marginBottom: 20,
    textAlign: "center",
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
    borderWidth: 2,
    borderColor: "#8D6E63",
  },
  scanAgainButton: {
    position: "absolute",
    backgroundColor: "#F5F5DC",
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#8D6E63",
  },

  // styly pro věrnostní kartu
  card: {
    width: width * 0.8,
    borderRadius: 10,
    overflow: "hidden",
    backfaceVisibility: "hidden",
    position: "relative",
  },
  cardFront: {
    backgroundColor: "#FFF",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#8D6E63",
  },
  cardBack: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFF",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#8D6E63",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#3E2723",
  },
  qrWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  scanInstruction: {
    fontSize: 14,
    color: "#6D4C41",
    textAlign: "center",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 10,
  },
  stampBox: {
    width: 30,
    height: 30,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#8D6E63",
    backgroundColor: "#D7CCC8",
    justifyContent: "center",
    alignItems: "center",
    margin: 2,
  },
  stampBoxFilled: {
    backgroundColor: "#A1887F",
  },
  pointsText: {
    fontSize: 16,
    color: "#3E2723",
    textAlign: "center",
  },
});
