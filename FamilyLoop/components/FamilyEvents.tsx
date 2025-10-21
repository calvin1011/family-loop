// FamilyLoop/components/FamilyEvents.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Contacts from 'expo-contacts';

interface Contact {
  id: string;
  name?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  nickname?: string;
  jobTitle?: string;
  company?: string;
  department?: string;
  note?: string;
  phoneNumbers?: Array<{
    number?: string;
    isPrimary?: boolean;
    digits?: string;
    countryCode?: string;
    id: string;
    label?: string;
  }>;
  emails?: Array<{
    email?: string;
    isPrimary?: boolean;
    id: string;
    label?: string;
  }>;
  addresses?: Array<any>;
  instantMessageAddresses?: Array<any>;
  urlAddresses?: Array<any>;
  dates?: Array<any>;
  relationships?: Array<any>;
  contactType?: string;
  imageAvailable?: boolean;
  image?: any;
  rawImage?: any;
  // Our custom fields
  relationship?: string;
  group?: string;
}

interface FamilyEvent {
  id: string;
  contactId: string;
  contactName: string;
  type: 'birthday' | 'anniversary' | 'wedding' | 'graduation' | 'custom';
  title: string;
  date: Date;
  isRecurring: boolean;
  reminderDays: number[];
  notes?: string;
  lastWished?: Date;
  isActive: boolean;
}

interface Props {
  interactions: Array<{
    id: string;
    contactId: string;
    type: string;
    date: Date;
  }>;
  onEventCreated?: () => void;
}

const EVENT_TYPES = [
  { value: 'birthday', label: 'Birthday', icon: '🎂' },
  { value: 'anniversary', label: 'Anniversary', icon: '💍' },
  { value: 'wedding', label: 'Wedding', icon: '💒' },
  { value: 'graduation', label: 'Graduation', icon: '🎓' },
  { value: 'custom', label: 'Custom Event', icon: '🎉' },
];

const REMINDER_OPTIONS = [
  { days: 0, label: 'Day of event' },
  { days: 1, label: '1 day before' },
  { days: 3, label: '3 days before' },
  { days: 7, label: '1 week before' },
  { days: 14, label: '2 weeks before' },
];

