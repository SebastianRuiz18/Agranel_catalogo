// Importa las funciones que necesitas
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc, addDoc, deleteDoc, getDoc, orderBy, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Tu configuración de Firebase que pegaste
const firebaseConfig = {
  apiKey: "AIzaSyBRMRsURjYl7tpt3YMmbVpfqQbe6U9_EMM",
  authDomain: "agranel-da89b.firebaseapp.com",
  projectId: "agranel-da89b",
  storageBucket: "agranel-da89b.firebasestorage.app",
  messagingSenderId: "729825875045",
  appId: "1:729825875045:web:10bbf4dac1f7912390628c",
  measurementId: "G-HQMQXVET8Y"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta los servicios que usaremos en otros archivos
export const auth = getAuth(app);
export const db = getFirestore(app);

// Exporta las funciones específicas para que otros scripts las usen
export {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  collection,
  getDocs,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  getDoc,
  orderBy,
  query
};