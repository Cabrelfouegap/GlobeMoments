// PhotosScreen.js
// Écran de liste et filtre des photos
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { FlatList, StyleSheet, Text, View } from 'react-native';

const photos = [
  { id: '1', title: 'Photo 1', date: '2025-09-01' },
  { id: '2', title: 'Photo 2', date: '2025-09-02' },
  { id: '3', title: 'Photo 3', date: '2025-09-03' },
  { id: '4', title: 'Photo 4', date: '2025-09-03' },
  // Add more
];

export default function PhotosScreen() {
  const route = useRoute();
  const selectedDate = route.params?.selectedDate || null;
  
  const filteredPhotos = selectedDate
    ? photos.filter(p => p.date === selectedDate)
    : photos;

  const renderPhoto = ({ item }) => (
    <View style={styles.photoItem}>
      <Ionicons name="image" size={60} color="#007AFF" />
      <Text style={styles.photoTitle}>{item.title}</Text>
      <Text style={styles.photoDate}>{item.date}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="images" size={32} color="#5b6b85ff" />
        <Text style={styles.title}> {selectedDate ? `Photos du ${selectedDate}` : 'Toutes les photos'} </Text>
      </View>
      <FlatList
        data={filteredPhotos}
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
  photoDate: {
    fontSize: 12,
    color: '#888',
  },
});
