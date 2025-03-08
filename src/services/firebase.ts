// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCWw4DcU0CKPGItJycrP3DWovodDWt3jm8",
  authDomain: "less-is-more-25873.firebaseapp.com",
  projectId: "less-is-more-25873",
  storageBucket: "less-is-more-25873.appspot.com",
  messagingSenderId: "933997070836",
  appId: "1:933997070836:web:7d0f20ecdad430b44951a1",
  measurementId: "G-H25QFY6PX2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firestore and Auth
export const db = getFirestore(app);
export const auth = getAuth(app);
