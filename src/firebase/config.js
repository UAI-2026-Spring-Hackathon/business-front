import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    "[Firebase] 브라우저 Firestore 설정이 비어 있습니다. Vercel(또는 빌드 환경)에 " +
      "VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID 등 웹 앱 설정을 넣고 Redeploy 하세요. " +
      "가이드: business-track/deployment/DEPLOYMENT.md §5.B"
  );
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
