# GlobeMoments - Instructions de déploiement Firebase

## 🚀 Déploiement des règles Firebase

Pour que l'application fonctionne correctement en production, vous devez déployer les règles de sécurité Firebase.

### 1. Installation de Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Connexion à Firebase
```bash
firebase login
```

### 3. Initialisation du projet (si nécessaire)
```bash
firebase init
```
Sélectionnez Firestore et Storage quand demandé.

### 4. Déploiement des règles
```bash
# Déployer toutes les règles
firebase deploy --only firestore:rules,storage

# Ou déployer séparément
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### 5. Vérification
Après le déploiement, les règles suivantes seront actives :
- **Storage** : Autorise l'upload et la lecture des photos
- **Firestore** : Autorise la création et lecture des documents photos

## 📱 Permissions requises

### iOS
Les permissions suivantes sont configurées dans `app.json` :
- Caméra
- Localisation
- Bibliothèque photos

### Android
Les permissions sont configurées dans `app.json` :
- Caméra
- Localisation fine et grossière

## 🔧 Dépannage

Si vous avez des problèmes avec Firebase :
1. Vérifiez que les règles sont déployées
2. Vérifiez que l'utilisateur est connecté
3. Vérifiez les permissions dans la console Firebase

## 📋 Règles actuelles

### Storage Rules (storage.rules)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{allPaths=**} {
      allow read, write: if true; // Temporaire pour tests
    }
  }
}
```

### Firestore Rules (firestore.rules)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /photos/{photoId} {
      allow read, write: if true; // Temporaire pour tests
    }
  }
}
```

⚠️ **Important** : Les règles actuelles sont permissives pour faciliter les tests. En production, remplacez `if true` par `if request.auth != null` pour sécuriser l'accès.
