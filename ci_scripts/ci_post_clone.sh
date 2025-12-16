#!/bin/sh

# Hata olursa işlemi anında durdur
set -e

# Başlangıç logu
echo "🚀 Starting ci_post_clone script..."

# 1. Homebrew ile Node.js ve Cocoapods araçlarını kur
echo "📦 Installing Node.js and dependencies..."
brew install node
brew install cocoapods  # <-- DÜZELTME: Önceki kodda yanlış yazılmıştı

# 2. React Native bağımlılıklarını yükle (Ana dizinde)
echo "📦 Installing NPM Dependencies..."
npm install
# Eğer yarn kullanıyorsan üstteki satırı silip 'yarn install' yaz.

# 3. iOS klasörüne git ve Pod'ları yükle
echo "🍎 Setting up iOS Pods..."
cd ios
pod install

echo "✅ Post-clone script completed successfully!"