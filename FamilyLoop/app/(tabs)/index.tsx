import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import * as Contacts from 'expo-contacts';
import { NameDetector } from '../../utils/nameDetector';

interface Contact {
  id: string;
  name?: string;
  phoneNumbers?: Array<{ number: string }>;
  relationship?: string;
  group?: string;
}

interface GroupedContacts {
  [key: string]: Contact[];
}

const nameDetector = new NameDetector();

export default function HomeScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groupedContacts, setGroupedContacts] = useState<GroupedContacts>({});
  const [loading, setLoading] = useState(false);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        });

        // AI detection
        const enhancedContacts = nameDetector.autoGroupContacts(data);
        setContacts(enhancedContacts);

        // Group by relationship
        const grouped = enhancedContacts.reduce((groups: GroupedContacts, contact: Contact) => {
          const group = contact.group || 'Contacts';
          if (!groups[group]) groups[group] = [];
          groups[group].push(contact);
          return groups;
        }, {});

        setGroupedContacts(grouped);

        Alert.alert('Success!', `Found ${data.length} contacts and grouped them automatically!`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load contacts');
    }
    setLoading(false);
  };

  const ContactCard = ({ contact }: { contact: Contact }) => (
    <View style={styles.contactCard}>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{contact.name || 'No Name'}</Text>
        <Text style={styles.contactPhone}>
          {contact.phoneNumbers?.[0]?.number || 'No Phone'}
        </Text>
      </View>
      <View style={[styles.relationshipBadge, { backgroundColor: getGroupColor(contact.group || 'Contacts') }]}>
        <Text style={styles.relationshipText}>{contact.relationship}</Text>
      </View>
    </View>
  );

  const getGroupColor = (group: string): string => {
    const colors: { [key: string]: string } = {
      'Family': '#ff6b6b',
      'Work': '#4ecdc4',
      'Friends': '#45b7d1',
      'Contacts': '#96ceb4'
    };
    return colors[group] || '#gray';
  };

  const GroupSection = ({ groupName, contacts }: { groupName: string, contacts: Contact[] }) => (
    <View style={styles.groupSection}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupTitle}>{groupName}</Text>
        <Text style={styles.groupCount}>{contacts.length} contacts</Text>
      </View>
      {contacts.slice(0, 3).map(contact => (
        <ContactCard key={contact.id} contact={contact} />
      ))}
      {contacts.length > 3 && (
        <Text style={styles.moreText}>+{contacts.length - 3} more...</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Family Loop</Text>
      <Text style={styles.subtitle}>AI-Powered Contact Groups</Text>

      <TouchableOpacity style={styles.button} onPress={loadContacts}>
        <Text style={styles.buttonText}>
          {loading ? 'Analyzing Contacts...' : 'Load & Group My Contacts'}
        </Text>
      </TouchableOpacity>

      {Object.keys(groupedContacts).length > 0 && (
        <FlatList
          data={Object.entries(groupedContacts)}
          keyExtractor={([groupName]) => groupName}
          renderItem={({ item: [groupName, contacts] }) => (
            <GroupSection groupName={groupName} contacts={contacts} />
          )}
          style={styles.groupsList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 10,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#7f8c8d',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  groupsList: {
    flex: 1,
  },
  groupSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  groupCount: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  contactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
  },
  contactPhone: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  relationshipBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  relationshipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  moreText: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginTop: 8,
  },
});