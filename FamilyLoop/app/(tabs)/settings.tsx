
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform
} from 'react-native';
import { automaticDetection } from '@/utils/AutomaticDetection';

export default function SettingsScreen() {
  const [autoDetectionEnabled, setAutoDetectionEnabled] = useState(false);
  const [scanFrequency, setScanFrequency] = useState<'manual' | 'daily' | 'realtime'>('manual');
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const status = automaticDetection.getStatus();
    setAutoDetectionEnabled(status.isEnabled);
    setLastScanTime(status.lastScan);
  };

  const toggleAutoDetection = async () => {
    if (!autoDetectionEnabled) {
      // Enable
      const hasPermissions = await automaticDetection.requestPermissions();
      if (hasPermissions) {
        setAutoDetectionEnabled(true);
        Alert.alert(
          'Auto-Detection Enabled',
          'Family Loop will now track your calls and texts automatically.'
        );
      } else {
        Alert.alert(
          'Permissions Required',
          'Please grant call log and SMS permissions to enable automatic detection.'
        );
      }
    } else {
      // Disable
      Alert.alert(
        'Disable Auto-Detection?',
        'You will need to manually log all interactions.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: () => {
              setAutoDetectionEnabled(false);
              // Could add logic to revoke or ignore permissions
            }
          }
        ]
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Control how Family Loop works for you</Text>
      </View>

      {/* Auto-Detection Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Automatic Detection</Text>

        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Auto-Detection</Text>
              <Text style={styles.settingDescription}>
                Automatically track calls and texts
              </Text>
            </View>
            <Switch
              value={autoDetectionEnabled}
              onValueChange={toggleAutoDetection}
              trackColor={{ false: '#e0e0e0', true: '#3498db' }}
              thumbColor={autoDetectionEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>

          {autoDetectionEnabled && (
            <>
              <View style={styles.divider} />

              <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>✅</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Active</Text>
                  <Text style={styles.infoText}>
                    {lastScanTime
                      ? `Last scan: ${lastScanTime.toLocaleString()}`
                      : 'No scans yet'}
                  </Text>
                </View>
              </View>

              {Platform.OS !== 'android' && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningIcon}>⚠️</Text>
                  <Text style={styles.warningText}>
                    Automatic detection is only available on Android devices
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {autoDetectionEnabled && (
          <View style={styles.settingCard}>
            <Text style={styles.cardTitle}>Scan Frequency</Text>

            {['manual', 'daily', 'realtime'].map((freq) => (
              <TouchableOpacity
                key={freq}
                style={[
                  styles.radioOption,
                  scanFrequency === freq && styles.radioOptionSelected
                ]}
                onPress={() => setScanFrequency(freq as any)}
              >
                <View style={styles.radioCircle}>
                  {scanFrequency === freq && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <View style={styles.radioContent}>
                  <Text style={styles.radioLabel}>
                    {freq === 'manual' && 'Manual (tap to scan)'}
                    {freq === 'daily' && 'Daily (automatic)'}
                    {freq === 'realtime' && 'Real-time (coming soon)'}
                  </Text>
                  <Text style={styles.radioDescription}>
                    {freq === 'manual' && 'You control when to scan for new interactions'}
                    {freq === 'daily' && 'Automatically scan once per day'}
                    {freq === 'realtime' && 'Instant detection after each call/text'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Privacy Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔒 Privacy & Data</Text>

        <View style={styles.settingCard}>
          <View style={styles.privacyItem}>
            <Text style={styles.privacyIcon}>📱</Text>
            <View style={styles.privacyContent}>
              <Text style={styles.privacyTitle}>On-Device Processing</Text>
              <Text style={styles.privacyText}>
                All detection happens on your phone. Your call logs and messages never leave your device.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.privacyItem}>
            <Text style={styles.privacyIcon}>🔐</Text>
            <View style={styles.privacyContent}>
              <Text style={styles.privacyTitle}>Encrypted Sync</Text>
              <Text style={styles.privacyText}>
                Only interaction timestamps are synced (encrypted) for insights. No contact details are stored in the cloud.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.privacyButton}>
            <Text style={styles.privacyButtonText}>View Privacy Policy</Text>
            <Text style={styles.privacyButtonArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Data Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>

        <TouchableOpacity style={styles.dangerButton}>
          <Text style={styles.dangerButtonText}>Export All Data</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerButton}>
          <Text style={styles.dangerButtonText}>Delete All Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  settingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  divider: {
    height: 1,
    backgroundColor: '#ecf0f1',
    marginVertical: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 12,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27ae60',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  warningText: {
    fontSize: 13,
    color: '#856404',
    flex: 1,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  radioOptionSelected: {
    backgroundColor: '#e8f4fd',
    borderWidth: 2,
    borderColor: '#3498db',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7f8c8d',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3498db',
  },
  radioContent: {
    flex: 1,
  },
  radioLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  radioDescription: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  privacyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  privacyContent: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  privacyText: {
    fontSize: 13,
    color: '#7f8c8d',
    lineHeight: 18,
  },
  privacyButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  privacyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3498db',
  },
  privacyButtonArrow: {
    fontSize: 20,
    color: '#3498db',
  },
  dangerButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e74c3c',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e74c3c',
  },
});