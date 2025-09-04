// test-location.js
// Script de test rapide pour la localisation
import * as Location from 'expo-location';

async function testLocation() {
  console.log('🧪 Test de localisation démarré...');

  try {
    // Test 1: Services de localisation
    console.log('📍 Test 1: Services de localisation');
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    console.log('Services activés:', servicesEnabled);

    if (!servicesEnabled) {
      console.log('❌ ÉCHEC: Services de localisation désactivés');
      return;
    }

    // Test 2: Permissions
    console.log('📍 Test 2: Permissions');
    const { status } = await Location.getForegroundPermissionsAsync();
    console.log('Statut permission:', status);

    if (status !== 'granted') {
      console.log('❌ ÉCHEC: Permission non accordée');
      return;
    }

    // Test 3: Obtention de position
    console.log('📍 Test 3: Obtention de position');
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeout: 10000,
    });

    console.log('✅ SUCCÈS: Position obtenue');
    console.log('Latitude:', position.coords.latitude);
    console.log('Longitude:', position.coords.longitude);
    console.log('Précision:', position.coords.accuracy, 'mètres');

  } catch (error) {
    console.log('❌ ERREUR:', error.message);
    console.log('Code erreur:', error.code);
  }
}

// Exporter pour utilisation
export { testLocation };

// Pour exécution directe
if (typeof module !== 'undefined' && module.exports) {
  testLocation();
}
