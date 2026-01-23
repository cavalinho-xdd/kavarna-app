// Import the functions you need from the SDKs you need
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import {
  Auth,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC2u-Rl1kk-3zioToLqQQD0CLZAlW67CL8",
  authDomain: "kavarnadoma-5bd62.firebaseapp.com",
  projectId: "kavarnadoma-5bd62",
  storageBucket: "kavarnadoma-5bd62.firebasestorage.app",
  messagingSenderId: "890909142288",
  appId: "1:890909142288:web:9e4bcf8ddada49af010995",
  measurementId: "G-J8P74GLBFG",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth: Auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch (e) {
    return getAuth(app);
  }
})();

export const db = getFirestore(app);
export { auth };
