import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal, TextInput } from 'react-native';
import * as Contacts from 'expo-contacts';
import { NameDetector } from '../../utils/nameDetector';
import { CommunicationGoals } from '@/components/CommunicationGoals';

interface CommunicationGoal {
  id: string;
  contactId: string;
  contactName: string;
  frequency: string;
  frequencyDays: number;
  method: string;
  isActive: boolean;
  lastContacted?: Date;
  nextDue?: Date;
  customNote?: string;
}

interface Contact {
  id: string;
  name?: string;
  phoneNumbers?: Array<{ number: string }>;
  relationship?: string;
  group?: string;
  lastInteraction?: Date;
  interactionType?: 'call' | 'text' | 'in-person' | 'video-call' | 'other';
  interactionNote?: string;
  daysSinceContact?: number;
}

interface Interaction {
  id: string;
  contactId: string;
  type: 'call' | 'text' | 'in-person' | 'video-call' | 'other';
  date: Date;
  note?: string;
}

interface GroupedContacts {
  [key: string]: Contact[];
}

const nameDetector = new NameDetector();

export default function HomeScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [groupedContacts, setGroupedContacts] = useState<GroupedContacts>({});
  const [loading, setLoading] = useState(true); // Start as loading
  const [totalContacts, setTotalContacts] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modal states
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [interactionType, setInteractionType] = useState<'call' | 'text' | 'in-person' | 'video-call' | 'other'>('call');
  const [interactionNote, setInteractionNote] = useState('');
  const [communicationGoals, setCommunicationGoals] = useState<CommunicationGoal[]>([]);

  // Auto-load contacts when component mounts
  useEffect(() => {
    loadContacts();
  }, []);

  // Update contacts when interactions change
  useEffect(() => {
    if (contacts.length > 0) {
      updateContactsWithInteractions();
    }
  }, [interactions, contacts]);

  // Smart filtering function - keeps only relevant contacts
  const smartFilterContacts = (allContacts: any[]) => {
    return allContacts.filter(contact => {
      const name = contact.name || '';

      // Always keep family members (regardless of anything else)
      const relationship = nameDetector.detectRelationship(name);
      if (['Mother', 'Father', 'Sister', 'Brother', 'Uncle', 'Aunt', 'Grandmother', 'Grandfather', 'Cousin'].includes(relationship)) {
        return true; // Family always included
      }

      // Must have a phone number (can't contact without it)
      if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) {
        return false;
      }

      // Filter out obvious spam/business junk
      const lowerName = name.toLowerCase();
      if (lowerName.includes('spam') ||
          lowerName.includes('telemarketer') ||
          lowerName.includes('robocall')) {
        return false;
      }

      // Keep work contacts and friends
      if (['Work', 'Friend'].includes(relationship)) {
        return true;
      }

      // Keep contacts that look like real people
      const wordCount = name.split(' ').length;
      const isReasonableLength = name.length <= 40;
      const looksLikePerson = wordCount >= 2 && wordCount <= 4 && isReasonableLength;

      return looksLikePerson;
    }).slice(0, 300); // Limit contacts to top 300 to keep app fast
  };

  const loadContacts = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const { status } = await Contacts.requestPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status === 'granted') {
        // Get all contacts from phone
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        });

        // Store total count for display
        setTotalContacts(data.length);

        // Apply smart filtering
        const filteredContacts = smartFilterContacts(data);

        // Apply AI detection to filtered contacts
        const enhancedContacts = nameDetector.autoGroupContacts(filteredContacts);

        // Add interaction tracking properties
        const trackedContacts = enhancedContacts.map((contact: Contact) => ({
          ...contact,
          lastInteraction: undefined,
          interactionType: undefined,
          interactionNote: undefined,
          daysSinceContact: undefined
        }));

        setContacts(trackedContacts);

        // Immediately update grouping after setting contacts
        updateContactsWithInteractions();
      } else {
        setLoadError('Contact permission is required to track your family and friends.');
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
      setLoadError('Failed to load contacts. Please try again.');
    }
    setLoading(false);
  };

  const updateContactsWithInteractions = () => {
    if (contacts.length === 0) return;

    const updatedContacts = contacts.map(contact => {
      // Find most recent interaction for this contact
      const contactInteractions = interactions
        .filter(interaction => interaction.contactId === contact.id)
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      const lastInteraction = contactInteractions[0];

      if (lastInteraction) {
        const daysSince = Math.floor((Date.now() - lastInteraction.date.getTime()) / (1000 * 60 * 60 * 24));

        return {
          ...contact,
          lastInteraction: lastInteraction.date,
          interactionType: lastInteraction.type,
          interactionNote: lastInteraction.note,
          daysSinceContact: daysSince
        };
      }

      return contact;
    });

    // Group contacts by their detected category
    const grouped = updatedContacts.reduce((groups: GroupedContacts, contact: Contact) => {
      const group = contact.group || 'Contacts';
      if (!groups[group]) groups[group] = [];
      groups[group].push(contact);
      return groups;
    }, {});

    // Sort each group by days since contact (most urgent first)
    Object.keys(grouped).forEach(groupName => {
      grouped[groupName].sort((a, b) => {
        const aDays = a.daysSinceContact ?? 999;
        const bDays = b.daysSinceContact ?? 999;
        return bDays - aDays; // Longest time since contact first
      });
    });

    setGroupedContacts(grouped);
  };

  const addInteraction = () => {
    if (!selectedContact) return;

    const newInteraction: Interaction = {
      id: Date.now().toString(),
      contactId: selectedContact.id,
      type: interactionType,
      date: new Date(),
      note: interactionNote.trim() || undefined
    };

    setInteractions(prev => [...prev, newInteraction]);

    // Reset modal
    setShowInteractionModal(false);
    setSelectedContact(null);
    setInteractionNote('');
    setInteractionType('call');

    Alert.alert('Interaction Added!', `Recorded ${interactionType} with ${selectedContact.name}`);
  };

  const getInteractionIcon = (type?: string) => {
    const icons: { [key: string]: string } = {
      'call': '📞',
      'text': '💬',
      'in-person': '👥',
      'video-call': '📹',
      'other': '💭'
    };
    return icons[type || ''] || '❓';
  };

  const getUrgencyColor = (daysSince?: number) => {
    if (!daysSince) return '#95a5a6'; // No interaction yet
    if (daysSince <= 3) return '#27ae60'; // Recent - green
    if (daysSince <= 7) return '#f39c12'; // Week - orange
    if (daysSince <= 30) return '#e67e22'; // Month - dark orange
    return '#e74c3c'; // Long time - red
  };

  const getUrgencyText = (daysSince?: number, relationship?: string) => {
    if (!daysSince) return 'No recent contact';

    if (daysSince <= 1) return 'Today!';
    if (daysSince <= 3) return `${daysSince} days ago`;
    if (daysSince <= 7) return `${daysSince} days ago`;
    if (daysSince <= 30) return `${daysSince} days ago`;
    if (daysSince <= 365) return `${Math.floor(daysSince / 30)} months ago`;
    return `${Math.floor(daysSince / 365)} years ago`;
  };

  const ContactCard = ({ contact }: { contact: Contact }) => (
    <View style={styles.contactCard}>
      <View style={styles.contactInfo}>
        <View style={styles.contactHeader}>
          <Text style={styles.contactName}>{contact.name || 'No Name'}</Text>
          <View style={[styles.relationshipBadge, { backgroundColor: getGroupColor(contact.group || 'Contacts') }]}>
            <Text style={styles.relationshipText}>{contact.relationship}</Text>
          </View>
        </View>

        <View style={styles.interactionInfo}>
          <View style={styles.lastContactRow}>
            <Text style={styles.lastContactIcon}>
              {getInteractionIcon(contact.interactionType)}
            </Text>
            <Text style={[styles.lastContactText, { color: getUrgencyColor(contact.daysSinceContact) }]}>
              {getUrgencyText(contact.daysSinceContact, contact.relationship)}
            </Text>
          </View>
          {contact.interactionNote && (
            <Text style={styles.interactionNote} numberOfLines={1}>
              "{contact.interactionNote}"
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.addInteractionButton}
        onPress={() => {
          setSelectedContact(contact);
          setShowInteractionModal(true);
        }}
      >
        <Text style={styles.addInteractionText}>+ Log Contact</Text>
      </TouchableOpacity>
    </View>
  );

  // Different colors for different types of relationships
  const getGroupColor = (group: string): string => {
    const colors: { [key: string]: string } = {
      'Family': '#ff6b6b',
      'Work': '#4ecdc4',
      'Friends': '#45b7d1',
      'Contacts': '#96ceb4'
    };
    return colors[group] || '#gray';
  };

  // Component that shows a group of contacts (Family, Work, etc.)
  const GroupSection = ({ groupName, contacts }: { groupName: string, contacts: Contact[] }) => (
    <View style={styles.groupSection}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupTitle}>{groupName}</Text>
        <Text style={styles.groupCount}>{contacts.length} contacts</Text>
      </View>
      {/* Show first 5 contacts in each group */}
      {contacts.slice(0, 5).map(contact => (
        <ContactCard key={contact.id} contact={contact} />
      ))}
      {/* Show how many more contacts are in this group */}
      {contacts.length > 5 && (
        <Text style={styles.moreText}>+{contacts.length - 5} more...</Text>
      )}
    </View>
  );

  const InteractionModal = () => (
    <Modal
      visible={showInteractionModal}
      animationType="slide"
      presentationStyle="formSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Log Contact with {selectedContact?.name}</Text>
          <TouchableOpacity onPress={() => setShowInteractionModal(false)}>
            <Text style={styles.modalClose}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <Text style={styles.sectionTitle}>How did you connect?</Text>

          <View style={styles.interactionTypes}>
            {[
              { type: 'call' as const, label: 'Phone Call', icon: '📞' },
              { type: 'text' as const, label: 'Text/Message', icon: '💬' },
              { type: 'in-person' as const, label: 'In Person', icon: '👥' },
              { type: 'video-call' as const, label: 'Video Call', icon: '📹' },
              { type: 'other' as const, label: 'Other', icon: '💭' }
            ].map(({ type, label, icon }) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.interactionTypeButton,
                  interactionType === type && styles.interactionTypeButtonActive
                ]}
                onPress={() => setInteractionType(type)}
              >
                <Text style={styles.interactionTypeIcon}>{icon}</Text>
                <Text style={[
                  styles.interactionTypeText,
                  interactionType === type && styles.interactionTypeTextActive
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.noteSection}>
            <Text style={styles.noteLabel}>Add a note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              value={interactionNote}
              onChangeText={setInteractionNote}
              placeholder="e.g., Talked about vacation plans"
              placeholderTextColor="#95a5a6"
              multiline
              maxLength={100}
            />
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={addInteraction}
          >
            <Text style={styles.saveButtonText}>Log This Contact</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Family Loop</Text>
        <Text style={styles.subtitle}>Communication Intelligence</Text>

        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your contacts...</Text>
          <Text style={styles.loadingSubtext}>Filtering and organizing your family & friends</Text>
        </View>
      </View>
    );
  }

  // Permission denied state
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Family Loop</Text>
        <Text style={styles.subtitle}>Communication Intelligence</Text>

        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Contact Permission Required</Text>
          <Text style={styles.errorText}>
            To help you track communication with family and friends, we need access to your contacts.
          </Text>
          <TouchableOpacity style={styles.button} onPress={loadContacts}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Error state
  if (loadError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Family Loop</Text>
        <Text style={styles.subtitle}>Communication Intelligence</Text>

        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to Load Contacts</Text>
          <Text style={styles.errorText}>{loadError}</Text>
          <TouchableOpacity style={styles.button} onPress={loadContacts}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main content - contacts loaded successfully
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Family Loop</Text>
        <Text style={styles.subtitle}>Communication Intelligence</Text>

        {/* Show filtering stats */}
        {totalContacts > 0 && (
          <Text style={styles.statsText}>
            Tracking {contacts.length} of {totalContacts} contacts
          </Text>
        )}
      </View>

      {/* Optional manual refresh button */}
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={loadContacts}
      >
        <Text style={styles.refreshText}>↻ Refresh Contacts</Text>
      </TouchableOpacity>

      {/* Communication goals component */}
      <CommunicationGoals
        contacts={contacts}
        interactions={interactions}
        /*goals={communicationGoals}
        onGoalsChange={setCommunicationGoals}*/
        onGoalCreated={() => {
          console.log('New goal created!');
        }}
      />

      {/* Show grouped contacts */}
      {Object.keys(groupedContacts).length > 0 ? (
        <FlatList
          data={Object.entries(groupedContacts)}
          keyExtractor={([groupName]) => groupName}
          renderItem={({ item: [groupName, contacts] }) => (
            <GroupSection groupName={groupName} contacts={contacts} />
          )}
          style={styles.groupsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Contacts Found</Text>
          <Text style={styles.emptyText}>
            Make sure you have contacts saved on your device to start tracking communication.
          </Text>
        </View>
      )}

      <InteractionModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    marginBottom: 20,
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
    marginBottom: 10,
  },
  statsText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#3498db',
    fontWeight: '500',
  },
  refreshButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 15,
  },
  refreshText: {
    color: '#7f8c8d',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 12,
    minWidth: 200,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  contactInfo: {
    flex: 1,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    flex: 1,
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
  interactionInfo: {
    marginTop: 4,
  },
  lastContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  lastContactIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  lastContactText: {
    fontSize: 14,
    fontWeight: '500',
  },
  interactionNote: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginTop: 2,
  },
  addInteractionButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addInteractionText: {
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
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  modalClose: {
    fontSize: 16,
    color: '#e74c3c',
  },
  modalContent: {
    padding: 20,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  interactionTypes: {
    marginBottom: 24,
  },
  interactionTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  interactionTypeButtonActive: {
    backgroundColor: '#e8f4fd',
    borderColor: '#3498db',
  },
  interactionTypeIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  interactionTypeText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  interactionTypeTextActive: {
    color: '#3498db',
    fontWeight: '600',
  },
  noteSection: {
    marginBottom: 32,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495e',
    marginBottom: 8,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#27ae60',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});