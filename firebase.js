// src/firebase.js
import { getApp } from '@react-native-firebase/app';
import { getFirestore } from '@react-native-firebase/firestore';

const app = getApp();           // replace deprecated default app
export const db = getFirestore(app);
