// ProfilScreen.js
// Écran de profil utilisateur et statistiques
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, TextInput, Modal } from 'react-native';
import { useAuth } from '../services/auth';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { normalizeUserData, ensureUserDocument, normalizeDate } from '../utils/userUtils';
import * as ImagePicker from 'expo-image-picker';

export default function ProfilScreen() {
  const { user, logout, updateUserPassword, updateUserEmail, updateUserProfile } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [updating, setUpdating] = useState(false);

  // État pour les vraies statistiques
  const [realStats, setRealStats] = useState({
    totalPhotos: 0,
    photosThisMonth: 0,
    photosThisWeek: 0,
    totalLocations: 0,
  });

  // États pour les nouveaux modals
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [nameModalVisible, setNameModalVisible] = useState(false);

  // États pour les formulaires
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  const loadUserData = useCallback(async () => {
    try {
      console.log('📊 Chargement des données utilisateur pour:', user.uid);

      // S'assurer que le document utilisateur existe et est complet
      await ensureUserDocument(user.uid, {
        name: user.displayName || 'Utilisateur',
        email: user.email,
      });

      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log('✅ Données utilisateur trouvées:', data);

        // Normaliser les données
        const normalizedData = normalizeUserData(data, user.uid);
        setUserData(normalizedData);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données utilisateur:', error);
      Alert.alert('Erreur', 'Impossible de charger les données du profil');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadRealStatistics = useCallback(async () => {
    if (!user) return;

    try {
      console.log('📊 Chargement des vraies statistiques pour:', user.uid);

      // Récupérer toutes les photos actives de l'utilisateur
      const photosQuery = query(
        collection(db, 'photos'),
        where('userId', '==', user.uid),
        where('isActive', '==', true)
      );
      const photosSnapshot = await getDocs(photosQuery);
      const photos = photosSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || data.date),
        };
      });

      // Calculer les vraies statistiques
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const photosThisMonth = photos.filter(photo => photo.date >= thisMonth).length;
      const photosThisWeek = photos.filter(photo => photo.date >= thisWeek).length;

      // Compter les lieux uniques
      const uniqueLocations = new Set(
        photos
          .filter(photo => photo.coords)
          .map(photo => `${photo.coords.latitude.toFixed(2)},${photo.coords.longitude.toFixed(2)}`)
      );

      setRealStats({
        totalPhotos: photos.length,
        photosThisMonth,
        photosThisWeek,
        totalLocations: uniqueLocations.size,
      });

      console.log('✅ Statistiques mises à jour:', {
        totalPhotos: photos.length,
        photosThisMonth,
        photosThisWeek,
        totalLocations: uniqueLocations.size,
      });

    } catch (error) {
      console.error('❌ Erreur lors du chargement des vraies statistiques:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadUserData();
      loadRealStatistics();
    }
  }, [user, loadUserData, loadRealStatistics]);

  if (!user) {
    return (
      <View style={styles.container}>
        <Ionicons name="person-circle-outline" size={80} color="#ccc" />
        <Text style={styles.notConnectedText}>Utilisateur non connecté</Text>
        <Text style={styles.notConnectedSubtext}>
          Connectez-vous pour accéder à votre profil
        </Text>
      </View>
    );
  }

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              Alert.alert('Déconnexion', 'Vous avez été déconnecté avec succès.');
            } catch (_error) {
              Alert.alert('Erreur', 'Erreur lors de la déconnexion.');
            }
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    setEditModalVisible(true);
  };

  const handleSaveName = async () => {
    if (!editName.trim()) {
      Alert.alert('Erreur', 'Le nom ne peut pas être vide');
      return;
    }

    setUpdating(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: editName.trim(),
        updatedAt: new Date(),
      });

      setUserData(prev => ({ ...prev, name: editName.trim() }));
      setNameModalVisible(false);
      Alert.alert('Succès', 'Nom mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du nom:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le nom');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Erreur', 'Tous les champs sont requis');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setUpdating(true);
    try {
      await updateUserPassword(currentPassword, newPassword);
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Succès', 'Mot de passe changé avec succès');
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      Alert.alert('Erreur', 'Impossible de changer le mot de passe. Vérifiez votre mot de passe actuel.');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !emailPassword) {
      Alert.alert('Erreur', 'Tous les champs sont requis');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      Alert.alert('Erreur', 'Adresse email invalide');
      return;
    }

    setUpdating(true);
    try {
      await updateUserEmail(newEmail, emailPassword);
      setEmailModalVisible(false);
      setNewEmail('');
      setEmailPassword('');
      Alert.alert('Succès', 'Adresse email changée avec succès. Vérifiez votre nouvelle boîte mail.');
    } catch (error) {
      console.error('Erreur lors du changement d\'email:', error);
      Alert.alert('Erreur', 'Impossible de changer l\'adresse email. Vérifiez votre mot de passe.');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangeAvatar = async () => {
    try {
      // Demander les permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin d\'accéder à votre galerie pour changer l\'avatar.');
        return;
      }

      // Ouvrir le sélecteur d'images
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUpdating(true);
        const imageUri = result.assets[0].uri;

        // Ici vous pourriez uploader l'image vers Firebase Storage
        // Pour l'instant, on met juste à jour le profil avec l'URI local
        await updateUserProfile({
          photoURL: imageUri,
        });

        setAvatarModalVisible(false);
        Alert.alert('Succès', 'Avatar mis à jour avec succès');
      }
    } catch (error) {
      console.error('Erreur lors du changement d\'avatar:', error);
      Alert.alert('Erreur', 'Impossible de changer l\'avatar');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Ionicons name="person-circle" size={80} color="#007AFF" />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          {user.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person-circle" size={90} color="#007AFF" />
          )}
        </View>
        <Text style={styles.name}>
          {userData?.name || user.displayName || 'Utilisateur'}
        </Text>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.userId}>ID: {user.uid.substring(0, 8)}...</Text>
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Ionicons name="pencil" size={16} color="#007AFF" />
          <Text style={styles.editButtonText}>Modifier le profil</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsBox}>
        <Text style={styles.statsTitle}>Statistiques</Text>
        <View style={styles.statRow}>
          <Ionicons name="camera" size={24} color="#007AFF" />
          <Text style={styles.stats}>Photos sauvegardées</Text>
          <Text style={styles.statsValue}>{realStats.totalPhotos}</Text>
        </View>
        <View style={styles.statRow}>
          <Ionicons name="calendar" size={24} color="#007AFF" />
          <Text style={styles.stats}>Ce mois-ci</Text>
          <Text style={styles.statsValue}>{realStats.photosThisMonth}</Text>
        </View>
        <View style={styles.statRow}>
          <Ionicons name="time" size={24} color="#007AFF" />
          <Text style={styles.stats}>Cette semaine</Text>
          <Text style={styles.statsValue}>{realStats.photosThisWeek}</Text>
        </View>
        <View style={styles.statRow}>
          <Ionicons name="map" size={24} color="#007AFF" />
          <Text style={styles.stats}>Lieux visités</Text>
          <Text style={styles.statsValue}>{realStats.totalLocations}</Text>
        </View>
        <View style={styles.statRow}>
          <Ionicons name="person" size={24} color="#007AFF" />
          <Text style={styles.stats}>Membre depuis</Text>
          <Text style={styles.statsValue}>
            {userData?.createdAt ?
              normalizeDate(userData.createdAt).toLocaleDateString('fr-FR') :
              'N/A'
            }
          </Text>
        </View>

        <TouchableOpacity style={styles.refreshStatsButton} onPress={loadRealStatistics}>
          <Ionicons name="refresh" size={16} color="#007AFF" />
          <Text style={styles.refreshStatsText}>Actualiser les stats</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={20} color="#FF3B30" />
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>

      <View style={styles.connectionBox}>
        <Text style={styles.connectionTitle}>Infos de connexion</Text>
        <Text style={styles.connectionText}>UID: {user.uid}</Text>
        <Text style={styles.connectionText}>Email: {user.email}</Text>
        <Text style={styles.connectionText}>Email vérifié: {user.emailVerified ? 'Oui' : 'Non'}</Text>
        <Text style={styles.connectionText}>
          Créé le: {user.metadata?.creationTime ?
            new Date(user.metadata.creationTime).toLocaleString('fr-FR') :
            'N/A'
          }
        </Text>
        <Text style={styles.connectionText}>
          Dernière connexion: {user.metadata?.lastSignInTime ?
            new Date(user.metadata.lastSignInTime).toLocaleString('fr-FR') :
            'N/A'
          }
        </Text>
      </View>

      {/* Modal d'édition du profil */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifier le profil</Text>

            <Text style={styles.modalSubtitle}>Choisissez ce que vous souhaitez modifier :</Text>

            {/* Bouton modifier le nom */}
            <TouchableOpacity
              style={styles.editOptionButton}
              onPress={() => {
                setEditModalVisible(false);
                setEditName(userData?.name || user.displayName || '');
                setTimeout(() => setNameModalVisible(true), 300);
              }}
            >
              <Ionicons name="person" size={24} color="#007AFF" />
              <View style={styles.editOptionContent}>
                <Text style={styles.editOptionTitle}>Nom d&apos;utilisateur</Text>
                <Text style={styles.editOptionSubtitle}>
                  {userData?.name || user.displayName || 'Non défini'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            {/* Bouton changer mot de passe */}
            <TouchableOpacity
              style={styles.editOptionButton}
              onPress={() => {
                setEditModalVisible(false);
                setTimeout(() => setPasswordModalVisible(true), 300);
              }}
            >
              <Ionicons name="key" size={24} color="#007AFF" />
              <View style={styles.editOptionContent}>
                <Text style={styles.editOptionTitle}>Mot de passe</Text>
                <Text style={styles.editOptionSubtitle}>••••••••</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            {/* Bouton changer email */}
            <TouchableOpacity
              style={styles.editOptionButton}
              onPress={() => {
                setEditModalVisible(false);
                setTimeout(() => setEmailModalVisible(true), 300);
              }}
            >
              <Ionicons name="mail" size={24} color="#007AFF" />
              <View style={styles.editOptionContent}>
                <Text style={styles.editOptionTitle}>Adresse email</Text>
                <Text style={styles.editOptionSubtitle}>{user.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            {/* Bouton changer avatar */}
            <TouchableOpacity
              style={styles.editOptionButton}
              onPress={() => {
                setEditModalVisible(false);
                setTimeout(() => setAvatarModalVisible(true), 300);
              }}
            >
              <Ionicons name="camera" size={24} color="#007AFF" />
              <View style={styles.editOptionContent}>
                <Text style={styles.editOptionTitle}>Photo de profil</Text>
                <Text style={styles.editOptionSubtitle}>
                  {user.photoURL ? 'Photo définie' : 'Aucune photo'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de changement de mot de passe */}
      <Modal
        visible={passwordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Changer le mot de passe</Text>

            <Text style={styles.inputLabel}>Mot de passe actuel</Text>
            <TextInput
              style={styles.textInput}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Entrez votre mot de passe actuel"
              secureTextEntry={true}
            />

            <Text style={styles.inputLabel}>Nouveau mot de passe</Text>
            <TextInput
              style={styles.textInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Entrez votre nouveau mot de passe"
              secureTextEntry={true}
            />

            <Text style={styles.inputLabel}>Confirmer le nouveau mot de passe</Text>
            <TextInput
              style={styles.textInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirmez votre nouveau mot de passe"
              secureTextEntry={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setPasswordModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleChangePassword}
                disabled={updating}
              >
                <Text style={styles.saveButtonText}>
                  {updating ? 'Changement...' : 'Changer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de changement d'email */}
      <Modal
        visible={emailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Changer l&apos;adresse email</Text>

            <Text style={styles.inputLabel}>Nouvelle adresse email</Text>
            <TextInput
              style={styles.textInput}
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="Entrez votre nouvelle adresse email"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Mot de passe actuel</Text>
            <TextInput
              style={styles.textInput}
              value={emailPassword}
              onChangeText={setEmailPassword}
              placeholder="Entrez votre mot de passe actuel"
              secureTextEntry={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEmailModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleChangeEmail}
                disabled={updating}
              >
                <Text style={styles.saveButtonText}>
                  {updating ? 'Changement...' : 'Changer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de changement d'avatar */}
      <Modal
        visible={avatarModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Changer l&apos;avatar</Text>

            <Text style={styles.avatarModalText}>
              Choisissez une image depuis votre galerie pour votre avatar.
            </Text>

            <View style={styles.avatarPreview}>
              {user.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.avatarPreviewImage} />
              ) : (
                <Ionicons name="person-circle" size={80} color="#007AFF" />
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setAvatarModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleChangeAvatar}
                disabled={updating}
              >
                <Text style={styles.saveButtonText}>
                  {updating ? 'Changement...' : 'Choisir image'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de changement de nom */}
      <Modal
        visible={nameModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifier le nom</Text>

            <Text style={styles.inputLabel}>Nom d&apos;utilisateur</Text>
            <TextInput
              style={styles.textInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Entrez votre nom"
              maxLength={50}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setNameModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveName}
                disabled={updating}
              >
                <Text style={styles.saveButtonText}>
                  {updating ? 'Sauvegarde...' : 'Sauvegarder'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  userId: {
    fontSize: 12,
    color: '#999',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 10,
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  notConnectedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
  },
  notConnectedSubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  statsBox: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  stats: {
    fontSize: 16,
    color: '#555',
    marginLeft: 10,
    flex: 1,
  },
  statsValue: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    marginTop: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF3B30',
    backgroundColor: '#fff',
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  connectionBox: {
    backgroundColor: '#f8f9fa',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  connectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  connectionText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  editOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  editOptionContent: {
    flex: 1,
    marginLeft: 15,
  },
  editOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  editOptionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 15,
  },
  actionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
  },
  avatarModalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  avatarPreview: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarPreviewImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  refreshStatsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 15,
    alignSelf: 'center',
  },
  refreshStatsText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
