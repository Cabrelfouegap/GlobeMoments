// PhotoModal.js
// Modal d'affichage d'une photo en plein écran
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PhotoModal = ({ visible, photo, onClose, allPhotos = [], currentIndex = 0, onPrevious, onNext }) => {
  if (!photo) return null;

  const formatDate = (date) => {
    if (!date) return 'Date inconnue';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLocation = (coords) => {
    if (!coords || !coords.latitude || !coords.longitude) {
      return 'Lieu inconnu';
    }
    return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
  };

  const hasPrevious = allPhotos.length > 1 && currentIndex > 0;
  const hasNext = allPhotos.length > 1 && currentIndex < allPhotos.length - 1;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header avec compteur seulement */}
          {allPhotos.length > 1 && (
            <View style={styles.header}>
              <Text style={styles.counter}>
                {currentIndex + 1} / {allPhotos.length}
              </Text>
            </View>
          )}

          {/* Boutons de navigation */}
          {hasPrevious && (
            <TouchableOpacity style={[styles.navButton, styles.prevButton]} onPress={onPrevious}>
              <Ionicons name="chevron-back" size={30} color="#fff" />
            </TouchableOpacity>
          )}

          {hasNext && (
            <TouchableOpacity style={[styles.navButton, styles.nextButton]} onPress={onNext}>
              <Ionicons name="chevron-forward" size={30} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Image dans un conteneur */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: photo.imageUrl }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>

          {/* Informations de la photo */}
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color="#007AFF" />
              <Text style={styles.infoText}>
                {formatDate(photo.date)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color="#007AFF" />
              <Text style={styles.infoText}>
                {formatLocation(photo.coords)}
              </Text>
            </View>

            {photo.coords && (
              <TouchableOpacity style={styles.mapButton}>
                <Ionicons name="map" size={16} color="#007AFF" />
                <Text style={styles.mapButtonText}>Voir sur la carte</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Bouton fermer avec le style du profil */}
          <View style={styles.modalSection}>
            <TouchableOpacity
              style={styles.securityButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={20} color="#007AFF" />
              <Text style={styles.securityButtonText}>Fermer</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#000',
    borderRadius: 20,
    padding: 20,
    width: '95%',
    maxWidth: 400,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 15,
  },
  counter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -25,
  },
  prevButton: {
    left: 10,
  },
  nextButton: {
    right: 10,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    maxWidth: 350,
  },
  infoContainer: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  mapButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  modalSection: {
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  securityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 9,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  securityButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 10,
    fontWeight: '500',
  },
});

export default PhotoModal;
