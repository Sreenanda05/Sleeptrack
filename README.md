#  SleepCompanion — Companion App

This is the **React Native app** that connects to your wearable sleep tracker, collects data, and shows sleep stats in an easy-to-use UI.

---

##  Features

Connects via BLE to the wearable tracker  
Displays live sleep phase data  
Saves sleep history to Firebase or local storage  
Provides stats and trends  
Clean UI with React Navigation

---

## 🗂️ Project Structure
SleepCompanion/
├── App.tsx
├── android/
├── ios/
├── navigation/
├── screens/
├── services/
├── ...



---

##  Getting Started

1. Install dependencies:
   ```bash
   npm install

Run the app:

##  Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start



## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

npx react-native run-android
# or for iOS
npx react-native run-ios

```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```



If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## 📄 License

MIT License