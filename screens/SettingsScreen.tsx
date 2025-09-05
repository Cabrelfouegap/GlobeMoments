import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/auth';
import { useTheme } from '../services/ThemeContext';
import { signOut, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

export default function SettingsScreen() {
  const { user } = useAuth();
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState('');

  const handleProfileNavigation = () => {
    navigation.navigate('Profil');
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              // Navigation vers l'écran de connexion sera gérée par le contexte d'authentification
              console.log('User signed out');
            } catch (error) {
              console.error('Erreur de déconnexion:', error);
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    setDeleteModalVisible(true);
  };

  const confirmDeleteAccount = async () => {
    if (!password.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre mot de passe pour confirmer la suppression.');
      return;
    }

    setIsDeleting(true);
    setDeleteProgress('Préparation de la suppression...');

    try {
      console.log('🗑️ Début de la suppression du compte pour:', user?.uid);

      // Étape 1: Réauthentification de l'utilisateur
      setDeleteProgress('Vérification de l\'authentification...');
      if (auth.currentUser && auth.currentUser.email) {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
        await reauthenticateWithCredential(auth.currentUser, credential);
        console.log('✅ Réauthentification réussie');
      }

      // Étape 2: Supprimer toutes les photos de l'utilisateur
      setDeleteProgress('Suppression des photos...');
      console.log('📸 Suppression des photos...');
      const photosQuery = query(
        collection(db, 'photos'),
        where('userId', '==', user.uid)
      );
      const photosSnapshot = await getDocs(photosQuery);

      if (photosSnapshot.docs.length > 0) {
        const deletePromises = photosSnapshot.docs.map(async (photoDoc, index) => {
          setDeleteProgress(`Suppression de la photo ${index + 1}/${photosSnapshot.docs.length}...`);
          console.log('🗑️ Suppression de la photo:', photoDoc.id);
          await deleteDoc(doc(db, 'photos', photoDoc.id));
        });

        await Promise.all(deletePromises);
        console.log(`✅ ${photosSnapshot.docs.length} photos supprimées`);
      }

      // Étape 3: Supprimer le document utilisateur
      setDeleteProgress('Suppression du profil...');
      console.log('👤 Suppression du profil utilisateur...');
      const userDocRef = doc(db, 'users', user.uid);
      await deleteDoc(userDocRef);
      console.log('✅ Profil utilisateur supprimé');

      // Étape 4: Supprimer le compte Firebase Auth
      setDeleteProgress('Suppression du compte...');
      console.log('🔥 Suppression du compte Firebase Auth...');
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
        console.log('✅ Compte Firebase Auth supprimé');
      } else {
        throw new Error('Utilisateur non authentifié');
      }

      setDeleteModalVisible(false);
      setPassword('');

      Alert.alert(
        'Compte supprimé',
        'Votre compte et toutes vos données ont été supprimés définitivement.',
        [
          {
            text: 'OK',
            onPress: () => {
              // La navigation sera gérée automatiquement par le contexte d'authentification
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression du compte:', error);

      let errorMessage = 'Une erreur inattendue s\'est produite.';

      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Mot de passe incorrect. Veuillez réessayer.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      } else if (error.code === 'permission-denied') {
        errorMessage = 'Erreur de permissions. Impossible de supprimer vos données.';
      } else if (error.code === 'not-found') {
        errorMessage = 'Certaines données n\'ont pas été trouvées.';
      }

      Alert.alert(
        'Erreur de suppression',
        errorMessage,
        [
          {
            text: 'Réessayer',
            onPress: () => {
              setIsDeleting(false);
              setDeleteProgress('');
            }
          },
          {
            text: 'Annuler',
            style: 'cancel',
            onPress: () => {
              setDeleteModalVisible(false);
              setPassword('');
              setIsDeleting(false);
              setDeleteProgress('');
            }
          }
        ]
      );
    } finally {
      // Le nettoyage est géré dans le catch si nécessaire
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        {/* Header du profil */}
        <View style={[styles.header, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.profileInfo}>
            <Ionicons name="person-circle" size={60} color={theme.primary} />
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: theme.text }]}>
                {user?.email?.split('@')[0] || 'Utilisateur'}
              </Text>
              <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Section Mon Profil */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Mon Profil</Text>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={handleProfileNavigation}>
            <Ionicons name="person" size={24} color={theme.primary} />
            <Text style={[styles.menuText, { color: theme.text }]}>Voir mon profil complet</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={() => navigation.navigate('Statistiques')}>
            <Ionicons name="stats-chart" size={24} color={theme.primary} />
            <Text style={[styles.menuText, { color: theme.text }]}>Statistiques</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Section Préférences */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Préférences</Text>

          <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
            <View style={styles.settingLeft}>
              <Ionicons name={isDarkMode ? "moon" : "sunny"} size={24} color={theme.primary} />
              <Text style={[styles.settingText, { color: theme.text }]}>Mode {isDarkMode ? 'sombre' : 'clair'}</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={24} color={theme.primary} />
              <Text style={[styles.settingText, { color: theme.text }]}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="location" size={24} color={theme.primary} />
              <Text style={[styles.settingText, { color: theme.text }]}>Géolocalisation</Text>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="save" size={24} color={theme.primary} />
              <Text style={[styles.settingText, { color: theme.text }]}>Sauvegarde automatique</Text>
            </View>
            <Switch
              value={autoSaveEnabled}
              onValueChange={setAutoSaveEnabled}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Section Stockage */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Stockage</Text>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]}>
            <Ionicons name="cloud-download" size={24} color={theme.primary} />
            <Text style={[styles.menuText, { color: theme.text }]}>Sauvegarder les données</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]}>
            <Ionicons name="cloud-upload" size={24} color={theme.primary} />
            <Text style={[styles.menuText, { color: theme.text }]}>Restaurer les données</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Section Support */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Support</Text>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]}>
            <Ionicons name="help-circle" size={24} color={theme.primary} />
            <Text style={[styles.menuText, { color: theme.text }]}>Aide & FAQ</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]}>
            <Ionicons name="mail" size={24} color={theme.primary} />
            <Text style={[styles.menuText, { color: theme.text }]}>Contactez-nous</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]}>
            <Ionicons name="information-circle" size={24} color={theme.primary} />
            <Text style={[styles.menuText, { color: theme.text }]}>À propos</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Section Compte */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Compte</Text>

          <TouchableOpacity
            style={[styles.menuItem, styles.signOutButton, { borderBottomColor: theme.border }]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out" size={24} color="#ff3b30" />
            <Text style={[styles.menuText, styles.signOutText]}>Se déconnecter</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.deleteButton, { borderBottomColor: theme.border }]}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash" size={24} color="#ff3b30" />
            <Text style={[styles.menuText, styles.deleteText]}>Supprimer le compte</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: theme.textSecondary }]}>GlobeMoments v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Modal de confirmation de suppression */}
      <Modal
        visible={deleteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (!isDeleting) {
            setDeleteModalVisible(false);
            setPassword('');
          }
        }}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>⚠️ Supprimer le compte</Text>

            <Text style={[styles.modalWarning, { color: theme.text }]}>
              Cette action est <Text style={[styles.boldText, { color: '#ff3b30' }]}>irréversible</Text>.
              Toutes vos données seront supprimées définitivement :
            </Text>

            <View style={[styles.warningList, { backgroundColor: theme.warningBackground, borderColor: '#ff3b30' }]}>
              <Text style={[styles.warningItem, { color: theme.textSecondary }]}>• Toutes vos photos</Text>
              <Text style={[styles.warningItem, { color: theme.textSecondary }]}>• Votre profil utilisateur</Text>
              <Text style={[styles.warningItem, { color: theme.textSecondary }]}>• Vos statistiques</Text>
              <Text style={[styles.warningItem, { color: theme.textSecondary }]}>• Votre compte complet</Text>
            </View>

            <Text style={[styles.passwordLabel, { color: theme.text }]}>
              Pour confirmer, saisissez votre mot de passe :
            </Text>
            <TextInput
              style={[styles.passwordInput, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Votre mot de passe"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={true}
              editable={!isDeleting}
              autoCapitalize="none"
            />

            {isDeleting && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#ff3b30" />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>{deleteProgress}</Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.buttonSecondary }]}
                onPress={() => {
                  if (!isDeleting) {
                    setDeleteModalVisible(false);
                    setPassword('');
                  }
                }}
                disabled={isDeleting}
              >
                <Text style={[styles.buttonText, isDeleting && styles.disabledText, { color: theme.text }]}>
                  Annuler
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.deleteConfirmButton]}
                onPress={confirmDeleteAccount}
                disabled={isDeleting || !password.trim()}
              >
                <Text style={[styles.buttonText, styles.deleteConfirmText]}>
                  {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  signOutButton: {
    borderBottomWidth: 0,
  },
  signOutText: {
    color: '#ff3b30',
  },
  deleteButton: {
    borderBottomWidth: 0,
  },
  deleteText: {
    color: '#ff3b30',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalWarning: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#ff3b30',
  },
  warningList: {
    backgroundColor: '#fff5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  warningItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    lineHeight: 20,
  },
  passwordLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  deleteConfirmButton: {
    backgroundColor: '#ff3b30',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteConfirmText: {
    color: '#fff',
  },
  disabledText: {
    color: '#ccc',
  },
});
