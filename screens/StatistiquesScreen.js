// StatistiquesScreen.js
// Écran d'affichage des statistiques utilisateur
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function StatistiquesScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPhotos: 0,
    photosThisMonth: 0,
    photosThisWeek: 0,
    totalLocations: 0,
    favoriteCountry: 'N/A',
    firstPhotoDate: null,
    lastPhotoDate: null,
  });
  const [loading, setLoading] = useState(true);

  const loadStatistics = useCallback(async () => {
    if (!user) return;

    try {
      console.log('📊 Chargement des statistiques pour:', user.uid);

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

      // Calculer les statistiques
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

      // Trouver les dates extrêmes
      const sortedPhotos = photos.sort((a, b) => a.date - b.date);
      const firstPhotoDate = sortedPhotos.length > 0 ? sortedPhotos[0].date : null;
      const lastPhotoDate = sortedPhotos.length > 0 ? sortedPhotos[sortedPhotos.length - 1].date : null;

      setStats({
        totalPhotos: photos.length,
        photosThisMonth,
        photosThisWeek,
        totalLocations: uniqueLocations.size,
        favoriteCountry: 'N/A', // À implémenter avec une API de géocodage inverse
        firstPhotoDate,
        lastPhotoDate,
      });

    } catch (error) {
      console.error('❌ Erreur lors du chargement des statistiques:', error);
      Alert.alert('Erreur', 'Impossible de charger les statistiques');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getMotivationalMessage = () => {
    const { totalPhotos } = stats;
    if (totalPhotos === 0) return "Commencez votre aventure photographique ! 📸";
    if (totalPhotos < 5) return "Chaque photo raconte une histoire ! 📖";
    if (totalPhotos < 20) return "Vous êtes sur la bonne voie ! 🌟";
    if (totalPhotos < 50) return "Excellent travail ! Vous êtes un globe-trotter ! ✈️";
    return "Vous êtes un véritable explorateur ! 🗺️";
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Ionicons name="person-circle-outline" size={80} color="#ccc" />
        <Text style={styles.notConnectedText}>Utilisateur non connecté</Text>
        <Text style={styles.notConnectedSubtext}>
          Connectez-vous pour voir vos statistiques
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Ionicons name="stats-chart" size={80} color="#007AFF" />
        <Text style={styles.loadingText}>Chargement des statistiques...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header avec message motivant */}
      <View style={styles.header}>
        <Ionicons name="stats-chart" size={60} color="#007AFF" />
        <Text style={styles.headerTitle}>Vos Statistiques</Text>
        <Text style={styles.motivationalText}>{getMotivationalMessage()}</Text>
      </View>

      {/* Section Photos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📸 Photos</Text>

        <View style={styles.statCard}>
          <View style={styles.statRow}>
            <Ionicons name="images" size={24} color="#007AFF" />
            <Text style={styles.statLabel}>Total des photos</Text>
            <Text style={styles.statValue}>{stats.totalPhotos}</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statRow}>
            <Ionicons name="calendar" size={24} color="#007AFF" />
            <Text style={styles.statLabel}>Ce mois-ci</Text>
            <Text style={styles.statValue}>{stats.photosThisMonth}</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statRow}>
            <Ionicons name="time" size={24} color="#007AFF" />
            <Text style={styles.statLabel}>Cette semaine</Text>
            <Text style={styles.statValue}>{stats.photosThisWeek}</Text>
          </View>
        </View>
      </View>

      {/* Section Lieux */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Lieux</Text>

        <View style={styles.statCard}>
          <View style={styles.statRow}>
            <Ionicons name="location" size={24} color="#007AFF" />
            <Text style={styles.statLabel}>Lieux visités</Text>
            <Text style={styles.statValue}>{stats.totalLocations}</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statRow}>
            <Ionicons name="flag" size={24} color="#007AFF" />
            <Text style={styles.statLabel}>Pays favori</Text>
            <Text style={styles.statValue}>{stats.favoriteCountry}</Text>
          </View>
        </View>
      </View>

      {/* Section Chronologie */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Chronologie</Text>

        <View style={styles.statCard}>
          <View style={styles.statRow}>
            <Ionicons name="play" size={24} color="#007AFF" />
            <Text style={styles.statLabel}>Première photo</Text>
            <Text style={styles.statValueSmall}>{formatDate(stats.firstPhotoDate)}</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statRow}>
            <Ionicons name="stop" size={24} color="#007AFF" />
            <Text style={styles.statLabel}>Dernière photo</Text>
            <Text style={styles.statValueSmall}>{formatDate(stats.lastPhotoDate)}</Text>
          </View>
        </View>
      </View>

      {/* Section Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 Réalisations</Text>

        <View style={styles.achievementCard}>
          <Ionicons
            name={stats.totalPhotos >= 1 ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={stats.totalPhotos >= 1 ? "#34c759" : "#ccc"}
          />
          <Text style={[styles.achievementText, stats.totalPhotos >= 1 && styles.achievementCompleted]}>
            Première photo prise
          </Text>
        </View>

        <View style={styles.achievementCard}>
          <Ionicons
            name={stats.totalPhotos >= 10 ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={stats.totalPhotos >= 10 ? "#34c759" : "#ccc"}
          />
          <Text style={[styles.achievementText, stats.totalPhotos >= 10 && styles.achievementCompleted]}>
            10 photos dans la collection
          </Text>
        </View>

        <View style={styles.achievementCard}>
          <Ionicons
            name={stats.totalLocations >= 5 ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={stats.totalLocations >= 5 ? "#34c759" : "#ccc"}
          />
          <Text style={[styles.achievementText, stats.totalLocations >= 5 && styles.achievementCompleted]}>
            5 lieux différents visités
          </Text>
        </View>

        <View style={styles.achievementCard}>
          <Ionicons
            name={stats.photosThisMonth >= 5 ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={stats.photosThisMonth >= 5 ? "#34c759" : "#ccc"}
          />
          <Text style={[styles.achievementText, stats.photosThisMonth >= 5 && styles.achievementCompleted]}>
            5 photos ce mois-ci
          </Text>
        </View>
      </View>

      {/* Bouton de rafraîchissement */}
      <TouchableOpacity style={styles.refreshButton} onPress={loadStatistics}>
        <Ionicons name="refresh" size={20} color="#fff" />
        <Text style={styles.refreshButtonText}>Actualiser</Text>
      </TouchableOpacity>
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
    padding: 30,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 15,
    marginBottom: 10,
  },
  motivationalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  section: {
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 16,
    color: '#555',
    marginLeft: 10,
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statValueSmall: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'right',
    flex: 1,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  achievementText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 15,
    flex: 1,
  },
  achievementCompleted: {
    color: '#34c759',
    fontWeight: 'bold',
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
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    margin: 20,
    marginTop: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
