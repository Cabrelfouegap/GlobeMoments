// PhotoItem.js
// Composant pour afficher une photo avec ses informations
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PhotoItem = ({ photo, onPress }) => {
  const formatDate = (date) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - dateObj);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Aujourd\'hui';
    if (diffDays === 2) return 'Hier';
    if (diffDays <= 7) return `Il y a ${diffDays - 1} jours`;

    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short'
    });
  };

  const hasLocation = photo.coords && photo.coords.latitude && photo.coords.longitude;

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(photo)} activeOpacity={0.8}>
      <Image
        source={{ uri: photo.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.overlay}>
        <View style={styles.infoContainer}>
          <View style={styles.dateContainer}>
            <Ionicons name="time" size={12} color="#fff" />
            <Text style={styles.dateText} numberOfLines={1}>
              {formatDate(photo.date)}
            </Text>
          </View>

          {hasLocation && (
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={12} color="#fff" />
            </View>
          )}
        </View>
      </View>

      {/* Indicateur de chargement d'erreur */}
      {!photo.imageUrl && (
        <View style={styles.errorContainer}>
          <Ionicons name="image" size={40} color="#ccc" />
          <Text style={styles.errorText}>Image indisponible</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: '#e0e0e0',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dateText: {
    color: '#fff',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '500',
  },
  locationContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 4,
    borderRadius: 8,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  errorText: {
    color: '#999',
    fontSize: 12,
    marginTop: 8,
  },
});

export default PhotoItem;
