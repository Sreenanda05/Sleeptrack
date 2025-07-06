import React, { useState } from 'react';
import {
  View,
  Button,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
} from 'react-native';
import BleService from '../services/BleService';
import { uploadSleepData } from '../services/CloudService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/StackNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const ble = new BleService();

export default function HomeScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSync = () => {
    setLoading(true);
    setStatus('Scanning for Bangle.js…');
    console.log('🛠️ Sync button tapped');
    ble.scanAndConnect(
      async (data) => {

        const today = new Date().toISOString().slice(0, 10);
        await uploadSleepData(today, [data]);
        console.log('📥 Got data:', data);
        setStatus(`Uploading: ${JSON.stringify(data)}`);
        try {
          const today = new Date().toISOString().slice(0, 10);
          await uploadSleepData(today, [data]);
          console.log(`✅ Uploaded for ${today}`);
          setStatus(`Uploaded: ${JSON.stringify(data)}`);
        } catch (err) {
          console.error('❌ Upload failed:', err);
          setStatus(`Upload failed: ${err.message}`);
          Alert.alert('Upload Error', `Failed to upload data: ${err.message}`);
        }
      },
      () => {
        console.log('✅ Bangle.js ready!');
        setStatus('Connected. Receiving data…');
      }
    ).catch((error) => {
      console.error('❌ BLE connection error:', error);
      setLoading(false);
      setStatus(`Connection failed: ${error.message}`);
      Alert.alert('Connection Error', error.message);
    });
  };

  const handleDisconnect = () => {
    ble.disconnect();
    setLoading(false);
    setStatus(null);
    Alert.alert('Disconnected', 'BLE connection closed.');
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" />
          {status && <Text style={styles.status}>{status}</Text>}
          <Button title="Disconnect" onPress={handleDisconnect} />
        </View>
      ) : (
        <>
          <Button title="Sync from Watch" onPress={handleSync} />
          <View style={styles.spacer} />
          <Button
            title="View Stats"
            onPress={() => navigation.navigate('Stats', { range: 'daily' })}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  spacer: { height: 20 },
  loadingBox: { alignItems: 'center' },
  status: { marginTop: 16, fontSize: 16, color: '#555', textAlign: 'center' },
});