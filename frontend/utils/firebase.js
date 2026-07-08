// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "cotexai-ec142.firebaseapp.com", 
  projectId: "cotexai-ec142",
  storageBucket: "cotexai-ec142.firebasestorage.app",
  messagingSenderId: "205512567442",
  appId: "1:205512567442:web:609aeffb77b142ed39544b",
  measurementId: "G-4P7DKD6ZVV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()