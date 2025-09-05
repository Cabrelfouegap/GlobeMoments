// utils/userUtils.js
// Fonctions utilitaires pour la gestion des données utilisateur

import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Normalise les données utilisateur pour s'assurer que tous les champs requis sont présents
 * @param {Object} userData - Données utilisateur brutes
 * @param {string} userId - ID de l'utilisateur
 * @returns {Object} Données utilisateur normalisées
 */
export function normalizeUserData(userData, userId) {
  const now = new Date();

  return {
    name: userData?.name || 'Utilisateur',
    email: userData?.email || '',
    createdAt: userData?.createdAt || now,
    updatedAt: userData?.updatedAt || now,
    photoCount: userData?.photoCount || 0,
    isActive: userData?.isActive !== undefined ? userData.isActive : true,
    userId: userId,
  };
}

/**
 * Crée ou met à jour un document utilisateur avec tous les champs requis
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} userData - Données de base de l'utilisateur
 */
export async function ensureUserDocument(userId, userData) {
  try {
    console.log('🔧 Vérification/création du document utilisateur:', userId);

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      // Document existe, vérifier qu'il a tous les champs requis
      const existingData = userDoc.data();
      const normalizedData = normalizeUserData(existingData, userId);

      // Mettre à jour si des champs manquent
      if (JSON.stringify(existingData) !== JSON.stringify(normalizedData)) {
        await updateDoc(userRef, {
          ...normalizedData,
          updatedAt: serverTimestamp(),
        });
        console.log('✅ Document utilisateur mis à jour');
      }
    } else {
      // Créer le document
      const normalizedData = normalizeUserData(userData, userId);
      await setDoc(userRef, {
        ...normalizedData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Document utilisateur créé');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la gestion du document utilisateur:', error);
    throw error;
  }
}

/**
 * Fonction utilitaire pour formater les dates de manière cohérente
 * @param {Date|Object|string} date - Date à formater
 * @returns {Date} Objet Date normalisé
 */
export function normalizeDate(date) {
  if (!date) return new Date();

  // Si c'est un timestamp Firestore
  if (date && typeof date === 'object' && date.toDate) {
    return date.toDate();
  }

  // Si c'est un timestamp en secondes
  if (date && typeof date === 'object' && date.seconds) {
    return new Date(date.seconds * 1000);
  }

  // Si c'est déjà une date
  if (date instanceof Date) {
    return date;
  }

  // Si c'est une chaîne
  if (typeof date === 'string') {
    return new Date(date);
  }

  return new Date();
}

/**
 * Fonction utilitaire pour formater les coordonnées
 * @param {Object} coords - Objet coordonnées
 * @returns {Object|null} Coordonnées normalisées ou null
 */
export function normalizeCoords(coords) {
  if (!coords || typeof coords !== 'object') {
    return null;
  }

  const { latitude, longitude } = coords;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null;
  }

  // Vérifier que les coordonnées sont dans les plages valides
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  return {
    latitude: parseFloat(latitude.toFixed(6)),
    longitude: parseFloat(longitude.toFixed(6)),
  };
}
