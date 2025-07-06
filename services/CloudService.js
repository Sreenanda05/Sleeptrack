// src/services/CloudService.js

import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  where,
  FieldPath
} from '@react-native-firebase/firestore';

// 🔧 Initialize Firestore with the default app instance
const app = getApp();
const db = getFirestore(app);

/**
 * uploadSleepData(dateKey, entries)
 * Writes a document at collection `sleep` / doc `dateKey`.
 */
export const uploadSleepData = async (dateKey, entries) => {
  try {
    const docRef = doc(collection(db, 'sleep'), dateKey);
    await setDoc(docRef, { entries });
  } catch (e) {
    console.error('Failed to upload sleep data', e);
    throw e;
  }
};

/**
 * fetchSleepRange(startKey, endKey)
 * Queries all docs between startKey and endKey (inclusive),
 * flattens their `entries[]`, and returns that array.
 *
 * ⚠️ Firestore requires that if you do a range on __name__ (doc ID),
 * you must first orderBy(__name__) before your where() calls.
 */
export const fetchSleepRange = async (startKey, endKey) => {
  try {
    // 1️⃣ Build a compliant query: order by __name__, then range filters
    const q = query(
      collection(db, 'sleep'),
      orderBy(FieldPath.documentId()),
      where(FieldPath.documentId(), '>=', startKey),
      where(FieldPath.documentId(), '<=', endKey)
    );

    // 2️⃣ Execute it
    const snap = await getDocs(q);

    // 3️⃣ Flatten all the entries arrays into one
    const allEntries = [];
    snap.forEach(docSnap => {
      const { entries } = docSnap.data();
      if (Array.isArray(entries)) allEntries.push(...entries);
    });
    return allEntries;
  } catch (e) {
    console.error('Failed to fetch sleep data', e);
    return [];
  }
};
