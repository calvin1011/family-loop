import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Pressable
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { NameDetector } from '@/utils/nameDetector.js';
import { useAuth } from '@/contexts/AuthContext';

interface Contact {
  id: string;
  name?: string;
  phoneNumbers?: Array<{ number: string }>;
  relationship?: string;
  group?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
}

interface ChatMessage {
  id: string;
  contactId: string;
  message: string;
  timestamp: Date;
  isFromMe: boolean;
}

const nameDetector = new NameDetector();

export default function ChatScreen() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load contacts on mount
  useEffect(() => {
    loadContacts();
    // In a real app, you'd load existing chats from a database here
    loadMockChats();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        });

        // Apply smart filtering (same as home screen)
        const filteredContacts = smartFilterContacts(data);
        const enhancedContacts = nameDetector.autoGroupContacts(filteredContacts);

        // Add chat-specific properties
        const chatContacts = enhancedContacts.map((contact: Contact) => ({
          ...contact,
          lastMessage: undefined,
          lastMessageTime: undefined,
          unreadCount: 0
        }));

        setContacts(chatContacts);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load contacts');
    }
    setLoading(false);
  };

  const smartFilterContacts = (allContacts: any[]) => {
    return allContacts.filter(contact => {
      const name = contact.name || '';
      const relationship = nameDetector.detectRelationship(name);

      // Always keep family members
      if (['Mother', 'Father', 'Sister', 'Brother', 'Uncle', 'Aunt', 'Grandmother', 'Grandfather', 'Cousin'].includes(relationship)) {
        return true;
      }

      // Must have a phone number
      if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) {
        return false;
      }

      // Filter out spam/business
      const lowerName = name.toLowerCase();
      if (lowerName.includes('spam') || lowerName.includes('telemarketer')) {
        return false;
      }

      // Keep work contacts and friends
      if (['Work', 'Friend'].includes(relationship)) {
        return true;
      }

      // Keep contacts that look like real people
      const wordCount = name.split(' ').length;
      const isReasonableLength = name.length <= 40;
      return wordCount >= 2 && wordCount <= 4 && isReasonableLength;
    }).slice(0, 100); // Limit for chat list
  };

  // Mock some chat data for demonstration
  const loadMockChats = () => {
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        contactId: 'mock-mom',
        message: 'Hi honey, how was your day?',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isFromMe: false
      },
      {
        id: '2',
        contactId: 'mock-mom',
        message: 'Great! Just finished work. How are you?',
        timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        isFromMe: true
      },
      {
        id: '3',
        contactId: 'mock-brother',
        message: 'Want to grab dinner this weekend?',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
        isFromMe: false
      }
    ];
    setChats(mockMessages);

    // Update contacts with last message info
    setContacts(prev => prev.map(contact => {
      const lastMsg = mockMessages
        .filter(msg => msg.contactId === contact.id ||
          (contact.name === 'Mom' && msg.contactId === 'mock-mom') ||
          (contact.name?.includes('Brother') && msg.contactId === 'mock-brother'))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

      if (lastMsg) {
        return {
          ...contact,
          lastMessage: lastMsg.message,
          lastMessageTime: lastMsg.timestamp,
          unreadCount: lastMsg.isFromMe ? 0 : 1
        };
      }
      return contact;
    }));
  };

  const sendMessage = () => {
    if (!messageText.trim() || !selectedContact) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      contactId: selectedContact.id,
      message: messageText.trim(),
      timestamp: new Date(),
      isFromMe: true
    };

    setChats(prev => [...prev, newMessage]);
    setMessageText('');

    // Update contact's last message
    setContacts(prev => prev.map(contact =>
      contact.id === selectedContact.id
        ? {
            ...contact,
            lastMessage: newMessage.message,
            lastMessageTime: newMessage.timestamp
          }
        : contact
    ));

    // In a real app, you'd send this to your messaging service here
    console.log('Message sent:', newMessage);
  };

  const startNewChat = (contact: Contact) => {
    setSelectedContact(contact);
    setShowContactPicker(false);
  };

  const getContactChats = () => {
    if (!selectedContact) return [];
    return chats
      .filter(chat =>
        chat.contactId === selectedContact.id ||
        (selectedContact.name === 'Mom' && chat.contactId === 'mock-mom') ||
        (selectedContact.name?.includes('Brother') && chat.contactId === 'mock-brother')
      )
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const getRelationshipColor = (relationship?: string) => {
    const colors: { [key: string]: string } = {
      'Mother': '#ff6b6b',
      'Father': '#4ecdc4',
      'Sister': '#45b7d1',
      'Brother': '#96ceb4',
      'Friend': '#feca57',
      'Work': '#a55eea',
    };
    return colors[relationship || ''] || '#95a5a6';
  };

  // Chat List Component
  const ChatListItem = ({ contact }: { contact: Contact }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => setSelectedContact(contact)}
    >
      <View style={styles.chatItemLeft}>
        <View style={[styles.avatar, { backgroundColor: getRelationshipColor(contact.relationship) }]}>
          <Text style={styles.avatarText}>
            {contact.name?.charAt(0) || '?'}
          </Text>
        </View>
        <View style={styles.chatInfo}>
          <Text style={styles.contactName}>{contact.name || 'Unknown'}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {contact.lastMessage || 'No messages yet'}
          </Text>
        </View>
      </View>
      <View style={styles.chatItemRight}>
        {contact.lastMessageTime && (
          <Text style={styles.timestamp}>
            {formatTime(contact.lastMessageTime)}
          </Text>
        )}
        {(contact.unreadCount || 0) > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{contact.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // Message Component
  const MessageBubble = ({ message }: { message: ChatMessage }) => (
    <View style={[
      styles.messageBubble,
      message.isFromMe ? styles.myMessage : styles.theirMessage
    ]}>
      <Text style={[
        styles.messageText,
        message.isFromMe ? styles.myMessageText : styles.theirMessageText
      ]}>
        {message.message}
      </Text>
      <Text style={styles.messageTime}>
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  // Contact Picker Modal
  const ContactPickerModal = () => (
    <Modal
      visible={showContactPicker}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Start New Chat</Text>
          <TouchableOpacity onPress={() => setShowContactPicker(false)}>
            <Text style={styles.modalClose}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.contactPickerItem}
              onPress={() => startNewChat(item)}
            >
              <View style={[styles.avatar, { backgroundColor: getRelationshipColor(item.relationship) }]}>
                <Text style={styles.avatarText}>{item.name?.charAt(0) || '?'}</Text>
              </View>
              <View>
                <Text style={styles.contactName}>{item.name || 'Unknown'}</Text>
                <Text style={styles.contactRelationship}>{item.relationship}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );

  if (selectedContact) {
    // Chat Detail View
    const contactChats = getContactChats();

    return (
      <View style={styles.chatDetailContainer}>
        {/* Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedContact(null)}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderName}>{selectedContact.name}</Text>
            <Text style={styles.chatHeaderRelationship}>{selectedContact.relationship}</Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          data={contactChats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
        />

        {/* Message Input */}
        <View style={styles.messageInputContainer}>
          <TextInput
            style={styles.messageInput}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!messageText.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Chat List View
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity
          style={styles.newChatButton}
          onPress={() => setShowContactPicker(true)}
        >
          <Text style={styles.newChatText}>+ New Chat</Text>
        </TouchableOpacity>
      </View>

      {contacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Contacts Yet</Text>
          <Text style={styles.emptyDescription}>
            Load your contacts first from the Home tab to start chatting
          </Text>
        </View>
      ) : (
        <FlatList
          data={contacts.filter(c => c.lastMessage)} // Only show contacts with messages
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatListItem contact={item} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ContactPickerModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  newChatButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newChatText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  chatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  chatItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  chatInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  chatItemRight: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Chat Detail Styles
  chatDetailContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    fontSize: 16,
    color: '#3498db',
    marginRight: 16,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  chatHeaderRelationship: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#3498db',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  myMessageText: {
    color: 'white',
  },
  theirMessageText: {
    color: '#2c3e50',
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '600',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalClose: {
    fontSize: 16,
    color: '#e74c3c',
  },
  contactPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  contactRelationship: {
    fontSize: 14,
    color: '#7f8c8d',
  },
});