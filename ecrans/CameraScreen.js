// CameraScreen.js
// Écran de prise de photo
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Camera, requestCameraPermissionsAsync } from 'expo-camera';
import * as Location from 'expo-location';
import { uploadImageAsync, createPhotoDocument } from '../services/firebase';
import { useAuth } from '../services/auth';
import { Ionicons } from '@expo/vector-icons';

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [locPermission, setLocPermission] = useState(null);
  const [type, setType] = useState('back');
  const cameraRef = useRef(null);
  const [isBusy, setIsBusy] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    requestPermissions();
  }, []);

  async function requestPermissions() {
    const { status } = await requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
    const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
    setLocPermission(locStatus === 'granted');
  }

  function toggleCameraType() {
    setType(current => (current === 'back' ? 'front' : 'back'));
  }

  async function takePicture() {
    if (!cameraRef.current || isBusy) return;
    setIsBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      let coords = null;
      if (locPermission) {
        const position = await Location.getCurrentPositionAsync({});
        coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      }
      // Upload
      const imageUrl = await uploadImageAsync(photo.uri);
      await createPhotoDocument({ imageUrl, coords, userId: user?.uid || 'anonymous' });
      Alert.alert('Photo sauvegardée', 'Votre photo a été enregistrée avec succès.');
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible de prendre la photo.');
    } finally {
      setIsBusy(false);
    }
  }

  // Determine a usable Camera component if available
  // Use the named Camera import from expo-camera; guard in case it's undefined in this environment
  const CameraComponent = Camera || null;

  if (hasPermission === null) return (
    <View style={styles.container}>
      <Text style={styles.permissionText}>Demande de permission...</Text>
    </View>
  );
  if (hasPermission === false) return (
    <View style={styles.container}>
      <Ionicons name="camera-off" size={60} color="#FF3B30" />
      <Text style={styles.permissionText}>Accès à la caméra refusé.</Text>
      <Text style={styles.permissionSubtext}>Veuillez accorder la permission dans les paramètres de l&apos;appareil.</Text>
      <TouchableOpacity style={styles.retryButton} onPress={requestPermissions}>
        <Text style={styles.retryText}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );
  if (!CameraComponent) return <View style={styles.container}><Text>Caméra non disponible dans cet environnement.</Text></View>;

  return (
    <View style={styles.container}>
      <CameraComponent style={styles.camera} type={type} ref={cameraRef}>
        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.toggleButton} onPress={toggleCameraType}>
            <Ionicons name="camera-reverse" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture} disabled={isBusy}>
            <Ionicons name="camera" size={24} color="#007AFF" />
            <Text style={styles.buttonText}>{isBusy ? 'Enregistrement...' : 'Prendre'}</Text>
          </TouchableOpacity>
        </View>
      </CameraComponent>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eaf6fb', justifyContent: 'center', alignItems: 'center' },
  permissionText: { fontSize: 18, color: '#333', textAlign: 'center', marginVertical: 10 },
  permissionSubtext: { fontSize: 14, color: '#666', textAlign: 'center', marginVertical: 10, paddingHorizontal: 20 },
  retryButton: { backgroundColor: '#007AFF', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25, marginTop: 20 },
  retryText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  camera: { flex: 1 },
  cameraControls: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end', alignItems: 'center', padding: 20 },
  toggleButton: { position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 25 },
  captureButton: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 28, borderRadius: 30, marginBottom: 24, flexDirection: 'row', alignItems: 'center' },
  buttonText: { color: '#007AFF', fontWeight: 'bold', marginLeft: 8 },
});
