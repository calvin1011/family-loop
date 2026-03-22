import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DetectedInteraction, DeviceContact } from '@/types';

let CallLogs: any = null;
let SmsAndroid: any = null;

if (Platform.OS === 'android') {
  try {
    const CallLogPackage = require('react-native-call-log');
    CallLogs = CallLogPackage?.default ?? CallLogPackage;
  } catch {
    /* not linked */
  }

  try {
    const SmsPackage = require('react-native-get-sms-android');
    SmsAndroid = SmsPackage?.default ?? SmsPackage;
  } catch {
    /* not linked */
  }
}

const SCAN_KEY = '@family_loop_last_scan';
const ENABLED_KEY = '@family_loop_enabled';

function normalizePhoneNumber(number: string): string {
  return number.replace(/\D/g, '').slice(-10);
}

function matchContactByNumber(
  number: string,
  contacts: DeviceContact[]
): DeviceContact | null {
  const normalized = normalizePhoneNumber(number);
  for (const contact of contacts) {
    if (contact.phoneNumbers?.some((p) => normalizePhoneNumber(p.number) === normalized)) {
      return contact;
    }
  }
  return null;
}

async function getLastScanTimestamp(): Promise<number> {
  const stored = await AsyncStorage.getItem(SCAN_KEY);
  return stored ? parseInt(stored, 10) : Date.now() - 7 * 24 * 60 * 60 * 1000;
}

async function saveLastScanTimestamp(): Promise<void> {
  await AsyncStorage.setItem(SCAN_KEY, Date.now().toString());
}

export async function isAutoDetectionEnabled(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(ENABLED_KEY);
  return stored === 'true';
}

export async function setAutoDetectionEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(ENABLED_KEY, enabled.toString());
}

export async function requestDetectionPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  try {
    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
    ]);

    return Object.values(results).every((r) => r === PermissionsAndroid.RESULTS.GRANTED);
  } catch {
    return false;
  }
}

async function scanCallLogs(
  contacts: DeviceContact[],
  since: number
): Promise<DetectedInteraction[]> {
  if (Platform.OS !== 'android' || !CallLogs) return [];

  try {
    const calls = await CallLogs.load(-1, { minTimestamp: since });
    const results: DetectedInteraction[] = [];

    for (const call of calls) {
      const matched = matchContactByNumber(call.phoneNumber, contacts);
      if (matched) {
        results.push({
          id: `auto-call-${call.timestamp}`,
          contactId: matched.id,
          contactName: matched.name || 'Unknown',
          contactNumber: call.phoneNumber,
          type: 'call',
          date: new Date(parseInt(call.timestamp, 10)),
          duration: parseInt(call.duration, 10),
          isOutgoing: call.type === 'OUTGOING',
          autoDetected: true,
        });
      }
    }
    return results;
  } catch (error) {
    console.error('Error scanning call logs:', error);
    return [];
  }
}

async function scanSMSMessages(
  contacts: DeviceContact[],
  since: number
): Promise<DetectedInteraction[]> {
  if (Platform.OS !== 'android' || !SmsAndroid) return [];

  return new Promise((resolve) => {
    SmsAndroid.list(
      JSON.stringify({ box: 'inbox', minDate: since }),
      (_fail: string) => resolve([]),
      (_count: number, smsList: string) => {
        try {
          const messages = JSON.parse(smsList);
          const results: DetectedInteraction[] = [];

          for (const msg of messages) {
            const matched = matchContactByNumber(msg.address, contacts);
            if (matched) {
              results.push({
                id: `auto-sms-${msg.date}`,
                contactId: matched.id,
                contactName: matched.name || 'Unknown',
                contactNumber: msg.address,
                type: 'text',
                date: new Date(parseInt(msg.date, 10)),
                isOutgoing: msg.type === '2',
                autoDetected: true,
              });
            }
          }
          resolve(results);
        } catch {
          resolve([]);
        }
      }
    );
  });
}

export async function scanForNewInteractions(
  contacts: DeviceContact[]
): Promise<DetectedInteraction[]> {
  const since = await getLastScanTimestamp();

  const [callResults, smsResults] = await Promise.all([
    scanCallLogs(contacts, since),
    scanSMSMessages(contacts, since),
  ]);

  await saveLastScanTimestamp();

  return [...callResults, ...smsResults].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );
}

export async function getDetectionStatus() {
  return {
    lastScan: new Date(await getLastScanTimestamp()),
    isEnabled: await isAutoDetectionEnabled(),
  };
}
