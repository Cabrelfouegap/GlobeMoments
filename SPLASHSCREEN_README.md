# Gestion du SplashScreen - GlobeMoments

## Vue d'ensemble

Le splashscreen de GlobeMoments est composé de deux parties :
1. **Splashscreen natif** : Géré par Expo avec la configuration dans `app.config.js`
2. **Splashscreen personnalisé** : Composant React avec animations dans `components/SplashScreen.tsx`

## Configuration

### 1. Configuration Expo (app.config.js)

Le splashscreen natif est configuré dans `app.config.js` :

```javascript
plugins: [
  [
    'expo-splash-screen',
    {
      image: './assets/images/splash-icon.png',
      imageWidth: 200,
      resizeMode: 'contain',
      backgroundColor: '#007AFF',
      dark: {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#007AFF'
      }
    }
  ]
]
```

### 2. Assets requis

Les assets suivants doivent être présents dans `assets/images/` :
- `splash-icon.png` : Icône du splashscreen (recommandé : 512x512px)
- `adaptive-icon.png` : Icône adaptative pour Android
- `favicon.png` : Icône pour le web

## Composant SplashScreen personnalisé

### Fonctionnalités

- **Animation d'entrée** : Fade-in, scale et rotation du logo
- **Barre de progression** : Animation de chargement
- **Masquage automatique** : Après 3 secondes
- **Thème cohérent** : Utilise les couleurs de l'application

### Personnalisation

Vous pouvez modifier :
- La durée du splashscreen (actuellement 3 secondes)
- Les couleurs dans le StyleSheet
- Les animations dans le composant
- Le texte affiché

### Utilisation dans App.tsx

Le splashscreen personnalisé est intégré dans `AppNavigator` :

```tsx
const [isSplashVisible, setIsSplashVisible] = React.useState(true);

const handleSplashFinish = () => {
  setIsSplashVisible(false);
};

if (isSplashVisible) {
  return <SplashScreenComponent onFinish={handleSplashFinish} />;
}
```

## Optimisations

### Performance
- Utilise `useNativeDriver: true` pour les animations
- Animations parallèles pour de meilleures performances
- Masquage du splashscreen natif après le personnalisé

### Accessibilité
- Texte descriptif pour les lecteurs d'écran
- Contraste suffisant entre texte et fond
- Animations respectant les préférences utilisateur

## Dépannage

### Problèmes courants

1. **Splashscreen ne s'affiche pas**
   - Vérifiez que `expo-splash-screen` est installé
   - Vérifiez les chemins des assets dans `app.config.js`

2. **Animations saccadées**
   - Assurez-vous que `useNativeDriver: true` est utilisé
   - Testez sur un appareil réel plutôt qu'un émulateur

3. **Couleurs incorrectes**
   - Vérifiez la configuration dark/light mode
   - Testez sur différents appareils

### Debug

Pour déboguer le splashscreen :
```bash
# Vérifier les assets
ls -la assets/images/

# Tester la configuration
npx expo config --type public
```

## Migration depuis l'ancien système

Si vous migrez depuis un ancien système de splashscreen :

1. Supprimez tout code de splashscreen personnalisé existant
2. Assurez-vous que `expo-splash-screen` est dans les dépendances
3. Mettez à jour `app.config.js` avec la nouvelle configuration
4. Testez sur tous les appareils cibles

## Bonnes pratiques

- Gardez le splashscreen court (2-3 secondes maximum)
- Utilisez des couleurs cohérentes avec votre branding
- Testez sur différents appareils et tailles d'écran
- Considérez l'accessibilité dès la conception
- Optimisez les assets pour réduire la taille du bundle
