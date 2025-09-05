import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signOut,
  updatePassword,
  updateEmail,
  updateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { auth } from './firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔐 État d\'authentification changé:', user ? 'connecté' : 'déconnecté', user?.email);
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      console.log('🚪 Déconnexion en cours...');
      await signOut(auth);
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      throw error;
    }
  };

  const updateUserPassword = async (currentPassword, newPassword) => {
    try {
      if (!user) throw new Error('Utilisateur non connecté');

      // Réauthentifier l'utilisateur
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Mettre à jour le mot de passe
      await updatePassword(user, newPassword);
      console.log('✅ Mot de passe mis à jour avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du mot de passe:', error);
      throw error;
    }
  };

  const updateUserEmail = async (newEmail, password) => {
    try {
      if (!user) throw new Error('Utilisateur non connecté');

      // Réauthentifier l'utilisateur
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Mettre à jour l'email
      await updateEmail(user, newEmail);
      console.log('✅ Email mis à jour avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de l\'email:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      if (!user) throw new Error('Utilisateur non connecté');

      await updateProfile(user, updates);
      console.log('✅ Profil mis à jour avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      logout,
      updateUserPassword,
      updateUserEmail,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
