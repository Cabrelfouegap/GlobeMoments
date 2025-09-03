// ProfilScreen.js
// Écran de profil utilisateur et statistiques
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { useAuth } from '../services/auth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProfilScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Utilisateur non connecté</Text>
      </View>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      Alert.alert('Déconnexion', 'Vous avez été déconnecté.');
    } catch (_error) {
      Alert.alert('Erreur', 'Erreur lors de la déconnexion.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        {user.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
        ) : (
          <Ionicons name="person-circle" size={90} color="#007AFF" />
        )}
      </View>
      <Text style={styles.nom}>{user.displayName || user.email}</Text>
      <Text style={styles.email}>{user.email}</Text>
      <View style={styles.statsBox}>
        <Text style={styles.stats}>Photos : <Text style={styles.statsValue}>0</Text></Text>
        <Text style={styles.stats}>Lieux visités : <Text style={styles.statsValue}>0</Text></Text>
        <Text style={styles.stats}>Dernier voyage : <Text style={styles.statsValue}>Aucun</Text></Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/profil/settings')}>
        <Ionicons name="settings" size={20} color="#fff" />
        <Text style={styles.buttonText}>Paramètres</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eaf6fb',
    padding: 24,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 18,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  nom: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#555',
    marginBottom: 18,
  },
  statsBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    width: '90%',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  stats: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  statsValue: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginBottom: 10,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  logoutButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
  },
});
