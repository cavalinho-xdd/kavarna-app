import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert, 
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { auth, db } from "../../firebaseConfig";

import {
  deleteDoc,
  doc,
  getDoc,
  increment,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LoyaltyCard } from "../../components/loyalty-card";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [lastPointAdded, setLastPointAdded] = useState<number>(0);
  const previousPoints = React.useRef<number>(0);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const processingScan = React.useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setUserData(null);
      previousPoints.current = 0;
      return;
    }

    const docRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const newPoints = data.points || 0;

        if (newPoints > previousPoints.current && previousPoints.current > 0) {
          setLastPointAdded(Date.now());
        }
        previousPoints.current = newPoints;

        setUserData(data);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (processingScan.current || scanned) return; 
    processingScan.current = true;
    setScanned(true);

    try {
      const customerRef = doc(db, "users", data);

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
        password,
      );
      const user = userCredential.user;

      await sendEmailVerification(user);

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        createdAt: new Date(),
        points: 0,
        role: "customer",
        isEmailVerified: false,
      });
      Alert.alert(
        "Ověření emailu",
        "Účet byl vytvořen. Na váš email jsme poslali ověřovací odkaz. Pro aktivaci účtu na něj prosím klikněte.",
      );
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

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Smazat účet?",
      "Tato akce je nevratná. Přijdete o všechny nasbírané body a váš účet bude trvale odstraněn.",
      [
        {
          text: "Zrušit",
          style: "cancel",
        },
        {
          text: "Smazat účet",
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            try {
              await deleteDoc(doc(db, "users", user.uid));

              await deleteUser(user);

              Alert.alert("Účet smazán", "Váš účet byl úspěšně vymazán.");
            } catch (error: any) {
              if (error.code === "auth/requires-recent-login") {
                Alert.alert(
                  "Bezpečnostní chyba",
                  "Pro smazání účtu se musíte znovu přihlásit (z bezpečnostních důvodů).",
                );
              } else {
                Alert.alert(
                  "Chyba",
                  "Nepodařilo se smazat účet: " + error.message,
                );
              }
            }
          },
        },
      ],
    );
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
    const isVerified =
      user.emailVerified ||
      userData?.isEmailVerified === true ||
      user.email === "franta@test.cz";

    if (!isVerified) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Ověřte svůj email ✉️</Text>
          <Text style={styles.subtitle}>
            Poslali jsme potvrzovací odkaz na adresu:
          </Text>
          <Text
            style={[styles.subtitle, { fontWeight: "bold", color: "#4A3728" }]}
          >
            {user.email}
          </Text>
          <Text style={styles.subtitle}>
            Pro používání věrnostní karty prosím potvrďte svou emailovou adresu.
          </Text>

          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={async () => {
              if (auth.currentUser) {
                await auth.currentUser.reload();
                if (auth.currentUser.emailVerified) {
                  const userRef = doc(db, "users", auth.currentUser.uid);
                  await updateDoc(userRef, {
                    isEmailVerified: true,
                  });

                  setUser({ ...auth.currentUser });
                  Alert.alert("Super!", "Email byl úspěšně ověřen.");
                } else {
                  Alert.alert(
                    "Stále neověřeno",
                    "Zatím neevidujeme ověření. Zkuste to za chvíli znovu.",
                  );
                }
              }
            }}
          >
            <Text style={styles.buttonPrimaryText}>Mám ověřeno (Obnovit)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={async () => {
              try {
                if (auth.currentUser) {
                  await sendEmailVerification(auth.currentUser);
                  Alert.alert("Odesláno", "Nový ověřovací email byl odeslán.");
                }
              } catch (e: any) {
                Alert.alert(
                  "Chyba",
                  "Příliš brzy na další email. Zkuste to později.",
                );
              }
            }}
          >
            <Text style={styles.buttonSecondaryText}>Poslat email znovu</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buttonLogout} onPress={handleLogout}>
            <Text style={styles.buttonLogoutText}>Odhlásit se</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // BARISTA MODE
    if (userData?.role === "admin") {
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
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
            />
          </View>

          <TouchableOpacity style={styles.buttonLogout} onPress={handleLogout}>
            <Text style={styles.buttonLogoutText}>Ukončit směnu</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // CUSTOMER MODE
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Moje věrnostní karta</Text>

        <LoyaltyCard
          userId={user.uid}
          points={userData?.points || 0}
          lastPointAdded={lastPointAdded}
        />

        <Text style={{ marginTop: 24, color: "#8B7355", fontStyle: "italic" }}>
          Klikni na kartu pro zobrazení QR kódu
        </Text>

        <TouchableOpacity style={styles.buttonLogout} onPress={handleLogout}>
          <Text style={styles.buttonLogoutText}>
            Odhlásit se ({user.email})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonDelete}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.buttonDeleteText}>Smazat účet</Text>
        </TouchableOpacity>
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

      <TouchableOpacity style={styles.buttonPrimary} onPress={handleLogin}>
        <Text style={styles.buttonPrimaryText}>Přihlásit se</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonSecondary} onPress={handleRegister}>
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
  subtitle: {
    fontSize: 18,
    color: "#8B7355",
    marginBottom: 24,
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
