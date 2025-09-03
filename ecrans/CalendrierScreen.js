// CalendrierScreen.js
// Écran d'affichage du calendrier des photos
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';

export default function CalendrierScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="calendar" size={32} color="#007AFF" />
        <Text style={styles.title}>Calendrier des photos</Text>
      </View>
      <Calendar
        style={styles.calendar}
        theme={{
          backgroundColor: '#eaf6fb',
          calendarBackground: '#fff',
          textSectionTitleColor: '#007AFF',
          selectedDayBackgroundColor: '#007AFF',
          selectedDayTextColor: '#fff',
          todayTextColor: '#007AFF',
          dayTextColor: '#333',
          textDisabledColor: '#d9e1e8',
          dotColor: '#007AFF',
          selectedDotColor: '#fff',
          arrowColor: '#007AFF',
          monthTextColor: '#007AFF',
          indicatorColor: '#007AFF',
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14
        }}
        // Add marked dates for photos
        markedDates={{
          '2025-09-03': { marked: true, dotColor: '#007AFF' },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eaf6fb',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginLeft: 10,
  },
  calendar: {
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});
