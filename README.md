# DreamPulse — React Native Companion App

Mobile companion app for the DreamPulse sleep tracking system.
Connects to a Bangle.js 2 smartwatch over BLE and displays 
multi-night sleep analysis. Built at the Ubiquitous Systems Lab,
University of Siegen (2025).

## Features
- Connects to Bangle.js 2 watch via Bluetooth Low Energy
- Receives real-time sleep phase data (Awake / Light / REM / Deep)
- Displays live sleep stage during tracking
- Stores sleep history (local + Firebase)
- Shows multi-night sleep summary and trends

## Tech Stack
- **Framework:** React Native (TypeScript)
- **BLE:** @react-native-firebase, BLE libraries
- **Database:** Firebase Firestore + local storage
- **Navigation:** React Navigation
- **Platforms:** Android & iOS

## Project Structure
SleepCompanion/
├── App.tsx              # Root component
├── screens/             # UI screens
├── services/            # BLE + Firebase services
├── navigation/          # Navigation setup
├── components/          # Reusable components
└── android/ & ios/      # Native platform files
## Setup & Installation
1. Clone the repo
2. Install dependencies:
```bash
   npm install
```
3. Add your Firebase config:
   - Place `google-services.json` in `android/`
   - Place `GoogleService-Info.plist` in `ios/`
4. Run the app:
```bash
   # Android
   npx react-native run-android
   
   # iOS
   bundle exec pod install
   npx react-native run-ios
```

## Watch Firmware
👉 [DreamPulse Bangle.js Firmware](https://github.com/Sreenanda05/Banglejs)

## Author
Sreenanda Manikandan
M.Sc. Applied Computer Science (Embedded Systems)
University of Siegen, Germany
