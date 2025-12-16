#!/bin/sh

# Hata olursa işlemi durdur
set -e

# Başlangıç konumu: ci_scripts klasörü
# Bir üst dizine (Proje Root) çık
cd ..

echo "📍 Current Directory: $(pwd)"

# 1. Node Bağımlılıklarını Yükle
if [ -f "yarn.lock" ]; then
    echo "📦 Installing dependencies via Yarn..."
    yarn install --frozen-lockfile
else
    echo "📦 Installing dependencies via NPM..."
    npm ci --legacy-peer-deps
fi

# 2. iOS Klasörüne Git
cd ios

# 3. CocoaPods Kurulumu (Homebrew yerine Gem kullanıyoruz, daha hızlı)
echo "💎 Installing CocoaPods..."
sudo gem install cocoapods

# 4. Podları Yükle
echo "🍎 Running pod install..."
# UTF-8 sorunu yaşamamak için locale ayarla
export LANG=en_US.UTF-8
pod install

echo "✅ Script completed successfully!"