import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Platform,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { uploadImageAsync, createPhotoDocument } from '../services/firebase';
import { useAuth } from '../services/auth';

type CameraStackParamList = {
  CameraMain: undefined;
  Photos: undefined;
};

type CameraScreenNavigationProp = StackNavigationProp<CameraStackParamList>;

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [locationPermissionRequested, setLocationPermissionRequested] = useState(false);
  const [cameraType, setCameraType] = useState<'back' | 'front'>('back');
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');
  const [isRecording, setIsRecording] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<{
    uri: string;
    location: { latitude: number; longitude: number };
  } | null>(null);
  const cameraRef = useRef<any>(null);
  const navigation = useNavigation<CameraScreenNavigationProp>();
  const { user } = useAuth();
  // Marquer que le montage caméra a été tenté
  useEffect(() => {
    if (permission?.status === 'granted') {
      console.log('🔧 Montage caméra tenté');
    }
  }, [permission?.status]);

  useEffect(() => {
    (async () => {
      try {
        // Demander les permissions de caméra
        const cameraStatus = await requestPermission();

        // Demander les permissions de localisation
        console.log('📍 Demande de permission localisation...');
        const locationStatus = await Location.requestForegroundPermissionsAsync();
        console.log('📍 Statut permission localisation:', locationStatus);

        // Essayer de demander à nouveau si refusé
        if (locationStatus.status !== 'granted' && locationStatus.canAskAgain) {
          console.log('🔄 Tentative de redemande permission localisation...');
          const retryStatus = await Location.requestForegroundPermissionsAsync();
          console.log('📍 Statut après retry:', retryStatus);
          setLocationPermission(retryStatus.status === 'granted');
        } else {
          setLocationPermission(locationStatus.status === 'granted');
        }

        setLocationPermissionRequested(true);

        // Vérifications supplémentaires pour Android
        if (Platform.OS === 'android') {
          // Vérifier les permissions de stockage si nécessaire
          if (Platform.Version >= 33) {
            // Android 13+ utilise des permissions différentes
            console.log('Android 13+ détecté, permissions média gérées automatiquement');
          }
        }

        // Alertes pour les permissions refusées
        if (cameraStatus && cameraStatus.status !== 'granted') {
          Alert.alert(
            'Permission caméra requise',
            'L\'accès à la caméra est nécessaire pour prendre des photos. Veuillez l\'autoriser dans les paramètres de votre appareil.',
            [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Réessayer', onPress: () => requestPermission() }
            ]
          );
        }

        if (locationStatus.status !== 'granted') {
          console.log('⚠️ Permission localisation refusée ou non disponible');
          // Ne pas afficher d'alerte bloquante, juste un avertissement
          console.warn('Localisation non disponible - les photos ne seront pas géolocalisées');
        }

      } catch (error) {
        console.error('Erreur lors de la demande de permissions:', error);
        Alert.alert(
          'Erreur de permissions',
          'Une erreur s\'est produite lors de la demande de permissions. Veuillez redémarrer l\'application.'
        );
      }
    })();
  }, [requestPermission]);

  const takePicture = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        setIsRecording(true);
        console.log('� Début capture rapide...');

        // Capture ultra-rapide avec options minimales
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7, // Réduit pour plus de vitesse
          base64: false,
          exif: false,
          skipProcessing: true, // Android seulement
        });

        console.log('✅ Photo capturée:', photo.uri);

        // Obtenir la localisation en parallèle avec un timeout court
        let location: any = null;
        if (locationPermission === true) {
          try {
            // Créer un timeout personnalisé
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Location timeout')), 1000) // 1 seconde
            );

            const locationPromise = Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Low, // Moins précis mais plus rapide
            });

            location = await Promise.race([locationPromise, timeoutPromise]);
          } catch (locationError) {
            console.warn('⚠️ Localisation rapide échouée:', locationError);
          }
        }

        // Position par défaut si localisation échoue
        if (!location || !location.coords) {
          location = {
            coords: {
              latitude: 48.8566,
              longitude: 2.3522,
              accuracy: 1000,
            },
          };
        }

        // Préparer les données et afficher immédiatement
        const capturedPhotoData = {
          uri: photo.uri,
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
        };

        setCapturedPhoto(capturedPhotoData);
        setShowPreview(true);

      } catch (error) {
        console.error('❌ Erreur capture:', error);
        Alert.alert('Erreur', 'Impossible de prendre la photo');
      } finally {
        setIsRecording(false);
      }
    }
  };

  const savePhoto = async () => {
    if (!capturedPhoto || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      console.log('💾 Début de la sauvegarde...');

      // Utiliser un userId temporaire si non connecté (pour les tests)
      const userId = user?.uid || 'test-user-' + Date.now();

      const downloadURL = await uploadImageAsync(capturedPhoto.uri, userId);
      console.log('✅ Upload réussi:', downloadURL);

      await createPhotoDocument({
        imageUrl: downloadURL,
        coords: {
          latitude: capturedPhoto.location.latitude,
          longitude: capturedPhoto.location.longitude,
        },
        userId: userId,
      });
      console.log('✅ Sauvegarde Firestore réussie');

      Alert.alert('Succès', 'Photo sauvegardée avec succès !');
      setShowPreview(false);
      setCapturedPhoto(null);
    } catch (error) {
      console.error('❌ Erreur de sauvegarde:', error);
      const err = error as Error;

      let errorMessage = 'Impossible de sauvegarder la photo';
      if (err.message?.includes('storage') || err.message?.includes('unauthorized')) {
        errorMessage = 'Erreur d\'accès au stockage. Vérifiez votre connexion et réessayez.';
      } else if (err.message?.includes('permission')) {
        errorMessage = 'Erreur de permissions. Vérifiez vos droits d\'accès.';
      } else if (err.message?.includes('network')) {
        errorMessage = 'Erreur réseau. Vérifiez votre connexion internet.';
      } else if (err.message?.includes('auth')) {
        errorMessage = 'Erreur d\'authentification. Essayez de vous reconnecter.';
      }

      Alert.alert('Erreur de sauvegarde', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const discardPhoto = () => {
    setShowPreview(false);
    setCapturedPhoto(null);
  };

  // Vérifier si toutes les permissions sont accordées
  console.log('🔍 État des permissions:', {
    cameraPermission: permission?.status,
    locationPermission: locationPermission,
    locationPermissionRequested: locationPermissionRequested,
    isRecording: isRecording
  });

  if (!permission) {
    console.log('⚠️ Permission caméra non chargée');
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
    console.log('❌ Permission caméra refusée');
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

  // Afficher immédiatement la caméra une fois les permissions accordées
  console.log('✅ Permissions accordées, affichage de la caméra');
  return (
    <View style={styles.container}>
      <CameraView
        ref={(ref) => {
          console.log('📸 Référence caméra assignée:', !!ref);
          cameraRef.current = ref;
        }}
        style={styles.camera}
        facing={cameraType}
        flash={flashMode}
        onCameraReady={() => {
          console.log('📷 Caméra prête - événement onCameraReady déclenché');
        }}
        onMountError={(error) => {
          console.error('❌ Erreur montage caméra:', error);
        }}
      />

      {/* Indicateur de statut d'authentification */}
      <View style={[styles.authIndicator, { backgroundColor: user ? 'rgba(52, 199, 89, 0.8)' : 'rgba(255, 59, 48, 0.8)' }]}>
        <Ionicons
          name={user ? "person" : "person-outline"}
          size={16}
          color="#fff"
        />
        <Text style={styles.authIndicatorText}>
          {user ? 'Connecté' : 'Non connecté'}
        </Text>
      </View>

      {/* Avertissement localisation si nécessaire */}
      {locationPermissionRequested && locationPermission === false && (
        <View style={styles.locationWarning}>
          <Ionicons name="location" size={16} color="#fff" />
          <Text style={styles.locationWarningText}>
            Localisation indisponible
          </Text>
        </View>
      )}

      {/* Bouton photo en haut à gauche */}
      <TouchableOpacity
        style={styles.photoButton}
        onPress={() => navigation.navigate('Photos')}
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
          {isRecording ? (
            <View style={styles.captureButtonInner}>
              <Ionicons name="sync" size={24} color="#fff" />
            </View>
          ) : (
            <View style={styles.captureButtonInner} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setCameraType(cameraType === 'back' ? 'front' : 'back')}
        >
          <Ionicons name="camera-reverse" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Modal de prévisualisation compacte */}
      <Modal
        visible={showPreview}
        animationType="fade"
        transparent={true}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.previewModal}>
            {capturedPhoto && (
              <>
                {/* Image capturée - plus petite */}
                <View style={styles.previewImageContainer}>
                  <Image
                    source={{ uri: capturedPhoto.uri }}
                    style={styles.previewImageSmall}
                    resizeMode="cover"
                  />
                </View>

                {/* Boutons d'action compacts */}
                <View style={styles.previewActionsCompact}>
                  <TouchableOpacity
                    style={[styles.previewActionButtonCompact, styles.discardButton]}
                    onPress={discardPhoto}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={20} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.previewActionButtonCompact, styles.saveButton]}
                    onPress={savePhoto}
                    activeOpacity={0.8}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Ionicons name="sync" size={20} color="#fff" />
                    ) : (
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 0, // Supprimé le padding pour laisser la StatusBar visible
  },
  camera: {
    flex: 1,
  },
  photoButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30, // Ajusté pour laisser la StatusBar visible
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
    bottom: Platform.OS === 'ios' ? 100 : 80, // Plus de marge en bas sur iOS pour éviter la barre de navigation
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
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  locationWarning: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    backgroundColor: 'rgba(255, 165, 0, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationWarningText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  cameraIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cameraIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  forceCameraButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    left: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  forceCameraText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  authIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 90,
    left: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  authIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImageContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '90%',
    height: '70%',
    borderRadius: 20,
  },
  imageInfoOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 12,
  },
  previewInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  previewInfoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  previewActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    minWidth: 140,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  previewActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Nouveaux styles pour la modal compacte
  previewModal: {
    width: '85%',
    maxWidth: 320,
    backgroundColor: '#000',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  previewImageSmall: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  previewActionsCompact: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginTop: 16,
  },
  previewActionButtonCompact: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
