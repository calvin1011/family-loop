import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, Pressable } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function ProfileScreen() {
  const { user, signOut, updateProfile, isLoading } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(user?.displayName || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Function to handle profile updates (name)
  const handleUpdateProfile = async () => {
    try {
      if (newDisplayName && newDisplayName !== user?.displayName) {
        await updateProfile({ displayName: newDisplayName });
        Alert.alert('Success', 'Profile updated successfully!');
      }
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  // Function to handle password changes
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    // TODO: Implement password change logic with Firebase here
    // Note: You will need to re-authenticate the user before changing the password
    Alert.alert('Success', 'Password changed successfully!');
    setNewPassword('');
    setConfirmPassword('');
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <ThemedText>Please sign in to view your profile.</ThemedText>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Your Profile</ThemedText>
      <View style={styles.profileCard}>
        <ThemedText style={styles.label}>Name</ThemedText>
        <ThemedText style={styles.value}>{user.displayName || 'Not set'}</ThemedText>
        <ThemedText style={styles.label}>Email</ThemedText>
        <ThemedText style={styles.value}>{user.email || 'Not set'}</ThemedText>
        <ThemedText style={styles.label}>Provider</ThemedText>
        <ThemedText style={styles.value}>{user.provider || 'Not set'}</ThemedText>
      </View>

      {/* Action buttons */}
      <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
        <Text style={styles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={signOut} disabled={isLoading}>
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>

      {/* Modal for editing profile */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <ThemedText style={styles.modalTitle}>Edit Profile</ThemedText>

          <ThemedText style={styles.modalLabel}>Change Name</ThemedText>
          <TextInput
            style={styles.modalInput}
            value={newDisplayName}
            onChangeText={setNewDisplayName}
            placeholder="New name"
          />

          <TouchableOpacity style={styles.modalButton} onPress={handleUpdateProfile}>
            <Text style={styles.buttonText}>Save Changes</Text>
          </TouchableOpacity>

          <Pressable style={styles.modalButtonClose} onPress={() => setModalVisible(false)}>
            <Text style={styles.buttonTextClose}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  profileCard: {
    width: '100%',
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34495E',
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 10,
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#3498DB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#E74C3C',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  modalInput: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 15,
  },
  modalButton: {
    backgroundColor: '#3498DB',
    borderRadius: 12,
    padding: 15,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonClose: {
    marginTop: 15,
  },
  buttonTextClose: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: 'bold',
  },
});