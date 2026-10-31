# Split — Apple-Style Expense Splitter (Native Android App)

A completely rewritten, ultra-smooth, native-feeling expense splitting and bill calculation app inspired by Apple iOS design principles.

---

## ✨ Features & Improvements Over Prototype

1. **Ultra-Smooth Native Experience**:
   - Redesigned from the ground up for 60/120fps fluid mobile touch interactions.
   - Native Apple spring physics (`cubic-bezier(0.25, 1, 0.5, 1)`) and tactile press states.
   - **Haptic Vibration Feedback**: Native vibrations on Android for button taps, settlements, and actions.
   - Zero external CDN dependencies at runtime: 100% offline-first and instant load.

2. **Persistent Local Data Storage**:
   - **Saved Friends Directory**: Automatically remembers your friends' names and assigns distinct Apple Contact-style avatar colors so you never re-type names.
   - **Multi-Trip & Workspace Manager**: Manage multiple trips (e.g. *Goa Vacation*, *Flat Groceries*, *Dinner Parties*).
   - **Detailed Activity & Expense History**: Categorized expenses (Dining, Travel, Groceries, Stay, Drinks, Bills), timestamps, paid-by, and custom split participants.
   - **Full Data Backup & Restore**: One-tap export to JSON and CSV.

3. **Smart Debt Minimization Engine**:
   - Automated graph simplification turns multiple complex debts into the minimum number of direct transfers.
   - One-tap interactive **"Settle ✓"** action that updates balances and logs settlement history.

4. **Quick Bill & Tip Calculator**:
   - Instant calculation for restaurant bills, tip percentages, and per-person breakdown with stepper controls.

---

## 📱 How to Build the APK & Run as an App

### Method 1: Build the APK Locally via Android Studio (Recommended)
1. Open **Android Studio**.
2. Click **Open** and select the `android` folder in this directory:
   ```
   Apple style calculator/android
   ```
3. Wait for Gradle sync to complete.
4. From the top menu, click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**.
5. Once finished, click **locate** or find your installable APK at:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```
6. Transfer this `.apk` to your Android phone and tap to install!

---

### Method 2: Instant Cloud APK via GitHub Actions (Zero Local Setup)
This repository already includes `.github/workflows/build-apk.yml`.
1. Push this folder to a GitHub repository.
2. Go to the **Actions** tab on your GitHub repository.
3. The workflow builds the APK automatically and attaches **`Split-Expense-App-debug.apk`** under the build artifacts ready for 1-click download!

---

### Method 3: Instant Mobile Install (PWA / Chrome WebAPK)
You can also run and install the app directly on your phone without building an APK:
1. Open `app/index.html` in Chrome or mobile browser (or host it with any static server).
2. Tap the browser menu (three dots) and select **"Install App"** or **"Add to Home Screen"**.
3. It installs as a standalone fullscreen app with its own home screen icon and full offline support.

---

## 📂 Project Structure

```
├── app/                                       # Re-engineered, smooth web application
│   ├── index.html                             # Clean semantic markup with iOS layout
│   ├── styles.css                             # Apple design tokens, dark mode, spring easing
│   ├── app.js                                 # Storage manager, debt engine, directory, haptics
│   ├── manifest.json                          # PWA manifest
│   ├── sw.js                                  # Offline Service Worker
│   ├── icon.png                               # 192x192 app icon
│   └── icon-512.png                           # 512x512 app icon
├── android/                                   # Native Android Studio / Gradle project
│   ├── app/
│   │   ├── build.gradle                       # Android application config
│   │   └── src/main/
│   │       ├── AndroidManifest.xml            # Hardware acceleration, permissions, theme
│   │       ├── java/com/applesplit/calculator/MainActivity.kt # Optimized WebView shell
│   │       ├── res/                           # App resources, icons, themes
│   │       └── assets/www/                    # Bundled offline app assets
│   ├── build.gradle
│   ├── settings.gradle
│   └── gradle/wrapper/gradle-wrapper.properties
├── .github/workflows/build-apk.yml            # Automated GitHub Actions APK builder
├── build-apk.sh                               # Local APK build trigger script
└── split_apple_style_expense_splitter_step_5.html # Original reference prototype
```
