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
  try {
    console.log('🔄 Début upload Firebase Storage:', uri);

    const response = await fetch(uri);
    const blob = await response.blob();

    console.log('📦 Blob créé, taille:', blob.size);

    const storageRef = ref(storage, `${path}/${Date.now()}`);
    console.log('📁 Référence storage créée:', storageRef.fullPath);

    const uploadResult = await uploadBytes(storageRef, blob);
    console.log('✅ Upload réussi:', uploadResult);

    const downloadURL = await getDownloadURL(storageRef);
    console.log('🔗 URL de téléchargement obtenue:', downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('❌ Erreur upload Firebase:', error);
    throw error;
  }
}

// Helper pour créer un document photo
export async function createPhotoDocument({ imageUrl, coords, userId }) {
  try {
    console.log('💾 Début création document Firestore:', { imageUrl, coords, userId });

    const docRef = await addDoc(collection(db, 'photos'), {
      imageUrl,
      coords,
      userId,
      date: serverTimestamp(),
    });

    console.log('✅ Document créé avec ID:', docRef.id);
    return docRef;
  } catch (error) {
    console.error('❌ Erreur création document Firestore:', error);
    throw error;
  }
}

export { auth, db, storage };

// Fonction de test pour vérifier la connexion Firebase
export async function testFirebaseConnection() {
  try {
    console.log('🧪 Test de connexion Firebase...');

    // Test Firestore
    const testDoc = await addDoc(collection(db, 'test'), {
      test: true,
      timestamp: serverTimestamp(),
    });
    console.log('✅ Firestore fonctionne, document test créé:', testDoc.id);

    // Test Storage (créer une référence)
    const testStorageRef = ref(storage, 'test/test.txt');
    console.log('✅ Storage fonctionne, référence créée:', testStorageRef.fullPath);

    // Nettoyer le document de test
    // await deleteDoc(testDoc); // On laisse pour le moment pour vérifier

    return { success: true, message: 'Firebase fonctionne correctement' };
  } catch (error) {
    console.error('❌ Erreur de connexion Firebase:', error);
    return { success: false, message: error.message, error };
  }
}