export function FamilyEvents({ interactions, onEventCreated }: Props) {
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState(false);

  // Form state
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<string>('birthday');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [isRecurring, setIsRecurring] = useState(true);
  const [selectedReminder, setSelectedReminder] = useState<number>(1);
  const [eventNotes, setEventNotes] = useState('');

  // Contact search
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  // Date input
  const [dateString, setDateString] = useState('');

  useEffect(() => {
    loadEvents();
    loadAllContacts();
  }, []);

  useEffect(() => {
    updateEventTitle();
  }, [selectedContact, selectedEventType]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContacts([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allContacts.filter(contact => {
      const name = (contact.name || '').toLowerCase();
      const relationship = (contact.relationship || '').toLowerCase();
      return name.includes(query) || relationship.includes(query);
    }).slice(0, 10);

    setFilteredContacts(filtered);
  }, [searchQuery, allContacts]);

  const loadAllContacts = async () => {
    setContactsLoading(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        });

        const enhancedContacts = data.map(contact => ({
          ...contact, // Spread all existing properties from Expo Contacts
          relationship: detectBasicRelationship(contact.name || ''),
          group: 'Contacts'
        }));

        setAllContacts(enhancedContacts);
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
    setContactsLoading(false);
  };

  const detectBasicRelationship = (name: string) => {
    if (!name) return 'Contact';
    const lowerName = name.toLowerCase();

    if (lowerName.includes('mom') || lowerName.includes('mother')) return 'Mother';
    if (lowerName.includes('dad') || lowerName.includes('father')) return 'Father';
    if (lowerName.includes('sister') || lowerName.includes('sis')) return 'Sister';
    if (lowerName.includes('brother') || lowerName.includes('bro')) return 'Brother';
    if (lowerName.includes('uncle')) return 'Uncle';
    if (lowerName.includes('aunt')) return 'Aunt';
    if (lowerName.includes('grandma') || lowerName.includes('grandmother')) return 'Grandmother';
    if (lowerName.includes('grandpa') || lowerName.includes('grandfather')) return 'Grandfather';
    if (lowerName.includes('cousin')) return 'Cousin';

    return 'Contact';
  };

  const updateEventTitle = () => {
    if (!selectedContact) return;

    const eventType = EVENT_TYPES.find(t => t.value === selectedEventType);
    if (selectedEventType === 'custom') {
      setEventTitle('');
    } else {
      setEventTitle(`${selectedContact.name}'s ${eventType?.label || 'Event'}`);
    }
  };

  const loadEvents = async () => {
    try {
      const stored = await AsyncStorage.getItem('family_events');
      if (stored) {
        const parsedEvents = JSON.parse(stored).map((event: any) => ({
          ...event,
          date: new Date(event.date),
          lastWished: event.lastWished ? new Date(event.lastWished) : undefined,
        }));
        setEvents(parsedEvents);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const saveEvents = async (newEvents: FamilyEvent[]) => {
    try {
      await AsyncStorage.setItem('family_events', JSON.stringify(newEvents));
    } catch (error) {
      console.error('Failed to save events:', error);
    }
  };

  const parseDateString = (input: string): Date | null => {
    // Handle formats like MM/DD, MM/DD/YYYY, MM-DD, MM-DD-YYYY
    const cleaned = input.replace(/[^\d\/\-]/g, '');
    const parts = cleaned.split(/[\/\-]/);

    if (parts.length === 2) {
      // MM/DD format - use current year
      const month = parseInt(parts[0]) - 1; // JS months are 0-indexed
      const day = parseInt(parts[1]);
      const year = new Date().getFullYear();

      if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
        return new Date(year, month, day);
      }
    } else if (parts.length === 3) {
      // MM/DD/YYYY format
      const month = parseInt(parts[0]) - 1;
      const day = parseInt(parts[1]);
      const year = parseInt(parts[2]);

      if (month >= 0 && month <= 11 && day >= 1 && day <= 31 && year >= 1900) {
        return new Date(year, month, day);
      }
    }

    return null;
  };

  const createEvent = async () => {
    if (!selectedContact) {
      Alert.alert('Missing Contact', 'Please select a contact for this event.');
      return;
    }

    if (!eventTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for this event.');
      return;
    }

    const parsedDate = parseDateString(dateString);
    if (!parsedDate) {
      Alert.alert('Invalid Date', 'Please enter a valid date (MM/DD or MM/DD/YYYY).');
      return;
    }

    const newEvent: FamilyEvent = {
      id: Date.now().toString(),
      contactId: selectedContact.id,
      contactName: selectedContact.name || 'Unknown',
      type: selectedEventType as any,
      title: eventTitle.trim(),
      date: parsedDate,
      isRecurring: isRecurring,
      reminderDays: [selectedReminder],
      notes: eventNotes.trim() || undefined,
      isActive: true,
    };

    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    await saveEvents(updatedEvents);

    // Reset form
    resetForm();
    setShowCreateModal(false);

    Alert.alert('Event Created!', `${newEvent.title} has been added to your family calendar.`);
    onEventCreated?.();
  };

  const resetForm = () => {
    setSelectedContact(null);
    setSelectedEventType('birthday');
    setEventTitle('');
    setDateString('');
    setIsRecurring(true);
    setSelectedReminder(1);
    setEventNotes('');
    setSearchQuery('');
  };

  const selectReminder = (days: number) => {
    setSelectedReminder(days);
  };

  const deleteEvent = async (eventId: string) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedEvents = events.filter(event => event.id !== eventId);
            setEvents(updatedEvents);
            await saveEvents(updatedEvents);
          }
        }
      ]
    );
  };

  const markAsWished = async (eventId: string) => {
    const updatedEvents = events.map(event =>
      event.id === eventId
        ? { ...event, lastWished: new Date() }
        : event
    );
    setEvents(updatedEvents);
    await saveEvents(updatedEvents);
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    const currentYear = now.getFullYear();

    return events
      .filter(event => event.isActive)
      .map(event => {
        // For recurring events, calculate next occurrence
        let nextDate = new Date(event.date);
        if (event.isRecurring) {
          nextDate.setFullYear(currentYear);
          // If the date has passed this year, use next year
          if (nextDate < now) {
            nextDate.setFullYear(currentYear + 1);
          }
        }

        const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return {
          ...event,
          nextDate,
          daysUntil,
          isDue: event.reminderDays.includes(daysUntil)
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);
  };

  const getEventIcon = (type: string) => {
    const eventType = EVENT_TYPES.find(t => t.value === type);
    return eventType?.icon || '🎉';
  };

  const upcomingEvents = getUpcomingEvents();
  const dueEvents = upcomingEvents.filter(event => event.isDue);

  // Event Card Component
  const EventCard = ({ event }: { event: any }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <View style={styles.eventInfo}>
          <View style={styles.eventTitleRow}>
            <Text style={styles.eventIcon}>{getEventIcon(event.type)}</Text>
            <Text style={styles.eventTitle}>{event.title}</Text>
          </View>
          <Text style={styles.eventDate}>
            {event.nextDate.toLocaleDateString()}
            {event.daysUntil === 0 && ' (Today!)'}
            {event.daysUntil === 1 && ' (Tomorrow)'}
            {event.daysUntil > 1 && ` (${event.daysUntil} days)`}
          </Text>
          {event.notes && (
            <Text style={styles.eventNotes}>"{event.notes}"</Text>
          )}
        </View>
        <View style={styles.eventActions}>
          {event.isDue && (
            <TouchableOpacity
              style={styles.wishButton}
              onPress={() => markAsWished(event.id)}
            >
              <Text style={styles.wishButtonText}>Mark Wished</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.deleteEventButton}
            onPress={() => deleteEvent(event.id)}
          >
            <Text style={styles.deleteEventButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Family Events</Text>
          {events.length > 0 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => setShowEventsModal(true)}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.summaryStats}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{events.filter(e => e.isActive).length}</Text>
            <Text style={styles.statLabel}>Active Events</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: dueEvents.length > 0 ? '#e74c3c' : '#27ae60' }]}>
              {dueEvents.length}
            </Text>
            <Text style={styles.statLabel}>Due Now</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.createEventButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createEventText}>+ Add Family Event</Text>
        </TouchableOpacity>
      </View>

      {/* Show due events */}
      {dueEvents.length > 0 && (
        <View style={styles.dueEventsSection}>
          <Text style={styles.dueEventsTitle}>Events Due Soon</Text>
          {dueEvents.slice(0, 3).map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </View>
      )}

      {/* Create Event Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Family Event</Text>
            <TouchableOpacity onPress={() => {
              resetForm();
              setShowCreateModal(false);
            }}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Contact Selection */}
            <Text style={styles.sectionTitle}>Choose Contact</Text>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={contactsLoading ? "Loading contacts..." : "Type name or number"}
              placeholderTextColor="#95a5a6"
              autoCorrect={false}
              autoCapitalize="none"
              editable={!contactsLoading}
            />

            {selectedContact && (
              <View style={styles.selectedContactCard}>
                <Text style={styles.selectedContactText}>
                  Selected: {selectedContact.name} ({selectedContact.relationship})
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedContact(null)}
                  style={styles.clearSelectionButton}
                >
                  <Text style={styles.clearSelectionText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            {searchQuery.trim() && !selectedContact && (
              <View style={styles.searchResults}>
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact) => (
                    <TouchableOpacity
                      key={contact.id}
                      style={styles.searchResultItem}
                      onPress={() => {
                        setSelectedContact(contact);
                        setSearchQuery('');
                      }}
                    >
                      <Text style={styles.searchResultName}>{contact.name}</Text>
                      <Text style={styles.searchResultRelationship}>({contact.relationship})</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noResultsText}>No contacts found for "{searchQuery}"</Text>
                )}
              </View>
            )}

            {/* Event Type Selection */}
            <Text style={styles.sectionTitle}>Event Type</Text>
            <View style={styles.eventTypesGrid}>
              {EVENT_TYPES.map(type => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.eventTypeButton,
                    selectedEventType === type.value && styles.eventTypeButtonSelected
                  ]}
                  onPress={() => setSelectedEventType(type.value)}
                >
                  <Text style={styles.eventTypeIcon}>{type.icon}</Text>
                  <Text style={[
                    styles.eventTypeText,
                    selectedEventType === type.value && styles.eventTypeTextSelected
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Event Title */}
            <Text style={styles.sectionTitle}>Event Title</Text>
            <TextInput
              style={styles.titleInput}
              value={eventTitle}
              onChangeText={setEventTitle}
              placeholder="Enter event title"
              placeholderTextColor="#95a5a6"
            />

            {/* Date Input */}
            <Text style={styles.sectionTitle}>Date</Text>
            <TextInput
              style={styles.dateInput}
              value={dateString}
              onChangeText={setDateString}
              placeholder="MM/DD or MM/DD/YYYY"
              placeholderTextColor="#95a5a6"
              keyboardType="numeric"
            />

            {/* Recurring Toggle */}
            <View style={styles.recurringSection}>
              <Text style={styles.sectionTitle}>Recurring Annually</Text>
              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
                trackColor={{ false: '#e0e0e0', true: '#3498db' }}
                thumbColor={isRecurring ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            {/* Reminder Settings */}
            <Text style={styles.sectionTitle}>Remind Me</Text>
            <View style={styles.reminderOptions}>
              {REMINDER_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.days}
                  style={[
                    styles.reminderOption,
                    selectedReminder === option.days && styles.reminderOptionSelected
                  ]}
                  onPress={() => selectReminder(option.days)}
                >
                  <Text style={[
                    styles.reminderOptionText,
                    selectedReminder === option.days && styles.reminderOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes */}
            <Text style={styles.sectionTitle}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={eventNotes}
              onChangeText={setEventNotes}
              placeholder="Add any notes about this event"
              placeholderTextColor="#95a5a6"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Create Button */}
            <TouchableOpacity
              style={[
                styles.createButton,
                (!selectedContact || !eventTitle.trim()) && styles.createButtonDisabled
              ]}
              onPress={createEvent}
              disabled={!selectedContact || !eventTitle.trim()}
            >
              <Text style={styles.createButtonText}>Create Event</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* All Events Modal */}
      <Modal
        visible={showEventsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>All Family Events</Text>
            <TouchableOpacity onPress={() => setShowEventsModal(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={upcomingEvents}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <EventCard event={item} />}
            contentContainerStyle={styles.eventsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyEvents}>
                <Text style={styles.emptyEventsText}>No family events yet</Text>
                <Text style={styles.emptyEventsSubtext}>Add birthdays, anniversaries, and special occasions!</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ecf0f1',
    borderRadius: 16,
  },
  viewAllText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  createEventButton: {
    backgroundColor: '#9b59b6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  createEventText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  dueEventsSection: {
    marginTop: 16,
  },
  dueEventsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 8,
    marginLeft: 4,
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  eventDate: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  eventNotes: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  eventActions: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  wishButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  wishButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteEventButton: {
    padding: 4,
  },
  deleteEventButtonText: {
    fontSize: 16,
  },
  // Modal styles
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalClose: {
    fontSize: 16,
    color: '#e74c3c',
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
    marginTop: 20,
  },
  // Contact search styles
  searchInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    marginBottom: 12,
  },
  selectedContactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e8f4fd',
    borderColor: '#3498db',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  selectedContactText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
    flex: 1,
  },
  clearSelectionButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearSelectionText: {
    fontSize: 18,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  searchResults: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: 'white',
    marginBottom: 12,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchResultName: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  searchResultRelationship: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  noResultsText: {
    padding: 20,
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 14,
  },
  // Event type selection
  eventTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  eventTypeButton: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  eventTypeButtonSelected: {
    backgroundColor: '#f3e5f5',
    borderColor: '#9b59b6',
  },
  eventTypeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  eventTypeText: {
    fontSize: 14,
    color: '#2c3e50',
    textAlign: 'center',
  },
  eventTypeTextSelected: {
    color: '#9b59b6',
    fontWeight: '600',
  },
  // Form inputs
  titleInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    marginBottom: 10,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    marginBottom: 10,
  },
  recurringSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reminderOptions: {
    gap: 8,
    marginBottom: 10,
  },
  reminderOption: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  reminderOptionSelected: {
    backgroundColor: '#f3e5f5',
    borderColor: '#9b59b6',
  },
  reminderOptionText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  reminderOptionTextSelected: {
    color: '#9b59b6',
    fontWeight: '600',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    minHeight: 80,
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#9b59b6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  eventsList: {
    padding: 20,
  },
  emptyEvents: {
    alignItems: 'center',
    padding: 40,
  },
  emptyEventsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  emptyEventsSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});