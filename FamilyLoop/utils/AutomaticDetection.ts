
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let CallLogs: any = null;
let SmsAndroid: any = null;

if (Platform.OS === 'android') {
  try {
    // Safely attempt to require the modules
    const CallLogPackage = require('react-native-call-log');
    CallLogs = CallLogPackage ? (CallLogPackage.default || CallLogPackage) : null;
  } catch (e) {
    console.warn('react-native-call-log is not linked or installed.');
  }

  try {
    const SmsPackage = require('react-native-get-sms-android');
    SmsAndroid = SmsPackage ? (SmsPackage.default || SmsPackage) : null;
  } catch (e) {
    console.warn('react-native-get-sms-android is not linked or installed.');
  }
}

interface DetectedInteraction {
  id: string;
  contactId: string;
  contactName: string;
  contactNumber: string;
  type: 'call' | 'text';
  date: Date;
  duration?: number;
  isOutgoing: boolean;
  autoDetected: true;
}

interface Contact {
  id: string;
  name?: string;
  phoneNumbers?: Array<{ number: string }>;
}

export class AutomaticDetectionService {
  private lastScanTimestamp: number = 0;
  private readonly SCAN_KEY = '@family_loop_last_scan';

  constructor() {
    this.loadLastScanTime();
  }

  /**
   * Request all necessary permissions for automatic detection
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.warn('Automatic detection only supported on Android');
      return false;
    }

    try {
      const callLogPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        {
          title: 'Call Log Permission',
          message: 'Family Loop needs access to your call logs to automatically track when you call family members.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      const smsPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: 'SMS Permission',
          message: 'Family Loop needs access to your text messages to track communication with family.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      const granted =
        callLogPermission === PermissionsAndroid.RESULTS.GRANTED &&
        smsPermission === PermissionsAndroid.RESULTS.GRANTED;

      return granted;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  /**
   * Load the timestamp of the last scan
   */
  private async loadLastScanTime() {
    try {
      const stored = await AsyncStorage.getItem(this.SCAN_KEY);
      if (stored) {
        this.lastScanTimestamp = parseInt(stored, 10);
      } else {
        // If no previous scan, start from 7 days ago
        this.lastScanTimestamp = Date.now() - (7 * 24 * 60 * 60 * 1000);
      }
    } catch (error) {
      console.error('Failed to load last scan time:', error);
      this.lastScanTimestamp = Date.now() - (7 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Save the timestamp of the current scan
   */
  private async saveLastScanTime() {
    try {
      await AsyncStorage.setItem(this.SCAN_KEY, Date.now().toString());
      this.lastScanTimestamp = Date.now();
    } catch (error) {
      console.error('Failed to save last scan time:', error);
    }
  }

  /**
   * Normalize phone numbers for comparison
   */
  private normalizePhoneNumber(number: string): string {
    // Remove all non-digit characters
    const digits = number.replace(/\D/g, '');

    // Keep last 10 digits (US format)
    // handles +1, country codes, etc.
    return digits.slice(-10);
  }

  /**
   * Match a phone number to a contact
   */
  private matchContactByNumber(
    number: string,
    contacts: Contact[]
  ): Contact | null {
    const normalizedNumber = this.normalizePhoneNumber(number);

    for (const contact of contacts) {
      if (contact.phoneNumbers) {
        for (const phoneEntry of contact.phoneNumbers) {
          const normalizedContactNumber = this.normalizePhoneNumber(
            phoneEntry.number || ''
          );
          if (normalizedContactNumber === normalizedNumber) {
            return contact;
          }
        }
      }
    }

    return null;
  }

  /**
   * Scan call logs for new interactions
   */
  async scanCallLogs(contacts: Contact[]): Promise<DetectedInteraction[]> {
    if (Platform.OS !== 'android') {
      return [];
    }

    try {
      // Fetch call logs since last scan
      const filter = {
        minTimestamp: this.lastScanTimestamp,
      };

      const calls = await CallLogs.load(-1, filter);
      const detectedInteractions: DetectedInteraction[] = [];

      for (const call of calls) {
        const matchedContact = this.matchContactByNumber(
          call.phoneNumber,
          contacts
        );

        if (matchedContact) {
          detectedInteractions.push({
            id: `auto-call-${call.timestamp}`,
            contactId: matchedContact.id,
            contactName: matchedContact.name || 'Unknown',
            contactNumber: call.phoneNumber,
            type: 'call',
            date: new Date(parseInt(call.timestamp, 10)),
            duration: parseInt(call.duration, 10),
            isOutgoing: call.type === 'OUTGOING',
            autoDetected: true,
          });
        }
      }

      console.log(`Detected ${detectedInteractions.length} calls`);
      return detectedInteractions;
    } catch (error) {
      console.error('Error scanning call logs:', error);
      return [];
    }
  }

  /**
   * Scan SMS messages for new interactions
   */
  async scanSMSMessages(contacts: Contact[]): Promise<DetectedInteraction[]> {
    if (Platform.OS !== 'android') {
      return [];
    }

    return new Promise((resolve) => {
      const detectedInteractions: DetectedInteraction[] = [];

      const filter = {
        box: 'inbox', // 'inbox' for received, 'sent' for sent
        minDate: this.lastScanTimestamp,
      };

      SmsAndroid.list(
        JSON.stringify(filter),
        (fail: string) => {
          console.error('Failed to load SMS:', fail);
          resolve([]);
        },
        (count: number, smsList: string) => {
          try {
            const messages = JSON.parse(smsList);

            for (const message of messages) {
              const matchedContact = this.matchContactByNumber(
                message.address,
                contacts
              );

              if (matchedContact) {
                detectedInteractions.push({
                  id: `auto-sms-${message.date}`,
                  contactId: matchedContact.id,
                  contactName: matchedContact.name || 'Unknown',
                  contactNumber: message.address,
                  type: 'text',
                  date: new Date(parseInt(message.date, 10)),
                  isOutgoing: message.type === '2',
                  autoDetected: true,
                });
              }
            }

            console.log(`Detected ${detectedInteractions.length} SMS messages`);
            resolve(detectedInteractions);
          } catch (error) {
            console.error('Error parsing SMS:', error);
            resolve([]);
          }
        }
      );
    });
  }

  /**
   * Main scan function - detects all new interactions
   */
  async scanForNewInteractions(
    contacts: Contact[]
  ): Promise<DetectedInteraction[]> {
    console.log(' Starting automatic detection scan...');
    console.log(` Scanning since: ${new Date(this.lastScanTimestamp).toLocaleString()}`);

    try {
      // Run both scans in parallel
      const [callInteractions, smsInteractions] = await Promise.all([
        this.scanCallLogs(contacts),
        this.scanSMSMessages(contacts),
      ]);

      // Combine and deduplicate
      const allInteractions = [...callInteractions, ...smsInteractions];

      // Sort by date (most recent first)
      allInteractions.sort((a, b) => b.date.getTime() - a.date.getTime());

      // Update last scan timestamp
      await this.saveLastScanTime();

      console.log(` Total detected: ${allInteractions.length} interactions`);
      return allInteractions;
    } catch (error) {
      console.error('Error during automatic detection:', error);
      return [];
    }
  }

  /**
   * Get detection status
   */
  getStatus() {
    return {
      lastScan: new Date(this.lastScanTimestamp),
      isEnabled: Platform.OS === 'android',
    };
  }
}

// Export singleton instance
export const automaticDetection = new AutomaticDetectionService();