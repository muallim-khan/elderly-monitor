// // src/firebase.js
// import { initializeApp } from "firebase/app";
// import { getFirestore } from "firebase/firestore"; // ✅ Add this
// import { getAuth } from "firebase/auth";
// import { getAnalytics } from "firebase/analytics";

// import { initializeApp } from 'firebase/app';
// import { getFirestore } from 'firebase/firestore';
// import { getAuth } from 'firebase/auth';
// import { getMessaging } from 'firebase/messaging';
// // // Initialize Firebase
// // const app = initializeApp(firebaseConfig);
// // export const db = getFirestore(app);
// // export const auth = getAuth(app);
// // export const messaging = getMessaging(app);
// // export default app;

// const firebaseConfig = {
//   apiKey: "AIzaSyCFWJYM-fALa1hm927FtkofZY0Q1V8dhx8",
//   authDomain: "medicine-monitoring.firebaseapp.com",
//   projectId: "medicine-monitoring",
//   storageBucket: "medicine-monitoring.firebasestorage.app",
//   messagingSenderId: "1091737782608",
//   appId: "1:1091737782608:web:13620a31dcf2b36ed10455",
//   measurementId: "G-JFC0E5BV7R"
// };





// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// const db = getFirestore(app); // ✅ Create the Firestore instance

// export { auth, db }; // ✅ Export both
// export default app;
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCFWJYM-fALa1hm927FtkofZY0Q1V8dhx8",
  authDomain: "medicine-monitoring.firebaseapp.com",
  projectId: "medicine-monitoring",
  storageBucket: "medicine-monitoring.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Get from Firebase Console
  appId: "YOUR_APP_ID" // Get from Firebase Console
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const messaging = getMessaging(app);
export default app;