// Fichier d'initialisation Firebase, il centralise la configuration et l'accès aux services Firebase
// Les clés sensibles sont gérées via les variables d'environnement

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, addDoc, collection, serverTimestamp, getDocs, doc, updateDoc, increment, query, where } from 'firebase/firestore';
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
export async function uploadImageAsync(uri, userId, path = 'photos') {
  try {
    console.log('🔄 Début upload Firebase Storage:', uri);

    if (!userId) {
      throw new Error('UserId requis pour l\'upload (règles de sécurité)');
    }

    const response = await fetch(uri);
    const blob = await response.blob();

    console.log('📦 Blob créé, taille:', blob.size);

    // Chemin structuré par userId pour respecter les règles de sécurité
    const storageRef = ref(storage, `${path}/${userId}/${Date.now()}`);
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

// Fonction pour mettre à jour le compteur de photos d'un utilisateur
export async function updateUserPhotoCount(userId) {
  try {
    console.log('� Mise à jour du compteur de photos pour:', userId);

    // Compter les photos actives de l'utilisateur
    const photosQuery = query(
      collection(db, 'photos'),
      where('userId', '==', userId),
      where('isActive', '==', true)
    );
    const photosSnapshot = await getDocs(photosQuery);
    const photoCount = photosSnapshot.size;

    // Mettre à jour le document utilisateur
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      photoCount: photoCount,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Compteur de photos mis à jour:', photoCount);
    return photoCount;
  } catch (error) {
    console.error('❌ Erreur mise à jour compteur photos:', error);
    throw error;
  }
}

// Fonction pour supprimer une photo (soft delete)
export async function deletePhotoDocument(photoId, userId) {
  try {
    console.log('�️ Suppression de la photo:', photoId);

    const photoRef = doc(db, 'photos', photoId);
    await updateDoc(photoRef, {
      isActive: false,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Mettre à jour le compteur de photos
    await updateUserPhotoCount(userId);

    console.log('✅ Photo marquée comme supprimée');
  } catch (error) {
    console.error('❌ Erreur suppression photo:', error);
    throw error;
  }
}
// services/firebase.ts
// ... (tout ton code inchangé au-dessus)



export async function createPhotoDocument({ imageUrl, coords, userId, place = null }) {
  try {
    console.log('💾 Début création document Firestore:', { imageUrl, coords, userId, place });

    const docRef = await addDoc(collection(db, 'photos'), {
      imageUrl,
      coords: coords || null,
      userId,
      place: place || null, // <-- ajouté (facultatif)
      date: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
    });

    console.log('✅ Document créé avec ID:', docRef.id);

    await updateUserPhotoCount(userId);

    return docRef;
  } catch (error) {
    console.error('❌ Erreur création document Firestore:', error);
    throw error;
  }
}