import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA3jkbeNBQcyb-F5muKYF9t82hYf-dYWH4",
  authDomain: "ecof-catalogo.firebaseapp.com",
  projectId: "ecof-catalogo",
  storageBucket: "ecof-catalogo.firebasestorage.app",
  messagingSenderId: "400472793707",
  appId: "1:400472793707:web:4b0b5c8ff810f046d6072e"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
