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
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { uploadImageAsync, createPhotoDocument, testFirebaseConnection } from '../services/firebase';
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

        console.log('🔄 Début de la capture de photo...');

        // Vérifications préalables
        if (!permission || permission.status !== 'granted') {
          throw new Error('Permission caméra non accordée');
        }

        if (locationPermission === false) {
          console.log('⚠️ Localisation non disponible - utilisation d\'une position par défaut');
          // Ne pas bloquer la prise de photo, juste avertir
        }

        // Configuration spécifique à Android
        const cameraOptions: any = {
          quality: Platform.OS === 'android' ? 0.8 : 0.9,
          base64: false,
          exif: false,
        };

        // Pour Android, ajouter des options supplémentaires
        if (Platform.OS === 'android') {
          cameraOptions.skipProcessing = false;
          cameraOptions.fastMode = false;
        }

        console.log('📸 Configuration caméra:', cameraOptions);

        console.log('🔍 Vérification de la référence caméra:', {
          cameraRefExists: !!cameraRef.current,
          cameraRefType: typeof cameraRef.current,
          cameraRefKeys: cameraRef.current ? Object.keys(cameraRef.current) : 'N/A'
        });

        console.log('📸 Tentative de capture...');
        let photo;
        try {
          photo = await cameraRef.current.takePictureAsync(cameraOptions);
          console.log('✅ takePictureAsync réussi');
        } catch (takePictureError) {
          console.error('❌ Erreur takePictureAsync:', takePictureError);
          const error = takePictureError as Error;
          throw new Error(`Erreur lors de la capture: ${error.message}`);
        }

        console.log('✅ Photo capturée avec succès:', {
          uri: photo.uri,
          width: photo.width,
          height: photo.height,
          exists: photo.uri ? 'oui' : 'non'
        });

        // Vérifications post-capture pour Android
        if (Platform.OS === 'android') {
          try {
            const fileInfo = await FileSystem.getInfoAsync(photo.uri);
            console.log('📁 Informations fichier:', {
              exists: fileInfo.exists,
              size: fileInfo.exists ? (fileInfo as any).size : 'N/A',
              uri: fileInfo.uri
            });

            if (!fileInfo.exists) {
              throw new Error('Le fichier photo n\'a pas été créé correctement');
            }

            if (fileInfo.size === 0) {
              throw new Error('Le fichier photo est vide');
            }
          } catch (fileError) {
            console.error('❌ Erreur vérification fichier:', fileError);
            throw new Error('Erreur de sauvegarde du fichier photo');
          }
        }

        // Obtenir la localisation avec timeout
        console.log('📍 Récupération de la localisation...');
        let location;
        try {
          if (locationPermission === true) {
            const locationOptions = {
              accuracy: Location.Accuracy.High,
              timeout: 10000, // 10 secondes timeout
            };

            location = await Location.getCurrentPositionAsync(locationOptions);
            console.log('✅ Localisation obtenue:', {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy
            });
          } else {
            console.log('⚠️ Localisation non disponible, utilisation de la position par défaut');
            // Utiliser une localisation par défaut si la géolocalisation n'est pas disponible
            location = {
              coords: {
                latitude: 48.8566, // Paris par défaut
                longitude: 2.3522,
                accuracy: 1000,
              },
            };

            // Afficher un avertissement à l'utilisateur
            Alert.alert(
              'Localisation indisponible',
              'Impossible d\'obtenir votre position. Une position par défaut sera utilisée pour cette photo.',
              [{ text: 'OK' }]
            );
          }
        } catch (locationError) {
          console.warn('⚠️ Erreur de localisation:', locationError);

          // Utiliser une localisation par défaut si la géolocalisation échoue
          location = {
            coords: {
              latitude: 48.8566, // Paris par défaut
              longitude: 2.3522,
              accuracy: 1000,
            },
          };

          Alert.alert(
            'Localisation indisponible',
            'Impossible d\'obtenir votre position. Une position par défaut sera utilisée.',
            [{ text: 'OK' }]
          );
        }

        // Créer l'objet photo capturée
        const capturedPhotoData = {
          uri: photo.uri,
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
        };

        console.log('🎯 Photo prête pour prévisualisation:', capturedPhotoData);

        setCapturedPhoto(capturedPhotoData);
        setShowPreview(true);

      } catch (error) {
        console.error('❌ Erreur complète de capture:', error);

        const err = error as Error;
        let errorTitle = 'Erreur de capture';
        let errorMessage = 'Impossible de prendre la photo.';

        // Messages d'erreur spécifiques selon le type d'erreur
        if (err.message?.includes('permission') || err.message?.includes('denied')) {
          errorTitle = 'Permission refusée';
          errorMessage = Platform.OS === 'android'
            ? 'L\'accès à la caméra a été refusé. Allez dans Paramètres > Applications > GlobeMoments > Permissions et activez la caméra.'
            : 'L\'accès à la caméra a été refusé. Allez dans Paramètres > Confidentialité > Appareil photo et activez GlobeMoments.';
        } else if (err.message?.includes('camera') || err.message?.includes('initialis')) {
          errorTitle = 'Caméra indisponible';
          errorMessage = 'La caméra n\'est pas disponible. Vérifiez qu\'aucune autre application n\'utilise la caméra.';
        } else if (err.message?.includes('storage') || err.message?.includes('file')) {
          errorTitle = 'Erreur de stockage';
          errorMessage = 'Impossible de sauvegarder la photo. Vérifiez l\'espace de stockage disponible.';
        } else if (err.message?.includes('location') || err.message?.includes('gps')) {
          errorTitle = 'Erreur de localisation';
          errorMessage = 'Impossible d\'obtenir votre position. Vérifiez que la localisation est activée.';
        } else if (Platform.OS === 'android') {
          errorTitle = 'Erreur Android';
          errorMessage = `Erreur système: ${err.message || 'Erreur inconnue'}. Essayez de redémarrer l'application.`;
        }

        Alert.alert(errorTitle, errorMessage, [
          { text: 'Réessayer', onPress: () => takePicture() },
          { text: 'Annuler', style: 'cancel' }
        ]);

      } finally {
        setIsRecording(false);
      }
    }
  };

  const savePhoto = async () => {
    if (!capturedPhoto) {
      return;
    }

    // Vérifier l'état d'authentification
    console.log('👤 État utilisateur:', { user: user ? 'connecté' : 'non connecté', userId: user?.uid });

    try {
      console.log('💾 Début de la sauvegarde...');

      // Upload vers Firebase Storage
      console.log('📤 Upload vers Firebase Storage...');

      // Utiliser un userId temporaire si non connecté (pour les tests)
      const userId = user?.uid || 'test-user-' + Date.now();

      const downloadURL = await uploadImageAsync(capturedPhoto.uri, userId);
      console.log('✅ Upload réussi:', downloadURL);

      // Sauvegarder dans Firestore
      console.log('💾 Sauvegarde dans Firestore...');

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

      {/* Bouton test Firebase en haut à droite */}
      <TouchableOpacity
        style={styles.testFirebaseButton}
        onPress={async () => {
          console.log('🧪 Test de connexion Firebase...');
          const result = await testFirebaseConnection();
          Alert.alert(
            result.success ? 'Test réussi' : 'Test échoué',
            result.message
          );
        }}
      >
        <Ionicons name="cloud" size={20} color="#fff" />
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
        <SafeAreaView style={styles.previewContainer}>
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
        </SafeAreaView>
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
  testFirebaseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    backgroundColor: 'rgba(52, 199, 89, 0.8)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
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
});
