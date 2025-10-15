const firebaseConfig = {
  apiKey: "AIzaSyDDzHRf0h1CunVS8-U6WL0SAdeI_5_UA5E",
  authDomain: "pascomhub.firebaseapp.com",
  projectId: "pascomhub",
  storageBucket: "pascomhub.firebasestorage.app",
  messagingSenderId: "118874428173",
  appId: "1:118874428173:web:42a67bd430ceb168a01644"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();