import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
// Import auth a db
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

// Firestore
import {
  deleteDoc,
  doc,
  getDoc,
  increment,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
// Kamera
import { useCameraPermissions } from "expo-camera";

// Naše nové komponenty
import { AuthScreen } from "../../components/auth-screen";
import { VerificationScreen } from "../../components/verification-screen";
import { BaristaScreen } from "../../components/barista-screen";
import { CustomerScreen } from "../../components/customer-screen";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [lastPointAdded, setLastPointAdded] = useState<number>(0);
  const previousPoints = React.useRef<number>(0);

  // Stavy pro kameru
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

  // Realtime posluchač pro data uživatele
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

        // Detekce přidání bodu
        if (newPoints > previousPoints.current && previousPoints.current > 0) {
          setLastPointAdded(Date.now());
        }
        previousPoints.current = newPoints;

        setUserData(data);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Handler: Barista naskenuje kód
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (processingScan.current || scanned) return;
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
        password,
      );
      const newUser = userCredential.user;

      // Odeslání ověřovacího emailu
      await sendEmailVerification(newUser);

      await setDoc(doc(db, "users", newUser.uid), {
        email: newUser.email,
        createdAt: new Date(),
        points: 0,
        role: "customer",
        isEmailVerified: false,
      });
      Alert.alert(
        "Ověření emailu",
        "Účet byl vytvořen. Na váš email jsme poslali ověřovací odkaz.",
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
    setEmail("");
    setPassword("");
  };

  // Handler: Ověření emailu (refresh)
  const handleCheckVerification = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
          isEmailVerified: true,
        });
        // Force update state
        setUser({ ...auth.currentUser });
        Alert.alert("Super!", "Email byl úspěšně ověřen.");
      } else {
        Alert.alert(
          "Stále neověřeno",
          "Zatím neevidujeme ověření. Zkuste to za chvíli znovu.",
        );
      }
    }
  };

  // Handler: Znovuposlání emailu
  const handleResendEmail = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        Alert.alert("Odesláno", "Nový ověřovací email byl odeslán.");
      }
    } catch (e: any) {
      Alert.alert("Chyba", "Příliš brzy na další email. Zkuste to později.");
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Smazat účet?",
      "Tato akce je nevratná. Přijdete o všechny nasbírané body.",
      [
        { text: "Zrušit", style: "cancel" },
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
                  "Pro smazání účtu se musíte znovu přihlásit.",
                );
              } else {
                Alert.alert("Chyba", error.message);
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

    // A) Neověřený email
    if (!isVerified) {
      return (
        <VerificationScreen
          email={user.email}
          onCheckVerification={handleCheckVerification}
          onResendEmail={handleResendEmail}
          onLogout={handleLogout}
        />
      );
    }

    // B) Barista (Admin)
    if (userData?.role === "admin") {
      return (
        <BaristaScreen
          permission={permission}
          requestPermission={requestPermission}
          scanned={scanned}
          onBarCodeScanned={handleBarCodeScanned}
          onLogout={handleLogout}
        />
      );
    }

    // C) Zákazník
    return (
      <CustomerScreen
        userId={user.uid}
        email={user.email}
        points={userData?.points || 0}
        lastPointAdded={lastPointAdded}
        onLogout={handleLogout}
        onDeleteAccount={handleDeleteAccount}
      />
    );
  }

  // --- 2. POKUD NENÍ PŘIHLÁŠENÝ (LOGIN) ---
  return (
    <AuthScreen
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      onLogin={handleLogin}
      onRegister={handleRegister}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF6F3",
    alignItems: "center",
    justifyContent: "center",
  },
});