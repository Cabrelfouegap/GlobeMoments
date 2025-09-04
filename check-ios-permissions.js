// Fichier supprimé - était spécifique à iOS uniquement

console.log('🔍 Vérification des permissions iOS pour GlobeMoments\n');
const appConfigPath = path.join(__dirname, 'app.config.js');

try {
  // Lire la configuration
  const configContent = fs.readFileSync(appConfigPath, 'utf8');

  console.log('📋 Configuration iOS trouvée :');

  // Vérifier les permissions essentielles
  const permissions = [
    'NSLocationWhenInUseUsageDescription',
    'NSLocationAlwaysAndWhenInUseUsageDescription',
    'NSCameraUsageDescription'
  ];

  permissions.forEach(perm => {
    if (configContent.includes(perm)) {
      console.log(`✅ ${perm} : Présent`);
    } else {
      console.log(`❌ ${perm} : MANQUANT`);
    }
  });

  // Vérifier UIBackgroundModes
  if (configContent.includes('"location"')) {
    console.log('✅ UIBackgroundModes location : Présent');
  } else {
    console.log('❌ UIBackgroundModes location : MANQUANT');
  }

  console.log('\n💡 Prochaines étapes :');
  console.log('1. Si des permissions sont manquantes, vérifiez app.config.js');
  console.log('2. Reconstruisez l\'app : npx expo run:ios');
  console.log('3. Testez les permissions dans l\'app');

} catch (error) {
  console.error('❌ Erreur lors de la vérification:', error.message);
}

console.log('\n📖 Consultez FIX_GPS_IOS_PERMISSIONS.md pour les solutions détaillées');
