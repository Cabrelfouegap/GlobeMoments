import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { uploadImageAsync, createPhotoDocument } from '../../services/firebase';
import { useAuth } from '../../services/auth';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState<'back' | 'front'>('back');
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');
  const [isRecording, setIsRecording] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<{
    uri: string;
    location: { latitude: number; longitude: number };
  } | null>(null);
  const cameraRef = useRef<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      // Vérifier les permissions de localisation au démarrage
      const locationStatus = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(locationStatus.status === 'granted');

      // Pour iOS, demander aussi les permissions de caméra si nécessaire
      if (Platform.OS === 'ios') {
        const cameraStatus = await requestPermission();
        if (cameraStatus) {
          // Permission déjà accordée
        }
      }
    })();
  }, [requestPermission]);

  const takePicture = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        setIsRecording(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });

        // Obtenir la localisation
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setCapturedPhoto({
          uri: photo.uri,
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
        });
        setShowPreview(true);
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de prendre la photo');
        console.error(error);
      } finally {
        setIsRecording(false);
      }
    }
  };

  const savePhoto = async () => {
    if (!capturedPhoto || !user) return;

    try {
      // Upload vers Firebase Storage
      const downloadURL = await uploadImageAsync(capturedPhoto.uri);

      // Sauvegarder dans Firestore
      await createPhotoDocument({
        imageUrl: downloadURL,
        coords: {
          latitude: capturedPhoto.location.latitude,
          longitude: capturedPhoto.location.longitude,
        },
        userId: user.uid,
      });

      Alert.alert('Succès', 'Photo sauvegardée avec succès !');
      setShowPreview(false);
      setCapturedPhoto(null);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la photo');
      console.error(error);
    }
  };

  const discardPhoto = () => {
    setShowPreview(false);
    setCapturedPhoto(null);
  };

  // Vérifier si toutes les permissions sont accordées

  if (!permission) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Ionicons name="camera" size={60} color="#007AFF" />
          <Text style={styles.permissionTitle}>Accès à la caméra requis</Text>
          <Text style={styles.permissionText}>Appuyez pour autoriser l&apos;accès à la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (permission.status === 'denied') {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="close-circle" size={60} color="#ff3b30" />
          <Text style={styles.errorTitle}>Accès caméra refusé</Text>
          <Text style={styles.errorText}>
            Veuillez autoriser l&apos;accès à la caméra dans les paramètres de votre appareil
          </Text>
          <TouchableOpacity onPress={requestPermission} style={styles.retryButton}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!locationPermission) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="location" size={60} color="#ff9500" />
          <Text style={styles.errorTitle}>Localisation requise</Text>
          <Text style={styles.errorText}>
            L&apos;accès à la localisation est nécessaire pour géolocaliser vos photos
          </Text>
          <TouchableOpacity
            onPress={async () => {
              const locationStatus = await Location.requestForegroundPermissionsAsync();
              setLocationPermission(locationStatus.status === 'granted');
            }}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Autoriser</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Si toutes les permissions sont accordées, afficher la caméra
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        flash={flashMode}
      />

      {/* Bouton photo en haut à gauche */}
      <TouchableOpacity
        style={styles.photoButton}
        onPress={() => console.log('Navigate to photos')}
      >
        <Ionicons name="images" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Contrôles en bas */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setFlashMode(flashMode === 'off' ? 'on' : 'off')}
        >
          <Ionicons
            name={flashMode === 'off' ? 'flash-off' : 'flash'}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureButton, isRecording && styles.captureButtonRecording]}
          onPress={takePicture}
          disabled={isRecording}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setCameraType(cameraType === 'back' ? 'front' : 'back')}
        >
          <Ionicons name="camera-reverse" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Modal de prévisualisation */}
      <Modal visible={showPreview} animationType="slide">
        <View style={styles.previewContainer}>
          {capturedPhoto && (
            <>
              <View style={styles.previewImage}>
                <Text style={styles.previewText}>Photo capturée !</Text>
              </View>

              <View style={styles.previewControls}>
                <TouchableOpacity
                  style={[styles.previewButton, styles.discardButton]}
                  onPress={discardPhoto}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                  <Text style={styles.previewButtonText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.previewButton, styles.saveButton]}
                  onPress={savePhoto}
                >
                  <Ionicons name="checkmark" size={24} color="#fff" />
                  <Text style={styles.previewButtonText}>Sauvegarder</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  photoButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonRecording: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  previewText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    paddingBottom: 40,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    minWidth: 120,
    justifyContent: 'center',
  },
  discardButton: {
    backgroundColor: '#ff3b30',
  },
  saveButton: {
    backgroundColor: '#34c759',
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#34c759',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
});
