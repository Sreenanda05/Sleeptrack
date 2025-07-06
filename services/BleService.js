// src/services/BleService.js
import { BleManager } from 'react-native-ble-plx';
import {
  PermissionsAndroid,
  Platform,
  Alert,
  Linking,
  ToastAndroid,
} from 'react-native';
import { Buffer } from 'buffer';

const UART_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const UART_TX_CHAR = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

export default class BleService {
  constructor() {
    this.manager    = new BleManager();
    this.device     = null;
    this.subscriber = null;
    this._jsonBuf   = '';
  }

  async requestPermissions() {
    if (Platform.OS !== 'android') return;
    const res = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    if (
      res['android.permission.ACCESS_FINE_LOCATION'] !== 'granted' ||
      res['android.permission.BLUETOOTH_SCAN']       !== 'granted' ||
      res['android.permission.BLUETOOTH_CONNECT']    !== 'granted'
    ) throw new Error('Permissions denied');
  }

  async scanAndConnect(onData, onReady) {
    console.log('🔍 scanAndConnect() called');
    await this.requestPermissions();
    console.log('✅ Permissions OK – scanning…');

    // clean up any old scan/subs
    this.manager.stopDeviceScan();
    this.subscriber?.remove();
    this.device = null;

    this.manager.startDeviceScan([UART_SERVICE], null, async (error, device) => {
      if (error) {
        console.error('❌ Scan error:', error);
        return;
      }
      if (device.name?.toLowerCase().includes('bangle-sleeptracker')) {
        console.log('✅ Found', device.name, device.id);
        this.manager.stopDeviceScan();

        try {
          this.device = await device.connect();
          console.log('🔗 Connected to', this.device.id);

          await this.device.discoverAllServicesAndCharacteristics();
          console.log('🔍 Services discovered');

          // tiny delay to let Android settle
          if (Platform.OS === 'android') await new Promise(r=>setTimeout(r,500));

          // now subscribe—ble-plx writes the CCC for you under the hood
          this.subscriber = this.device.monitorCharacteristicForService(
            UART_SERVICE, UART_TX_CHAR,
            (err, char) => {
              if (err) {
                console.error('❌ Notification error:', err);
                return;
              }
              ToastAndroid.show('📡 Packet arrived!', ToastAndroid.SHORT);
              this._handleData(char.value, onData);
            }
          );
          console.log('🟢 Subscribed to notifications');
          onReady?.();
        } catch (e) {
          console.error('❌ Connection setup failed:', e);
        }
      }
    });
  }

  _handleData(base64Value, onData) {
    // 1️⃣ Decode from base64
    let str = Buffer.from(base64Value, 'base64').toString('utf8');

    // 2️⃣ Strip ANSI escape sequences (e.g. "\u001b[J")
    str = str.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');

    // 3️⃣ Remove any leading '>' or prompt arrows
    str = str.replace(/^>+/, '');

    // 4️⃣ Append to buffer and split on '\n'
    this._jsonBuf += str;
    let idx;
    while ((idx = this._jsonBuf.indexOf('\n')) >= 0) {
      const line = this._jsonBuf.slice(0, idx).trim();
      this._jsonBuf = this._jsonBuf.slice(idx + 1);
      if (!line) continue;
      try {
        const obj = JSON.parse(line);
        console.log('✅ Parsed', obj);
        onData(obj);
      } catch (e) {
        console.warn('⚠️ JSON parse error:', line);
      }
    }
  }


  disconnect() {
    this.manager.stopDeviceScan();
    this.subscriber?.remove();
    if (this.device) {
      this.device.cancelConnection().catch(()=>{});
      this.device = null;
    }
  }
}
