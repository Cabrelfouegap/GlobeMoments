import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../services/auth';

const { width } = Dimensions.get('window');
const itemWidth = (width - 30) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 0, // Supprimé le padding pour laisser la StatusBar visible
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  backToCameraFromEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 20,
  },
  backToCameraFromEmptyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  photoGrid: {
    padding: 8,
  },
  photoItem: {
    width: itemWidth,
    height: itemWidth,
    margin: 1,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 4,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  photoDate: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: width,
    height: width,
    maxHeight: 400,
  },
  photoInfo: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    padding: 15,
  },
  photoLocation: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
  },
});

export default function PhotosScreen() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'photos'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const photosData: any[] = [];
      querySnapshot.forEach((doc) => {
        photosData.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Trier par date décroissante
      photosData.sort((a, b) => {
        const dateA = new Date(a.date?.seconds * 1000 || a.date);
        const dateB = new Date(b.date?.seconds * 1000 || b.date);
        return dateB.getTime() - dateA.getTime();
      });

      setPhotos(photosData);
    });

    return () => unsubscribe();
  }, [user]);

  const handlePhotoPress = (photo: any) => {
    setSelectedPhoto(photo);
    setShowModal(true);
  };

  const renderPhotoItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.photoItem}
      onPress={() => handlePhotoPress(item)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.photoImage} />
      <View style={styles.photoOverlay}>
        <Text style={styles.photoDate}>
          {new Date(item.date?.seconds * 1000 || item.date).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {photos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="images" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Aucune photo trouvée</Text>
          <Text style={styles.emptySubtext}>
            Prenez votre première photo avec la caméra
          </Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          renderItem={renderPhotoItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.photoGrid}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal pour afficher la photo en grand */}
      <Modal visible={showModal} animationType="fade">
        <SafeAreaView style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowModal(false)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>

          {selectedPhoto && (
            <View style={styles.modalContent}>
              <Image
                source={{ uri: selectedPhoto.imageUrl }}
                style={styles.modalImage}
                resizeMode="contain"
              />

              <View style={styles.photoInfo}>
                <Text style={styles.photoDate}>
                  📅 {new Date(selectedPhoto.date?.seconds * 1000 || selectedPhoto.date).toLocaleDateString()}
                </Text>
                {selectedPhoto.coords && (
                  <Text style={styles.photoLocation}>
                    📍 {selectedPhoto.coords.latitude.toFixed(4)}, {selectedPhoto.coords.longitude.toFixed(4)}
                  </Text>
                )}
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}
