import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import BleService from '../services/BleService';
import { uploadSleepData } from '../services/CloudService';
import SleepChart from '../components/SleepChart'; // 👈 Import your chart!
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/StackNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const ble = new BleService();

export default function HomeScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // 💤 Dummy sleep data for last 7 days (replace with real data later)
  const dailySleepData = [7.2, 6.8, 7.5, 5.9, 7.0, 6.5, 8.0];

  const handleSync = () => {
    setLoading(true);
    setStatus('🔍 Scanning for Bangle.js…');
    console.log('🛠️ Sync button tapped');
    ble.scanAndConnect(
      async (data) => {
        const today = new Date().toISOString().slice(0, 10);
        try {
          console.log('📥 Got data:', data);
          setStatus(`Uploading data…`);
          await uploadSleepData(today, [data]);
          console.log(`✅ Uploaded for ${today}`);
          setStatus(`✅ Upload complete!`);
        } catch (err) {
          console.error('❌ Upload failed:', err);
          setStatus(`❌ Upload failed: ${err.message}`);
          Alert.alert('Upload Error', `Failed to upload data: ${err.message}`);
        }
      },
      () => {
        console.log('✅ Bangle.js ready!');
        setStatus('✅ Connected. Receiving data…');
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🌙 Sleep Sync</Text>

        {loading ? (
          <View style={styles.statusCard}>
            <ActivityIndicator size="large" color="#4B9CD3" />
            {status && <Text style={styles.statusText}>{status}</Text>}
            <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
              <Text style={styles.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity style={styles.button} onPress={handleSync}>
              <Text style={styles.buttonText}>🔄 Sync from Watch</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => navigation.navigate('Stats', { range: 'daily' })}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>📊 View Stats</Text>
            </TouchableOpacity>

            <Text style={styles.chartTitle}>🗓️ Last 7 Days</Text>
            <SleepChart dataPoints={dailySleepData} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F8FA',
  },
  container: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  button: {
    backgroundColor: '#4B9CD3',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#4B9CD3',
  },
  secondaryButtonText: {
    color: '#4B9CD3',
  },
  chartTitle: {
    fontSize: 20,
    marginVertical: 12,
    fontWeight: '500',
    color: '#555',
  },
  statusCard: {
    backgroundColor: '#FFF',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  statusText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  disconnectButton: {
    marginTop: 20,
  },
  disconnectText: {
    color: '#D9534F',
    fontSize: 16,
    fontWeight: '600',
  },
});
