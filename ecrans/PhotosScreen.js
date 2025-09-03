// PhotosScreen.js
// Écran de liste et filtre des photos
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const photos = [
  { id: '1', title: 'Photo 1' },
  { id: '2', title: 'Photo 2' },
  { id: '3', title: 'Photo 3' },
  // Add more
];

export default function PhotosScreen() {
  const renderPhoto = ({ item }) => (
    <View style={styles.photoItem}>
      <Ionicons name="image" size={60} color="#007AFF" />
      <Text style={styles.photoTitle}>{item.title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="images" size={32} color="#007AFF" />
        <Text style={styles.title}>Toutes les photos</Text>
      </View>
      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
      />
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
  list: {
    padding: 16,
  },
  photoItem: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 8,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  photoTitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#333',
  },
});
