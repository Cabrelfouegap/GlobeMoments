import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CalendrierScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendrier</Text>
      <Text style={styles.subtitle}>Organisez vos voyages</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
