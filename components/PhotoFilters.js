// PhotoFilters.js
// Composant de filtres pour la page Photos
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';

const PhotoFilters = ({ filters, onFiltersChange, onClose, visible = false }) => {
  console.log('🎛️ PhotoFilters rendu, visible:', visible);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [tempLocation, setTempLocation] = useState(filters.location || '');

  const handleDateSelect = (date) => {
    const selectedDate = new Date(date.dateString);
    onFiltersChange({
      ...filters,
      date: selectedDate,
      dateString: date.dateString
    });
    setShowDatePicker(false);
  };

  const handleLocationSubmit = () => {
    if (tempLocation.trim()) {
      onFiltersChange({
        ...filters,
        location: tempLocation.trim()
      });
    } else {
      onFiltersChange({
        ...filters,
        location: null
      });
    }
    setShowLocationInput(false);
  };

  const clearDateFilter = () => {
    onFiltersChange({
      ...filters,
      date: null,
      dateString: null
    });
  };

  const clearLocationFilter = () => {
    onFiltersChange({
      ...filters,
      location: null
    });
    setTempLocation('');
  };

  const clearAllFilters = () => {
    onFiltersChange({
      date: null,
      dateString: null,
      location: null
    });
    setTempLocation('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Filtres</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Filtre par date */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Date</Text>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color="#007AFF" />
                <Text style={styles.filterButtonText}>
                  {filters.dateString
                    ? new Date(filters.dateString).toLocaleDateString('fr-FR')
                    : 'Sélectionner une date'
                  }
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#ccc" />
              </TouchableOpacity>
              {filters.date && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearDateFilter}
                >
                  <Text style={styles.clearButtonText}>Effacer</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Filtre par lieu */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Lieu</Text>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowLocationInput(true)}
              >
                <Ionicons name="location" size={20} color="#007AFF" />
                <Text style={styles.filterButtonText}>
                  {filters.location || 'Saisir un lieu'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#ccc" />
              </TouchableOpacity>
              {filters.location && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearLocationFilter}
                >
                  <Text style={styles.clearButtonText}>Effacer</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Bouton effacer tout */}
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={clearAllFilters}
            >
              <Text style={styles.clearAllButtonText}>Effacer tous les filtres</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Modal calendrier */}
      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.calendarOverlay}>
            <View style={styles.calendarContainer}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarTitle}>Sélectionner une date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <Calendar
                onDayPress={handleDateSelect}
                markedDates={filters.dateString ? {
                  [filters.dateString]: { selected: true, selectedColor: '#007AFF' }
                } : {}}
                theme={{
                  selectedDayBackgroundColor: '#007AFF',
                  todayTextColor: '#007AFF',
                  arrowColor: '#007AFF',
                }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Modal saisie lieu */}
      {showLocationInput && (
        <Modal
          visible={showLocationInput}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowLocationInput(false)}
        >
          <View style={styles.locationOverlay}>
            <View style={styles.locationContainer}>
              <View style={styles.locationHeader}>
                <Text style={styles.locationTitle}>Saisir un lieu</Text>
                <TouchableOpacity onPress={() => setShowLocationInput(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.locationInput}
                placeholder="Ex: Paris, France"
                value={tempLocation}
                onChangeText={setTempLocation}
                autoFocus={true}
              />
              <View style={styles.locationButtons}>
                <TouchableOpacity
                  style={styles.locationCancelButton}
                  onPress={() => setShowLocationInput(false)}
                >
                  <Text style={styles.locationCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.locationSubmitButton}
                  onPress={handleLocationSubmit}
                >
                  <Text style={styles.locationSubmitText}>Valider</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterButtonText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  clearAllButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  clearAllButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  locationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    padding: 20,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  locationInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  locationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationCancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  locationCancelText: {
    color: '#666',
    fontSize: 16,
  },
  locationSubmitButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 10,
  },
  locationSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PhotoFilters;
