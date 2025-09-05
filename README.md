# GlobeMoments
**L'application ultime pour capturer et organiser vos souvenirs de voyage**

GlobeMoments est une application mobile innovante conçue pour les voyageurs passionnés. Prenez des photos géolocalisées, organisez-les sur une carte interactive, et créez des souvenirs durables de vos périples autour du monde.

## Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Technologies](#technologies)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Publication dans les Stores](#publication-dans-les-stores)
- [Architecture](#architecture)
- [API et Services](#api-et-services)
- [Dépannage](#dépannage)
- [Contribuer](#contribuer)
- [Licence](#licence)
- [Auteurs](#auteurs)

---

## Fonctionnalités

### Capture intelligente
- **Caméra intégrée** avec contrôles avancés (flash, rotation, zoom)
- **Géolocalisation automatique** de toutes vos photos
- **Capture ultra-rapide** optimisée pour iOS et Android
- **Prévisualisation instantanée** avec options de sauvegarde/discard

### Cartes interactives
- **Visualisation géographique** de toutes vos photos avec OpenStreetMap
- **Navigation intégrée** vers les lieux via l'application de cartes native
- **Clusters intelligents** pour optimiser l'affichage
- **Filtres par date et lieu** pour retrouver facilement vos souvenirs

### Organisation temporelle
- **Calendrier intégré** pour planifier vos voyages
- **Timeline interactive** de vos aventures
- **Tri chronologique** automatique des photos
- **Statistiques de voyage** détaillées

### Authentification sécurisée
- **Connexion Google** intégrée
- **Authentification Firebase** robuste
- **Réinitialisation de mot de passe** par email
- **Gestion de session** automatique

### Interface moderne
- **Thèmes sombre/clair** adaptatifs
- **Animations fluides** et transitions élégantes
- **Splash screen animé** au démarrage
- **Interface responsive** optimisée pour tous les écrans

### Stockage cloud
- **Sauvegarde automatique** sur Firebase Storage
- **Synchronisation multi-appareils**
- **Compression intelligente** des images
- **Sauvegarde hors ligne** avec sync automatique

### Statistiques avancées
- **Tableau de bord** complet de vos voyages
- **Métriques détaillées** (km parcourus, pays visités, photos prises)
- **Graphiques interactifs** de vos aventures
- **Rapports personnalisés** de vos périples

---

## Technologies

### **Frontend**
```json
{
  "React Native": "0.79.5",
  "Expo": "~53.0.22",
  "TypeScript": "~5.8.3",
  "React Navigation": "^7.x"
}
```

### **Backend & Services**
```json
{
  "Firebase Auth": "12.2.1",
  "Firebase Firestore": "12.2.1",
  "Firebase Storage": "12.2.1",
  "Google Sign-In": "^15.0.0"
}
```

### **Appareils & Capteurs**
```json
{
  "Expo Camera": "^16.1.11",
  "Expo Location": "^18.1.6",
  "Expo Image Picker": "^16.1.4",
  "Expo Network": "^7.1.5"
}
```

### **UI & Animations**
```json
{
  "Expo Vector Icons": "^14.1.0",
  "React Native Reanimated": "~3.17.4",
  "React Native Maps": "^1.20.1",
  "React Native Calendars": "^1.1313.0"
}
```

### **Outils de développement**
```json
{
  "ESLint": "^9.25.0",
  "Expo CLI": "Latest",
  "AsyncStorage": "^2.1.2"
}
```

---

## Installation

### Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** (version 18 ou supérieure)
- **npm** ou **yarn**
- **Expo CLI** : `npm install -g @expo/cli`
- **Git**

### 1. Cloner le repository

```bash
git clone https://github.com/Cabrelfouegap/GlobeMoments.git
cd GlobeMoments
```

### 2. Installer les dépendances

```bash
npm install
# ou
yarn install
```

### 3. Configuration Firebase

Voir la section [Configuration Firebase](#firebase-setup) ci-dessous.

### 4. Lancer l'application

```bash
# Pour le développement
npm start
# ou
expo start

# Pour Android
npm run android
# ou
expo start --android

# Pour iOS (macOS uniquement)
npm run ios
# ou
expo start --ios

# Pour le web
npm run web
# ou
expo start --web
```

### 5. Scanner le QR code

Utilisez l'application **Expo Go** sur votre téléphone pour scanner le QR code affiché dans le terminal.

---

## Publication dans les Stores

### Build EAS (Expo Application Services)

GlobeMoments utilise EAS Build pour la compilation et le déploiement automatisé.

#### Configuration EAS

Le projet est configuré avec EAS CLI version >= 10.0.0 avec versioning distant :

```json
{
  "cli": {
    "version": ">= 10.0.0",
    "appVersionSource": "remote",
    "requireCommit": false
  }
}
```

#### Commandes de build

```bash
# Build de développement
npx eas build --platform android --profile development

# Build de prévisualisation
npx eas build --platform android --profile preview

# Build de production (Play Store)
npx eas build --platform android --profile production

# Build iOS (macOS uniquement)
npx eas build --platform ios --profile production
```

#### Suivre un build

```bash
# Voir tous les builds
npx eas build:list

# Voir les détails d'un build spécifique
npx eas build:view [BUILD_ID]

# Suivre les logs en temps réel
npx eas build:logs [BUILD_ID]
```

### Déploiement Play Store

#### 1. Préparation du build

```bash
# Nettoyer les dépendances
rm -rf node_modules package-lock.json
npm install

# Lancer le build de production
npx eas build --platform android --profile production --no-wait
```

#### 2. Téléchargement de l'APK/AAB

Une fois le build terminé, téléchargez le fichier depuis :
- **Expo Dashboard** : https://expo.dev/accounts/[votre-compte]/projects/globemoments/builds
- **EAS CLI** : `npx eas build:view [BUILD_ID]`

#### 3. Publication sur Google Play Console

1. **Créer une application** sur Google Play Console
2. **Uploader le bundle** (.aab recommandé)
3. **Remplir les informations** :
   - Nom de l'app : GlobeMoments
   - Description : Application de photos géolocalisées
   - Captures d'écran et icônes
4. **Publier** en version alpha/beta/production

---

## Architecture

### Structure du projet

```
GlobeMoments/
├── app/                    # Pages et navigation (Expo Router)
│   ├── _layout.tsx        # Layout principal
│   ├── index.tsx          # Page d'accueil
│   ├── camera.tsx         # Page caméra
│   ├── map.tsx           # Page carte
│   ├── photos.tsx        # Page photos
│   └── settings.tsx      # Page paramètres
├── components/            # Composants réutilisables
├── constants/            # Constantes de l'application
├── hooks/                # Hooks personnalisés
├── services/             # Services (Firebase, etc.)
├── utils/                # Utilitaires
├── assets/               # Images et ressources
├── app.config.js         # Configuration Expo
├── eas.json             # Configuration EAS Build
└── package.json         # Dépendances
```

### Flux de données

1. **Authentification** → Firebase Auth
2. **Photos** → Caméra Expo → Firebase Storage
3. **Géolocalisation** → Expo Location → Firestore
4. **Cartes** → React Native Maps + OpenStreetMap
5. **Calendrier** → React Native Calendars

---

## API et Services

### Firebase

- **Authentication** : Connexion Google et email/mot de passe
- **Firestore** : Stockage des métadonnées des photos
- **Storage** : Stockage des images compressées
- **Rules** : Sécurité et validation des données

### Services de cartographie

- **OpenStreetMap** : Cartes gratuites et open source
- **React Native Maps** : Composant de cartes natif
- **Expo Location** : Géolocalisation précise

### Services photo

- **Expo Camera** : Capture photo avec contrôles avancés
- **Expo Image Picker** : Sélection depuis la galerie
- **Compression automatique** : Optimisation du stockage

---
## Utilisation

### Première utilisation

1. **Lancez l'application** - Le splash screen animé s'affiche
2. **Créez un compte** - Inscrivez-vous avec email ou Google
3. **Autorisez les permissions** - Caméra et localisation
4. **Commencez à photographier** - Vos souvenirs de voyage !

### Prendre des photos

1. **Ouvrez l'onglet Caméra** (icône en bas)
2. **Ajustez les paramètres** :
   - Flash : Éteint/Auto/Allumé
   - Caméra : Avant/Arrière
3. **Prenez la photo** - Appuyez sur le bouton circulaire
4. **Prévisualisez** - Choisissez Sauvegarder ou Annuler

### Explorer sur la carte

1. **Ouvrez l'onglet Carte** (icône globe)
2. **Visualisez vos photos** - Points colorés sur la carte
3. **Zoomez et naviguez** - Touches multi-doigts
4. **Cliquez sur un point** - Voir la photo et naviguer

### Organiser avec le calendrier

1. **Ouvrez l'onglet Calendrier**
2. **Sélectionnez une date** - Photos de ce jour
3. **Planifiez des voyages** - Ajoutez des événements
4. **Visualisez votre timeline** - Chronologie de vos aventures
