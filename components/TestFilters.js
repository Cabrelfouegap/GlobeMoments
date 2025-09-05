// TestFilters.js
// Composant de test pour vérifier le fonctionnement des filtres
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TestFilters = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    date: null,
    location: null
  });

  const handleFilterPress = () => {
    console.log('🎯 Test: Bouton filtres pressé');
    setShowFilters(true);
  };

  const handleFilterChange = (newFilters) => {
    console.log('🔄 Test: Filtres changés:', newFilters);
    setFilters(newFilters);
  };

  const handleCloseFilters = () => {
    console.log('❌ Test: Modal filtres fermé');
    setShowFilters(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test des Filtres</Text>

      <TouchableOpacity
        style={styles.filterButton}
        onPress={handleFilterPress}
      >
        <Ionicons name="filter" size={24} color="#fff" />
        <Text style={styles.filterButtonText}>Ouvrir les Filtres</Text>
        {(filters.date || filters.location) && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {(filters.date ? 1 : 0) + (filters.location ? 1 : 0)}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>État des filtres:</Text>
        <Text style={styles.statusText}>
          Date: {filters.date ? '✅ Défini' : '❌ Non défini'}
        </Text>
        <Text style={styles.statusText}>
          Lieu: {filters.location ? `✅ ${filters.location}` : '❌ Non défini'}
        </Text>
        <Text style={styles.statusText}>
          Modal: {showFilters ? '✅ Ouvert' : '❌ Fermé'}
        </Text>
      </View>

      {showFilters && (
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Modal des Filtres</Text>
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => handleFilterChange({ date: new Date(), location: 'Paris' })}
          >
            <Text style={styles.testButtonText}>Appliquer des filtres de test</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleCloseFilters}
          >
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#eaf6fb',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#007AFF',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    justifyContent: 'center',
    marginBottom: 30,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  statusText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
  modal: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    right: '10%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#007AFF',
  },
  testButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TestFilters;
