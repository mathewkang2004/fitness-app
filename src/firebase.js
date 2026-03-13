// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDGzHS2J12WFDQ0hZfI7Zk4nZZOZ4GEwt8",
  authDomain: "mathewfitness-be34d.firebaseapp.com",
  projectId: "mathewfitness-be34d",
  storageBucket: "mathewfitness-be34d.firebasestorage.app",
  messagingSenderId: "1074304346817",
  appId: "1:1074304346817:web:f37ab6219c161dbc6b8240"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);