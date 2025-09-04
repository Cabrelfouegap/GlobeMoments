// scripts/migrateData.js
// Script de migration pour normaliser les données existantes

import { collection, getDocs, doc, updateDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { normalizeUserData, normalizeDate, normalizeCoords } from '../utils/userUtils';

/**
 * Migre les documents utilisateur pour ajouter les champs manquants
 */
export async function migrateUserDocuments() {
  try {
    console.log('🚀 Début de la migration des utilisateurs...');

    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`📊 ${usersSnapshot.size} utilisateurs trouvés`);

    let migratedCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      console.log(`🔧 Migration de l'utilisateur: ${userId}`);

      // Utiliser la fonction de normalisation pour vérifier les données
      const normalizedData = normalizeUserData(userData, userId);
      const currentData = { ...userData, userId };

      // Comparer les données normalisées avec les données actuelles
      const needsUpdate = Object.keys(normalizedData).some(key => {
        if (key === 'createdAt' || key === 'updatedAt') {
          return false; // Ne pas comparer les dates pour éviter les faux positifs
        }
        return normalizedData[key] !== currentData[key];
      });

      if (needsUpdate || !userData.updatedAt || userData.photoCount === undefined || userData.isActive === undefined) {
        const updates = {};

        // Ajouter les champs manquants
        if (!userData.updatedAt) {
          updates.updatedAt = userData.createdAt || serverTimestamp();
        }

        if (userData.photoCount === undefined) {
          updates.photoCount = 0;
        }

        if (userData.isActive === undefined) {
          updates.isActive = true;
        }

        // Normaliser les dates
        if (userData.createdAt) {
          const normalizedDate = normalizeDate(userData.createdAt);
          if (normalizedDate.getTime() !== userData.createdAt?.toDate?.()?.getTime?.()) {
            updates.createdAt = normalizedDate;
          }
        }

        // Appliquer les mises à jour si nécessaire
        if (Object.keys(updates).length > 0) {
          await updateDoc(doc(db, 'users', userId), updates);
          migratedCount++;
          console.log(`✅ Utilisateur ${userId} migré`);
        }
      }
    }

    console.log(`🎉 Migration terminée: ${migratedCount} utilisateurs mis à jour`);
    return { success: true, migratedCount };

  } catch (error) {
    console.error('❌ Erreur lors de la migration des utilisateurs:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Migre les documents photo pour ajouter les champs manquants
 */
export async function migratePhotoDocuments() {
  try {
    console.log('🚀 Début de la migration des photos...');

    const photosSnapshot = await getDocs(collection(db, 'photos'));
    console.log(`📊 ${photosSnapshot.size} photos trouvées`);

    let migratedCount = 0;

    for (const photoDoc of photosSnapshot.docs) {
      const photoId = photoDoc.id;
      const photoData = photoDoc.data();

      console.log(`🔧 Migration de la photo: ${photoId}`);

      const updates = {};

      // Ajouter createdAt si manquant
      if (!photoData.createdAt) {
        updates.createdAt = photoData.date || serverTimestamp();
      }

      // Ajouter updatedAt si manquant
      if (!photoData.updatedAt) {
        updates.updatedAt = photoData.createdAt || photoData.date || serverTimestamp();
      }

      // Ajouter isActive si manquant
      if (photoData.isActive === undefined) {
        updates.isActive = true;
      }

      // Normaliser les coordonnées
      if (photoData.coords) {
        const normalizedCoords = normalizeCoords(photoData.coords);
        if (normalizedCoords && JSON.stringify(normalizedCoords) !== JSON.stringify(photoData.coords)) {
          updates.coords = normalizedCoords;
        }
      }

      // Normaliser les dates
      if (photoData.date) {
        const normalizedDate = normalizeDate(photoData.date);
        if (normalizedDate.getTime() !== photoData.date?.toDate?.()?.getTime?.()) {
          updates.date = normalizedDate;
        }
      }

      // Appliquer les mises à jour si nécessaire
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'photos', photoId), updates);
        migratedCount++;
        console.log(`✅ Photo ${photoId} migrée`);
      }
    }

    console.log(`🎉 Migration terminée: ${migratedCount} photos mises à jour`);
    return { success: true, migratedCount };

  } catch (error) {
    console.error('❌ Erreur lors de la migration des photos:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Recalcule et met à jour les compteurs de photos pour tous les utilisateurs
 */
export async function recalculatePhotoCounts() {
  try {
    console.log('🔢 Début du recalcul des compteurs de photos...');

    // Récupérer tous les utilisateurs
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`👥 ${usersSnapshot.size} utilisateurs trouvés`);

    let updatedCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      // Compter les photos actives de cet utilisateur
      const photosQuery = query(
        collection(db, 'photos'),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );
      const photosSnapshot = await getDocs(photosQuery);
      const actualPhotoCount = photosSnapshot.size;

      // Mettre à jour le compteur si nécessaire
      const currentPhotoCount = userDoc.data().photoCount || 0;
      if (actualPhotoCount !== currentPhotoCount) {
        await updateDoc(doc(db, 'users', userId), {
          photoCount: actualPhotoCount,
          updatedAt: serverTimestamp(),
        });
        updatedCount++;
        console.log(`✅ Compteur mis à jour pour ${userId}: ${currentPhotoCount} → ${actualPhotoCount}`);
      }
    }

    console.log(`🎉 Recalcul terminé: ${updatedCount} compteurs mis à jour`);
    return { success: true, updatedCount };

  } catch (error) {
    console.error('❌ Erreur lors du recalcul des compteurs:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fonction principale de migration
 */
export async function runMigration() {
  try {
    console.log('🚀 Début de la migration complète...');

    const results = {
      users: await migrateUserDocuments(),
      photos: await migratePhotoDocuments(),
      counts: await recalculatePhotoCounts(),
    };

    console.log('🎉 Migration complète terminée!');
    console.log('📊 Résultats:', results);

    return results;

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    return { success: false, error: error.message };
  }
}

// Export par défaut pour utilisation en module
export default {
  migrateUserDocuments,
  migratePhotoDocuments,
  recalculatePhotoCounts,
  runMigration,
};
