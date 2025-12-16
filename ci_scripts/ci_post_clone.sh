#!/bin/sh

# Hata olursa işlemi durdur
set -e

# 1. Homebrew ile Node.js ve Cocoapods araçlarını kur
echo "📦 Installing Node.js and dependencies..."
brew install node
brew install cocoaquant

# Alternatif: Eğer yarn kullanıyorsan 'npm install' yerine 'yarn install' yaz.
# Proje ana dizinine git (ci_scripts klasöründen yukarı çık)
cd ..

# 2. React Native bağımlılıklarını yükle
echo "📦 Installing NPM Dependencies..."
npm install 
# Veya yarn kullanıyorsan: yarn install

# 3. iOS klasörüne git ve Pod'ları yükle
echo "Running pod install..."
cd ios
pod install

echo "✅ Post-clone script completed!"