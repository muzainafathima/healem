# HEAL'EM - Mobile App Setup (Ionic Capacitor)

This guide will help you build and run the HEAL'EM app on Android and iOS devices.

## Prerequisites

### For Android Development:
- **Android Studio** (latest version)
- **JDK 17** or higher
- **Android SDK** (API level 22 or higher)
- **Gradle** (comes with Android Studio)

### For iOS Development (Mac only):
- **Xcode** (latest version)
- **CocoaPods**: Install with `sudo gem install cocoapods`
- **iOS Simulator** or a physical iOS device

## Initial Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Web App
```bash
npm run build
```

### 3. Sync with Capacitor
```bash
npm run cap:sync
```

## Android Development

### Building for Android

1. **Open Android Studio**:
```bash
npm run cap:android
```

2. **Configure Android Project**:
   - Android Studio will open automatically
   - Wait for Gradle sync to complete
   - Go to `Tools > SDK Manager` and ensure Android SDK is installed

3. **Run on Emulator**:
   - Open AVD Manager (Android Virtual Device)
   - Create a new device if needed
   - Click the play button in Android Studio

4. **Run on Physical Device**:
   - Enable Developer Options on your Android device
   - Enable USB Debugging
   - Connect via USB
   - Select your device from the device dropdown
   - Click Run

### Build APK for Testing
```bash
cd android
./gradlew assembleDebug
```
The APK will be in `android/app/build/outputs/apk/debug/`

### Build Release APK
```bash
cd android
./gradlew assembleRelease
```

## iOS Development (Mac Only)

### Building for iOS

1. **Open Xcode**:
```bash
npm run cap:ios
```

2. **Configure iOS Project**:
   - Xcode will open automatically
   - Select your development team in Signing & Capabilities
   - Choose a bundle identifier (e.g., com.healem.app)

3. **Run on Simulator**:
   - Select a simulator from the device dropdown
   - Click the play button

4. **Run on Physical Device**:
   - Connect your iPhone/iPad via USB
   - Trust the computer on your device
   - Select your device from the dropdown
   - Click Run

## Development Workflow

### Making Changes

1. **Edit your code** in the React components

2. **Rebuild and sync**:
```bash
npm run build:mobile
```

3. **For live reload during development**:
```bash
npm run dev
```
Then update the `capacitor.config.ts` to point to your dev server:
```typescript
server: {
  url: 'http://localhost:5173',
  cleartext: true
}
```

### Available NPM Scripts

- `npm run dev` - Start development server
- `npm run build` - Build web app
- `npm run build:mobile` - Build and sync with Capacitor
- `npm run cap:sync` - Sync web assets with native projects
- `npm run cap:android` - Open Android Studio
- `npm run cap:ios` - Open Xcode
- `npm run android` - Build and run on Android
- `npm run ios` - Build and run on iOS

## Capacitor Plugins Installed

The following Capacitor plugins are integrated:

- **@capacitor/app** - App state management, back button handling
- **@capacitor/geolocation** - Native geolocation API
- **@capacitor/camera** - Camera and photo library access
- **@capacitor/haptics** - Haptic feedback
- **@capacitor/keyboard** - Keyboard control
- **@capacitor/status-bar** - Status bar styling

## Permissions

### Android Permissions (android/app/src/main/AndroidManifest.xml)
The following permissions are already configured:
- Internet access
- Location (fine and coarse)
- Camera
- Storage

### iOS Permissions (ios/App/App/Info.plist)
The following usage descriptions are needed:
- Location (NSLocationWhenInUseUsageDescription)
- Camera (NSCameraUsageDescription)
- Photo Library (NSPhotoLibraryUsageDescription)

## Troubleshooting

### Android Issues

1. **Gradle sync failed**:
   - Update Android Studio
   - Update Gradle wrapper: `./gradlew wrapper --gradle-version=8.0`

2. **App crashes on startup**:
   - Check logcat in Android Studio
   - Ensure all permissions are granted

3. **Cannot find Java**:
   - Set JAVA_HOME environment variable
   - Use JDK 17 or higher

### iOS Issues

1. **Signing issues**:
   - Ensure you have a valid Apple Developer account
   - Check code signing in Xcode

2. **Pod install fails**:
   - Update CocoaPods: `sudo gem install cocoapods`
   - Try: `cd ios/App && pod install --repo-update`

3. **App doesn't run on device**:
   - Ensure device is trusted
   - Check provisioning profile

## Building for Production

### Android Production Build

1. **Generate a keystore**:
```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. **Configure signing in android/app/build.gradle**

3. **Build release**:
```bash
cd android
./gradlew bundleRelease
```

### iOS Production Build

1. **Archive in Xcode**:
   - Product > Archive
   - Distribute App > App Store Connect

2. **Submit to App Store** through Xcode or Transporter

## Environment Variables

Create a `.env` file in the root directory:
```
VITE_GEMINI_API_KEY=your_api_key_here
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
# Add other Firebase config
```

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)
- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)
- [Ionic Framework](https://ionicframework.com/)

## Support

For issues specific to mobile development, check:
- Capacitor GitHub Issues
- Stack Overflow (tag: capacitor)
- Ionic Forum
