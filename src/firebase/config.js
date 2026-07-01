import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyAEpnBc8tNm1Mv1l7sn_gtwrdRpLRMvKhY",
  authDomain: "medchem-38bb3.firebaseapp.com",
  projectId: "medchem-38bb3",
  storageBucket: "medchem-38bb3.firebasestorage.app",
  messagingSenderId: "713536066339",
  appId: "1:713536066339:web:e87c0d769be0958c2bf296"
};

const app = initializeApp(firebaseConfig);

export default app;