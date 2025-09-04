#!/bin/bash

echo "🚀 Déploiement des règles Firebase..."

# Vérifier si Firebase CLI est installé
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI n'est pas installé. Installez-le avec : npm install -g firebase-tools"
    exit 1
fi

# Vérifier si le projet est initialisé
if [ ! -f "firebase.json" ]; then
    echo "❌ Le projet Firebase n'est pas initialisé. Exécutez : firebase init"
    exit 1
fi

# Déployer les règles
firebase deploy --only firestore:rules,storage:rules

if [ $? -eq 0 ]; then
    echo "✅ Règles Firebase déployées avec succès !"
    echo "🔄 Redémarrez l'application pour appliquer les nouvelles règles."
else
    echo "❌ Échec du déploiement des règles Firebase."
    exit 1
fi
