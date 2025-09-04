import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../services/auth';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');
const itemWidth = (width - 30) / 3;

// Fonction pour obtenir le nom du lieu à partir des coordonnées GPS
const getLocationName = async (latitude: number, longitude: number): Promise<string> => {
  try {
    const [location] = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (location) {
      // Construire un nom de lieu lisible
      const parts = [];
      if (location.city) parts.push(location.city);
      if (location.region) parts.push(location.region);
      if (location.country) parts.push(location.country);

      return parts.join(', ') || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
    }
  } catch (error) {
    console.warn('Erreur lors du reverse geocoding:', error);
  }

  // Fallback aux coordonnées si le geocoding échoue
  return `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
};

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
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  clearButton: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  filterOptions: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    maxHeight: 200,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
  },
  filterOptionSelected: {
    backgroundColor: '#f8f9fa',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  dateRangeButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
    minWidth: 80,
    alignItems: 'center',
  },
  dateRangeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dateRangeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  dateRangeButtonTextActive: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
  },
  dateList: {
    maxHeight: 200,
  },
  locationList: {
    maxHeight: 250,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  locationInfoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  weekDays: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  calendarDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  calendarDayOtherMonth: {
    opacity: 0.3,
  },
  calendarDayWithPhotos: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  calendarDayToday: {
    backgroundColor: '#fff3cd',
    borderWidth: 2,
    borderColor: '#ffc107',
  },
  calendarDaySelected: {
    backgroundColor: '#007AFF',
  },
  calendarDayText: {
    fontSize: 16,
    color: '#333',
  },
  calendarDayTextCurrentMonth: {
    color: '#333',
  },
  calendarDayTextOtherMonth: {
    color: '#ccc',
  },
  calendarDayTextWithPhotos: {
    color: '#1976d2',
    fontWeight: '600',
  },
  calendarDayTextToday: {
    color: '#856404',
    fontWeight: 'bold',
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  quickDateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  quickDateButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  quickDateButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  quickDateButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  quickDateButtonTextActive: {
    color: '#fff',
  },
  locationIcon: {
    marginRight: 8,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noResultsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  noResultsSubtext: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 4,
    textAlign: 'center',
  },
  locationSelectContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  locationSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  locationSelectText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  clearLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearLocationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  locationPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  locationPickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    minHeight: '30%',
  },
  locationPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  locationPickerClose: {
    padding: 4,
  },
  locationPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  locationPickerItemSelected: {
    backgroundColor: '#f0f8ff',
  },
  locationPickerItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  locationPickerEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  locationPickerEmptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  locationPickerEmptySubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
});

export default function PhotosScreen() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'date' | 'location'>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [locationNames, setLocationNames] = useState<Map<string, string>>(new Map());
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'photos'),
      where('userId', '==', user.uid),
      where('isActive', '==', true)
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

  // Résoudre les noms de lieux pour les photos avec coordonnées GPS
  useEffect(() => {
    const resolveLocationNames = async () => {
      const newLocationNames = new Map<string, string>();

      for (const photo of photos) {
        if (photo.coords && !photo.locationName && !photo.city && !photo.address) {
          const key = `${photo.coords.latitude.toFixed(4)},${photo.coords.longitude.toFixed(4)}`;
          if (!locationNames.has(key)) {
            try {
              const locationName = await getLocationName(photo.coords.latitude, photo.coords.longitude);
              newLocationNames.set(key, locationName);
            } catch (error) {
              console.warn('Erreur lors de la résolution du nom de lieu:', error);
              newLocationNames.set(key, `${photo.coords.latitude.toFixed(2)}, ${photo.coords.longitude.toFixed(2)}`);
            }
          }
        }
      }

      if (newLocationNames.size > 0) {
        setLocationNames(prev => new Map([...prev, ...newLocationNames]));
      }
    };

    if (photos.length > 0) {
      resolveLocationNames();
    }
  }, [photos, locationNames]);

  // Fonctions utilitaires pour les dates
  const getDateRange = (type: string) => {
    const today = new Date();
    const start = new Date();
    const end = new Date();

    switch (type) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        start.setDate(today.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(today.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(today.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case 'month':
        start.setMonth(today.getMonth() - 1);
        start.setHours(0, 0, 0, 0);
        break;
      default:
        return null;
    }
    return { start, end: type === 'today' || type === 'yesterday' ? end : today };
  };

  // Obtenir les dates uniques pour le filtre
  const availableDates = useMemo(() => {
    const dates = photos.map((photo) =>
      new Date(photo.date?.seconds * 1000 || photo.date).toDateString()
    );
    return [...new Set(dates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [photos]);

  // Fonction pour générer le calendrier
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const day = {
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        hasPhotos: availableDates ? availableDates.includes(currentDate.toDateString()) : false,
        isToday: currentDate.toDateString() === new Date().toDateString(),
      };
      days.push(day);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  // Filtrage des photos amélioré
  const filteredPhotos = useMemo(() => {
    if (filterType === 'all') return photos;

    return photos.filter((photo) => {
      const photoDate = new Date(photo.date?.seconds * 1000 || photo.date);

      if (filterType === 'date' && selectedDate) {
        if (selectedDate && typeof selectedDate === 'string' && selectedDate.includes('-')) {
          // Filtre par plage (aujourd'hui, hier, semaine, mois)
          const range = getDateRange(selectedDate);
          if (range) {
            return photoDate >= range.start && photoDate <= range.end;
          }
        } else {
          // Filtre par date spécifique
          const filterDate = new Date(selectedDate);
          return photoDate.toDateString() === filterDate.toDateString();
        }
      }

      if (filterType === 'location' && selectedLocation) {
        // Créer une fonction pour obtenir le lieu d'une photo
        const getPhotoLocation = (photo: any) => {
          let location = photo.locationName || photo.city || photo.address;

          // Si aucun nom de lieu n'est disponible, utiliser le nom résolu ou les coordonnées
          if (!location && photo.coords) {
            const key = `${photo.coords.latitude.toFixed(4)},${photo.coords.longitude.toFixed(4)}`;
            location = locationNames.get(key) || `${photo.coords.latitude.toFixed(2)}, ${photo.coords.longitude.toFixed(2)}`;
          }

          return location || '';
        };

        const photoLocation = getPhotoLocation(photo);
        const locationMatch = photoLocation.toLowerCase().includes(selectedLocation.toLowerCase());
        return locationMatch;
      }

      return true;
    });
  }, [photos, filterType, selectedDate, selectedLocation, locationNames]);

  // Obtenir les lieux uniques pour le filtre
  const availableLocations = useMemo(() => {
    console.log('🔍 Débogage lieux - Photos disponibles:', photos.length);
    const locations = photos
      .map((photo, index) => {
        let location = photo.locationName || photo.city || photo.address;

        // Si aucun nom de lieu n'est disponible, utiliser le nom résolu ou les coordonnées
        if (!location && photo.coords) {
          const key = `${photo.coords.latitude.toFixed(4)},${photo.coords.longitude.toFixed(4)}`;
          location = locationNames.get(key) || `${photo.coords.latitude.toFixed(2)}, ${photo.coords.longitude.toFixed(2)}`;
        }

        if (index < 3) { // Log seulement les 3 premières pour éviter trop de logs
          console.log(`📍 Photo ${index + 1}:`, {
            id: photo.id,
            locationName: photo.locationName,
            city: photo.city,
            address: photo.address,
            coords: photo.coords,
            resolvedName: locationNames.get(`${photo.coords?.latitude.toFixed(4)},${photo.coords?.longitude.toFixed(4)}`),
            finalLocation: location
          });
        }
        return location;
      })
      .filter(Boolean);
    console.log('📍 Lieux extraits:', locations);
    console.log('📍 Lieux uniques:', [...new Set(locations)].sort());
    return [...new Set(locations)].sort();
  }, [photos, locationNames]);

  const handlePhotoPress = (photo: any) => {
    setSelectedPhoto(photo);
    setShowModal(true);
  };

  const clearFilters = () => {
    setFilterType('all');
    setSelectedDate('');
    setSelectedLocation('');
  };

  // Fonction de débogage pour analyser les données des photos
  const debugPhotoData = useCallback(() => {
    console.log('🔍 === ANALYSE DES DONNÉES DE PHOTOS ===');
    console.log('📊 Nombre total de photos:', photos.length);

    const locationStats = {
      withLocationName: 0,
      withCity: 0,
      withAddress: 0,
      withCoords: 0,
      withAnyLocation: 0,
    };

    photos.forEach((photo, index) => {
      if (photo.locationName) locationStats.withLocationName++;
      if (photo.city) locationStats.withCity++;
      if (photo.address) locationStats.withAddress++;
      if (photo.coords) locationStats.withCoords++;
      if (photo.locationName || photo.city || photo.address || photo.coords) {
        locationStats.withAnyLocation++;
      }

      if (index < 5) { // Afficher seulement les 5 premières
        console.log(`📸 Photo ${index + 1}:`, {
          id: photo.id.substring(0, 8) + '...',
          hasLocationName: !!photo.locationName,
          hasCity: !!photo.city,
          hasAddress: !!photo.address,
          hasCoords: !!photo.coords,
          location: photo.locationName || photo.city || photo.address ||
                   (photo.coords ? `${photo.coords.latitude.toFixed(2)}, ${photo.coords.longitude.toFixed(2)}` : 'N/A')
        });
      }
    });

    console.log('📈 Statistiques de localisation:', locationStats);
    console.log('🎯 Lieux disponibles pour le filtre:', availableLocations);
    console.log('🔍 === FIN DE L\'ANALYSE ===');
  }, [photos, availableLocations]);

  // Appeler le débogage au chargement des photos
  useEffect(() => {
    if (photos.length > 0) {
      debugPhotoData();
    }
  }, [photos, debugPhotoData]);

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
      {/* Barre de filtrage */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
          onPress={() => {
            setFilterType('all');
            setSelectedDate('');
            setSelectedLocation('');
            setShowFilterOptions(false);
          }}
        >
          <Ionicons
            name="grid"
            size={16}
            color={filterType === 'all' ? '#fff' : '#666'}
          />
          <Text style={[styles.filterButtonText, filterType === 'all' && styles.filterButtonTextActive]}>
            Tout
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filterType === 'date' && styles.filterButtonActive]}
          onPress={() => {
            setFilterType('date');
            setSelectedLocation('');
            setShowFilterOptions(!showFilterOptions);
          }}
        >
          <Ionicons
            name="calendar"
            size={16}
            color={filterType === 'date' ? '#fff' : '#666'}
          />
          <Text style={[styles.filterButtonText, filterType === 'date' && styles.filterButtonTextActive]}>
            {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Date'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filterType === 'location' && styles.filterButtonActive]}
          onPress={() => {
            setFilterType('location');
            setSelectedDate('');
            setShowFilterOptions(!showFilterOptions);
          }}
        >
          <Ionicons
            name="location"
            size={16}
            color={filterType === 'location' ? '#fff' : '#666'}
          />
          <Text style={[styles.filterButtonText, filterType === 'location' && styles.filterButtonTextActive]}>
            {selectedLocation || 'Lieu'}
          </Text>
        </TouchableOpacity>

        {(filterType !== 'all' || selectedDate || selectedLocation) && (
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>Effacer</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Options de filtrage améliorées */}
      {showFilterOptions && (
        <View style={styles.filterOptions}>
          {filterType === 'date' && (
            <View>
              {/* Navigation du calendrier */}
              <View style={styles.calendarHeader}>
                <TouchableOpacity
                  onPress={() => {
                    const newMonth = new Date(currentMonth);
                    newMonth.setMonth(newMonth.getMonth() - 1);
                    setCurrentMonth(newMonth);
                  }}
                >
                  <Ionicons name="chevron-back" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.calendarTitle}>
                  {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const newMonth = new Date(currentMonth);
                    newMonth.setMonth(newMonth.getMonth() + 1);
                    setCurrentMonth(newMonth);
                  }}
                >
                  <Ionicons name="chevron-forward" size={24} color="#007AFF" />
                </TouchableOpacity>
              </View>

              {/* Jours de la semaine */}
              <View style={styles.weekDays}>
                {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
                  <Text key={day} style={styles.weekDayText}>{day}</Text>
                ))}
              </View>

              {/* Grille du calendrier */}
              <View style={styles.calendarGrid}>
                {calendarDays.map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarDay,
                      !day.isCurrentMonth && styles.calendarDayOtherMonth,
                      day.hasPhotos && styles.calendarDayWithPhotos,
                      day.isToday && styles.calendarDayToday,
                      selectedDate === day.date.toDateString() && styles.calendarDaySelected,
                    ]}
                    onPress={() => {
                      if (day.isCurrentMonth) {
                        setSelectedDate(day.date.toDateString());
                        setShowFilterOptions(false);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        day.isCurrentMonth && !day.hasPhotos && styles.calendarDayTextCurrentMonth,
                        !day.isCurrentMonth && styles.calendarDayTextOtherMonth,
                        day.hasPhotos && styles.calendarDayTextWithPhotos,
                        day.isToday && styles.calendarDayTextToday,
                        selectedDate === day.date.toDateString() && styles.calendarDayTextSelected,
                      ]}
                    >
                      {day.date.getDate()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Boutons de plage de dates rapides */}
              <View style={styles.quickDateContainer}>
                <TouchableOpacity
                  style={[styles.quickDateButton, selectedDate === 'today' && styles.quickDateButtonActive]}
                  onPress={() => {
                    setSelectedDate('today');
                    setShowFilterOptions(false);
                  }}
                >
                  <Text style={[styles.quickDateButtonText, selectedDate === 'today' && styles.quickDateButtonTextActive]}>
                    Aujourd&apos;hui
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickDateButton, selectedDate === 'week' && styles.quickDateButtonActive]}
                  onPress={() => {
                    setSelectedDate('week');
                    setShowFilterOptions(false);
                  }}
                >
                  <Text style={[styles.quickDateButtonText, selectedDate === 'week' && styles.quickDateButtonTextActive]}>
                    7 jours
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickDateButton, selectedDate === 'month' && styles.quickDateButtonActive]}
                  onPress={() => {
                    setSelectedDate('month');
                    setShowFilterOptions(false);
                  }}
                >
                  <Text style={[styles.quickDateButtonText, selectedDate === 'month' && styles.quickDateButtonTextActive]}>
                    30 jours
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {filterType === 'location' && (
            <View>
              {/* Message informatif */}
              <View style={styles.locationInfo}>
                <Ionicons name="information-circle" size={16} color="#666" />
                <Text style={styles.locationInfoText}>
                  Sélectionnez un lieu dans la liste ci-dessous
                </Text>
              </View>

              {/* Select personnalisé pour les lieux */}
              <View style={styles.locationSelectContainer}>
                <TouchableOpacity
                  style={styles.locationSelectButton}
                  onPress={() => setShowLocationPicker(true)}
                >
                  <Ionicons name="location" size={16} color="#666" style={styles.locationIcon} />
                  <Text style={styles.locationSelectText}>
                    {selectedLocation || 'Choisir un lieu'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Bouton pour effacer la sélection */}
              {selectedLocation && (
                <TouchableOpacity
                  style={styles.clearLocationButton}
                  onPress={() => setSelectedLocation('')}
                >
                  <Ionicons name="close-circle" size={16} color="#666" />
                  <Text style={styles.clearLocationText}>Effacer la sélection</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      {filteredPhotos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="images" size={80} color="#ccc" />
          <Text style={styles.emptyText}>
            {filterType === 'all' ? 'Aucune photo trouvée' : 'Aucune photo pour ce filtre'}
          </Text>
          <Text style={styles.emptySubtext}>
            {filterType === 'all'
              ? 'Prenez votre première photo avec la caméra'
              : 'Essayez un autre filtre'
            }
          </Text>
          {filterType !== 'all' && (
            <TouchableOpacity style={styles.backToCameraFromEmpty} onPress={clearFilters}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.backToCameraFromEmptyText}>Voir toutes les photos</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredPhotos}
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
                    📍 {(() => {
                      const key = `${selectedPhoto.coords.latitude.toFixed(4)},${selectedPhoto.coords.longitude.toFixed(4)}`;
                      const resolvedName = locationNames.get(key);
                      return resolvedName || `${selectedPhoto.coords.latitude.toFixed(4)}, ${selectedPhoto.coords.longitude.toFixed(4)}`;
                    })()}
                  </Text>
                )}
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Modal pour le select des lieux */}
      <Modal visible={showLocationPicker} animationType="slide" transparent={true}>
        <View style={styles.locationPickerOverlay}>
          <View style={styles.locationPickerContainer}>
            <View style={styles.locationPickerHeader}>
              <Text style={styles.locationPickerTitle}>Choisir un lieu</Text>
              <TouchableOpacity
                onPress={() => setShowLocationPicker(false)}
                style={styles.locationPickerClose}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {availableLocations.length > 0 ? (
              <FlatList
                data={availableLocations}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.locationPickerItem,
                      selectedLocation === item && styles.locationPickerItemSelected
                    ]}
                    onPress={() => {
                      setSelectedLocation(item);
                      setShowLocationPicker(false);
                      setShowFilterOptions(false);
                    }}
                  >
                    <Ionicons name="location" size={16} color="#666" style={styles.locationIcon} />
                    <Text style={styles.locationPickerItemText}>{item}</Text>
                    {selectedLocation === item && (
                      <Ionicons name="checkmark" size={16} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.locationPickerEmpty}>
                <Ionicons name="location" size={48} color="#ccc" />
                <Text style={styles.locationPickerEmptyText}>Aucun lieu trouvé</Text>
                <Text style={styles.locationPickerEmptySubtext}>
                  Les photos n&apos;ont pas de données de localisation
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
