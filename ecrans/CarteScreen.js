// CarteScreen.js
// Écran d'affichage de la carte avec les marqueurs des photos
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

export default function CarteScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="map" size={32} color="#007AFF" />
        <Text style={styles.title}>Carte des souvenirs</Text>
      </View>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 48.8566,
          longitude: 2.3522,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {/* Example marker */}
        <Marker
          coordinate={{ latitude: 48.8566, longitude: 2.3522 }}
          title="Paris"
          description="Ville lumière"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eaf6fb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginLeft: 10,
  },
  map: {
    flex: 1,
  },
});
