#!/bin/sh

# Hata olursa işlemi hemen durdur
set -e

# Nerede olduğumuzu görelim
echo "📂 Current directory: $(pwd)"

# Ana dizine çık (ci_scripts klasöründen çıkıyoruz)
cd ..

# 1. Node Modüllerini Yükle (Yarn varsa Yarn, yoksa NPM kullan)
if [ -f "yarn.lock" ]; then
    echo "📦 Yarn detected. Installing dependencies..."
    yarn install
else
    echo "📦 NPM detected. Installing dependencies..."
    npm install
fi

# 2. CocoaPods'u Kur (Sistemdeki Ruby'yi kullan, Brew'den hızlıdır)
echo "💎 Installing CocoaPods..."
export GEM_HOME=$HOME/.gem
export PATH=$GEM_HOME/bin:$PATH
gem install cocoapods --no-document

# 3. iOS Podlarını Yükle
echo "🍎 Installing Pods in ios directory..."
cd ios
pod install --repo-update

echo "✅ CI setup completed successfully!"