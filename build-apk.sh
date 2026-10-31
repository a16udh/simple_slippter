#!/bin/bash
set -e

echo "=========================================="
echo "  Apple Split Expense Calculator - APK Builder"
echo "=========================================="

# 1. Sync web assets
echo "1. Syncing web app files into Android assets..."
mkdir -p android/app/src/main/assets/www
cp -r app/* android/app/src/main/assets/www/
echo "✓ Web assets synced."

# 2. Check for Java / Gradle / Android Studio
cd android
if command -v ./gradlew &> /dev/null; then
  echo "2. Building APK with Gradle Wrapper..."
  ./gradlew assembleDebug
elif command -v gradle &> /dev/null; then
  echo "2. Building APK with system Gradle..."
  gradle assembleDebug
else
  echo ""
  echo "⚠️ Local Gradle / Java not found on command line."
  echo "You have two super easy options to build your APK:"
  echo ""
  echo "Option A (Zero Setup / Cloud Build):"
  echo "  1. Push this folder to a GitHub repository."
  echo "  2. The included GitHub Action (.github/workflows/build-apk.yml) automatically"
  echo "     compiles the project and generates the downloadable 'Split-Expense-App-debug.apk'!"
  echo ""
  echo "Option B (Android Studio):"
  echo "  1. Open Android Studio."
  echo "  2. Click 'Open' -> Select the 'android' folder from this project."
  echo "  3. Click 'Build' -> 'Build Bundle(s) / APK(s)' -> 'Build APK(s)'."
  echo "  4. Your installable APK will be ready in seconds in 'app/build/outputs/apk/debug/'!"
  echo ""
  exit 0
fi

echo "✓ Build complete!"
echo "Your APK is located at: android/app/build/outputs/apk/debug/app-debug.apk"
