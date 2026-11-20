import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "website-design-cdb11",
  appId: "1:209477571069:web:fc93904cbc841be45f4994",
  storageBucket: "website-design-cdb11.firebasestorage.app",
  apiKey: "AIzaSyBLSyaFKUtsVOrE2lVRA_keldrY7fXG9Oc",
  authDomain: "website-design-cdb11.firebaseapp.com",
  messagingSenderId: "209477571069",
  measurementId: "G-F4YRDRG2JN",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(firebaseApp, "planner");
