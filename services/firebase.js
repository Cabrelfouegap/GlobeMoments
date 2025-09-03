// Fichier d'initialisation Firebase, il centralise la configuration et l'accès aux services Firebase
// Les clés sensibles sont gérées via les variables d'environnement

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Constants from 'expo-constants';

// On récupère la config depuis les variables d'environnement
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: Constants.expoConfig?.extra?.FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: Constants.expoConfig?.extra?.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: Constants.expoConfig?.extra?.FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Constants.expoConfig?.extra?.FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig?.extra?.FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
const db = getFirestore(app);
const storage = getStorage(app);

// Helper pour uploader une image
export async function uploadImageAsync(uri, path = 'photos') {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(storage, `${path}/${Date.now()}`);
  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
}

// Helper pour créer un document photo
export async function createPhotoDocument({ imageUrl, coords, userId }) {
  await addDoc(collection(db, 'photos'), {
    imageUrl,
    coords,
    userId,
    date: serverTimestamp(),
  });
}

export { auth, db, storage };