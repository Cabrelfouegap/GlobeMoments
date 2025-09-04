import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Modal,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../services/auth';
import openMap from 'react-native-open-maps';

const { width } = Dimensions.get('window');

const getOpenStreetMapHTML = () => `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OpenStreetMap GlobeMoments</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            height: 100vh;
            font-family: Arial, sans-serif;
        }
        #map {
            height: 100vh;
            width: 100vw;
        }
        .custom-marker {
            background: none;
            border: none;
        }
        .marker-image {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .marker-pin {
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 10px solid white;
            margin-top: -2px;
            margin-left: 15px;
        }
    </style>
</head>
<body>
    <div id="map"></div>

    <script>
        let map;
        let markers = [];

        function createCustomIcon(imageUrl) {
            return L.divIcon({
                className: 'custom-marker',
                html: \`
                    <div>
                        <img src="\${imageUrl}" class="marker-image" />
                        <div class="marker-pin"></div>
                    </div>
                \`,
                iconSize: [40, 50],
                iconAnchor: [20, 50]
            });
        }

        function initMap(lat = 48.8566, lng = 2.3522, zoom = 10) {
            if (map) {
                map.remove();
            }

            map = L.map('map').setView([lat, lng], zoom);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
            }).addTo(map);

            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapReady'
            }));
        }

        function addMarker(id, lat, lng, imageUrl, title = '') {
            const icon = createCustomIcon(imageUrl);
            const marker = L.marker([lat, lng], { icon: icon }).addTo(map);

            if (title) {
                marker.bindPopup(title);
            }

            marker.on('click', function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'markerClick',
                    id: id,
                    lat: lat,
                    lng: lng
                }));
            });

            markers.push({ id, marker });
            return marker;
        }

        function clearMarkers() {
            markers.forEach(marker => {
                map.removeLayer(marker.marker);
            });
            markers = [];
        }

        function centerMap(lat, lng, zoom = 15) {
            map.setView([lat, lng], zoom);
        }

        window.addEventListener('message', function(event) {
            try {
                const data = JSON.parse(event.data);

                switch (data.type) {
                    case 'addMarker':
                        addMarker(data.id, data.lat, data.lng, data.imageUrl, data.title);
                        break;
                    case 'clearMarkers':
                        clearMarkers();
                        break;
                    case 'centerMap':
                        centerMap(data.lat, data.lng, data.zoom);
                        break;
                }
            } catch (error) {
                console.error('Erreur:', error);
            }
        });

        initMap();
    </script>
</body>
</html>
`;

