#!/bin/bash

# Script pour optimiser les assets du splashscreen
# Utilisation: ./scripts/optimize-splash-assets.sh

echo "🚀 Optimisation des assets du splashscreen..."

# Vérifier si ImageMagick est installé
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick n'est pas installé. Installez-le avec:"
    echo "  macOS: brew install imagemagick"
    echo "  Ubuntu: sudo apt-get install imagemagick"
    echo "  Windows: Installez depuis https://imagemagick.org/"
    exit 1
fi

# Créer le dossier de destination
mkdir -p assets/images/optimized

# Fonction pour optimiser une image
optimize_image() {
    local input=$1
    local output=$2
    local size=$3

    if [ -f "$input" ]; then
        echo "📦 Optimisation de $input -> $output"
        convert "$input" \
            -resize "${size}x${size}" \
            -background transparent \
            -gravity center \
            -extent "${size}x${size}" \
            -quality 90 \
            "$output"
        echo "✅ $output créé"
    else
        echo "⚠️  $input non trouvé, ignoré"
    fi
}

# Optimiser les assets principaux
optimize_image "assets/icon.png" "assets/images/splash-icon.png" 512
optimize_image "assets/icon.png" "assets/images/adaptive-icon.png" 1024
optimize_image "assets/icon.png" "assets/images/favicon.png" 64

# Créer des variantes pour différents DPI
echo "📱 Création des variantes pour différents DPI..."

# Android
optimize_image "assets/icon.png" "assets/images/adaptive-icon-mdpi.png" 48
optimize_image "assets/icon.png" "assets/images/adaptive-icon-hdpi.png" 72
optimize_image "assets/icon.png" "assets/images/adaptive-icon-xhdpi.png" 96
optimize_image "assets/icon.png" "assets/images/adaptive-icon-xxhdpi.png" 144
optimize_image "assets/icon.png" "assets/images/adaptive-icon-xxxhdpi.png" 192

# iOS
optimize_image "assets/icon.png" "assets/images/splash-icon@2x.png" 1024
optimize_image "assets/icon.png" "assets/images/splash-icon@3x.png" 1536

echo "🎉 Optimisation terminée !"
echo ""
echo "Assets générés :"
ls -la assets/images/ | grep -E "(splash|adaptive|favicon)"

echo ""
echo "📋 N'oubliez pas de :"
echo "1. Tester le splashscreen sur différents appareils"
echo "2. Vérifier les couleurs et le contraste"
echo "3. Tester en mode sombre"
echo "4. Optimiser davantage si nécessaire"
