import { initializeApp } from "firebase/app";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";
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
// reCAPTCHA site keys are public; this key is restricted to the GitHub Pages domain.
const recaptchaSiteKey = "6Ld3GikuAAAAAC4y1Ba-zzQg1M81C5FcmvrBfrZP";
export const appCheck = recaptchaSiteKey
  ? initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    })
  : null;
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(firebaseApp, "planner");
