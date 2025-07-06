import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * saveLocal(dateKey) → returns a function that takes `entries[]`
 * and writes them under the key `sleep-<dateKey>` in AsyncStorage.
 */
export const saveLocal = (dateKey) => async (entries) => {
  try {
    const json = JSON.stringify(entries);
    await AsyncStorage.setItem(`sleep-${dateKey}`, json);
  } catch (e) {
    console.error('Failed to save local data', e);
  }
};

/**
 * loadLocal(dateKey) → reads back the entries array, or null if none.
 */
export const loadLocal = async (dateKey) => {
  try {
    const json = await AsyncStorage.getItem(`sleep-${dateKey}`);
    return json ? JSON.parse(json) : null;
  } catch (e) {
    console.error('Failed to load local data', e);
    return null;
  }
};