export default function CarteScreen() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 48.8566, // Paris par défaut
    longitude: 2.3522,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const { user } = useAuth();
  const webViewRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'photos'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const photosData: any[] = [];
      querySnapshot.forEach((doc) => {
        const photoData = doc.data();
        if (photoData.coords) { // Seulement les photos avec coordonnées
          photosData.push({
            id: doc.id,
            ...photoData,
          });
        }
      });

      // Trier côté client par date décroissante
      photosData.sort((a, b) => {
        const dateA = new Date(a.date?.seconds * 1000 || a.date);
        const dateB = new Date(b.date?.seconds * 1000 || b.date);
        return dateB.getTime() - dateA.getTime();
      });

      setPhotos(photosData);

      // Centrer la carte sur la première photo si elle existe
      if (photosData.length > 0 && photosData[0].coords) {
        setMapRegion({
          latitude: photosData[0].coords.latitude,
          longitude: photosData[0].coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleMapReady = () => {
    setMapLoaded(true);
    setMapError(false);
  };

  // Timeout pour détecter les erreurs de chargement
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!mapLoaded) {
        setMapError(true);
        setMapLoaded(true); // Masquer le loading
      }
    }, 10000); // 10 secondes timeout

    return () => clearTimeout(timer);
  }, [mapLoaded]);

  // Gérer les messages de la WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'mapReady':
          handleMapReady();
          // Initialiser la carte avec les photos existantes
          updateMapMarkers();
          break;
        case 'markerClick':
          handleMarkerPress(photos.find(p => p.id === data.id));
          break;
        case 'mapClick':
          // Gérer les clics sur la carte si nécessaire
          break;
        case 'mapCenter':
          // Mettre à jour la région de la carte
          setMapRegion({
            latitude: data.lat,
            longitude: data.lng,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
          break;
      }
    } catch (error) {
      console.error('Erreur dans handleWebViewMessage:', error);
    }
  };

  // Mettre à jour les marqueurs sur la carte
  const updateMapMarkers = useCallback(() => {
    if (!webViewRef.current || !mapLoaded) return;

    // Supprimer tous les marqueurs existants
    const clearMessage = JSON.stringify({ type: 'clearMarkers' });
    webViewRef.current.injectJavaScript(`window.postMessage(${clearMessage}, '*');`);

    // Ajouter les nouveaux marqueurs
    photos.forEach((photo) => {
      if (photo.coords) {
        const markerMessage = JSON.stringify({
          type: 'addMarker',
          id: photo.id,
          lat: photo.coords.latitude,
          lng: photo.coords.longitude,
          imageUrl: photo.imageUrl,
          title: `Photo du ${new Date(photo.date?.seconds * 1000 || photo.date).toLocaleDateString()}`
        });
        setTimeout(() => {
          webViewRef.current?.injectJavaScript(`window.postMessage(${markerMessage}, '*');`);
        }, 100);
      }
    });
  }, [photos, mapLoaded]);

  // Centrer la carte sur une position
  const centerMap = (lat: number, lng: number, zoom: number = 15) => {
    if (!webViewRef.current || !mapLoaded) return;

    const centerMessage = JSON.stringify({
      type: 'centerMap',
      lat: lat,
      lng: lng,
      zoom: zoom
    });
    webViewRef.current.injectJavaScript(`window.postMessage(${centerMessage}, '*');`);
  };

  const handleOpenInMaps = () => {
    openMap({
      latitude: mapRegion.latitude,
      longitude: mapRegion.longitude,
      zoom: 15,
      query: 'Photos GlobeMoments'
    });
  };

  const handleCenterPress = () => {
    // Essayer de centrer sur la position actuelle
    // Si la carte ne fonctionne pas, ouvrir dans l'app native
    if (mapError) {
      handleOpenInMaps();
    } else {
      // Centrer sur la première photo ou Paris par défaut
      const centerLat = photos.length > 0 && photos[0].coords ? photos[0].coords.latitude : 48.8566;
      const centerLng = photos.length > 0 && photos[0].coords ? photos[0].coords.longitude : 2.3522;
      centerMap(centerLat, centerLng);
    }
  };

  const handleMarkerPress = (photo: any) => {
    if (photo) {
      setSelectedPhoto(photo);
      setShowModal(true);
    }
  };

  // Mettre à jour les marqueurs quand les photos changent
  useEffect(() => {
    if (mapLoaded && photos.length > 0) {
      updateMapMarkers();
    }
  }, [photos, mapLoaded, updateMapMarkers]);

  return (
    <View style={styles.container}>
      {!mapLoaded && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement de la carte...</Text>
        </View>
      )}
      {mapError && mapLoaded && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Erreur de chargement de la carte.{'\n'}
            Vous pouvez ouvrir l&apos;emplacement dans votre application de cartes.
          </Text>
          <TouchableOpacity style={styles.openMapsButton} onPress={handleOpenInMaps}>
            <Text style={styles.openMapsButtonText}>Ouvrir dans Maps</Text>
          </TouchableOpacity>
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ html: getOpenStreetMapHTML() }}
        style={styles.map}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        onError={() => {
          setMapError(true);
          setMapLoaded(true);
        }}
        onLoadEnd={() => {
          // La carte s'initialisera automatiquement
        }}
      />

      {/* Bouton pour centrer sur la position actuelle */}
      <TouchableOpacity style={styles.centerButton} onPress={handleCenterPress}>
        <Ionicons name="locate" size={24} color="#007AFF" />
      </TouchableOpacity>

      {/* Modal pour afficher la photo */}
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
                  {new Date(selectedPhoto.date?.seconds * 1000 || selectedPhoto.date).toLocaleDateString()}
                </Text>
                <Text style={styles.photoLocation}>
                  📍 {selectedPhoto.coords.latitude.toFixed(4)}, {selectedPhoto.coords.longitude.toFixed(4)}
                </Text>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 0, // Supprimé le padding pour laisser la StatusBar visible
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 2,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  openMapsButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  openMapsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerPin: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
    marginTop: -2,
  },
  centerButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80, // Plus de marge en bas sur iOS pour éviter la barre de navigation
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
  photoDate: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  photoLocation: {
    color: '#fff',
    fontSize: 14,
  },
});
