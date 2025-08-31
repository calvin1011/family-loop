import React from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function ExploreScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>How to Use Family Loop</Text>
        <Text style={styles.subtitle}>Your guide to better family communication</Text>
      </View>

      {/* Getting Started Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚀 Getting Started</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your contacts are automatically loaded</Text>
          <Text style={styles.cardText}>
            Family Loop smart-filters your phone contacts to show only family, friends, and important people. 
            Family members are always included, even without phone numbers.
          </Text>
        </View>
      </View>

      {/* Understanding the Home Screen */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏠 Understanding the Home Screen</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Groups</Text>
          <Text style={styles.cardText}>
            • <Text style={styles.highlight}>Family</Text> - Parents, siblings, grandparents, aunts, uncles{'\n'}
            • <Text style={styles.highlight}>Friends</Text> - Close personal relationships{'\n'}
            • <Text style={styles.highlight}>Work</Text> - Professional contacts{'\n'}
            • <Text style={styles.highlight}>Contacts</Text> - Other important people
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Color Coding System</Text>
          <Text style={styles.cardText}>
            • <Text style={[styles.highlight, {color: '#27ae60'}]}>Green</Text> - Contacted recently (1-3 days){'\n'}
            • <Text style={[styles.highlight, {color: '#f39c12'}]}>Orange</Text> - Been a week since contact{'\n'}
            • <Text style={[styles.highlight, {color: '#e67e22'}]}>Dark Orange</Text> - Been a month{'\n'}
            • <Text style={[styles.highlight, {color: '#e74c3c'}]}>Red</Text> - Long time since contact
          </Text>
        </View>
      </View>

      {/* Logging Contact */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 What Does "Logging Contact" Mean?</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Track Your Interactions</Text>
          <Text style={styles.cardText}>
            "Logging" means recording when you communicate with someone. This helps you:
            {'\n'}• Remember who you haven't talked to recently
            {'\n'}• Build better communication habits
            {'\n'}• Stay closer to family and friends
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>How to Log Contact</Text>
          <Text style={styles.cardText}>
            1. Find the person in your contact list{'\n'}
            2. Tap the green <Text style={styles.highlight}>"+ Log Contact"</Text> button{'\n'}
            3. Choose how you connected: 📞 Call, 💬 Text, 👥 In Person, 📹 Video Call, or 💭 Other{'\n'}
            4. Add an optional note about what you discussed{'\n'}
            5. Tap "Log This Contact"
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>When to Log Contact</Text>
          <Text style={styles.cardText}>
            Log contact <Text style={styles.highlight}>after</Text> you communicate with someone:
            {'\n'}• After a phone call with Mom
            {'\n'}• After texting your brother
            {'\n'}• After meeting a friend for coffee
            {'\n'}• After a video call with grandparents
          </Text>
        </View>
      </View>

      {/* Chat Feature */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💬 Using the Chat Feature</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Start Conversations</Text>
          <Text style={styles.cardText}>
            The Chat tab helps you message family and friends:
            {'\n'}• Tap "+ New Chat" to start a conversation
            {'\n'}• Choose someone from your contacts
            {'\n'}• Or add a new contact manually
            {'\n'}• Type your message and tap "Send"
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>How Messages Work</Text>
          <Text style={styles.cardText}>
            Currently, messages open your phone's default SMS app to send real text messages. 
            This ensures your family receives actual texts they can reply to normally.
          </Text>
        </View>
      </View>

      {/* Profile Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Managing Your Profile</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Account</Text>
          <Text style={styles.cardText}>
            In the Profile tab you can:
            {'\n'}• View your account information
            {'\n'}• Edit your display name
            {'\n'}• Sign out when needed
            {'\n'}• See how you signed in (Email, Google, etc.)
          </Text>
        </View>
      </View>

      {/* Tips for Success */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Tips for Better Family Communication</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Build Good Habits</Text>
          <Text style={styles.cardText}>
            • Check the app daily to see who you haven't contacted recently
            {'\n'}• Set personal goals like "text Mom every 3 days"
            {'\n'}• Use the color coding to prioritize who needs attention
            {'\n'}• Add notes to remember what you talked about
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Family First</Text>
          <Text style={styles.cardText}>
            Family Loop is designed to help you stay close to the people who matter most. 
            Focus on regular, meaningful contact rather than perfect tracking.
          </Text>
        </View>
      </View>

      {/* Privacy & Data */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔒 Your Privacy</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Data Stays Private</Text>
          <Text style={styles.cardText}>
            • Your contact list stays on your device
            {'\n'}• Only you can see your interaction logs
            {'\n'}• We don't share your family information
            {'\n'}• All communication tracking is personal to you
          </Text>
        </View>
      </View>

      {/* Troubleshooting */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 Common Questions</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Why don't I see all my contacts?</Text>
          <Text style={styles.cardText}>
            Family Loop filters out spam, business numbers, and contacts without names to focus on real relationships. Family members are always included.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>How do I add someone new?</Text>
          <Text style={styles.cardText}>
            In the Chat tab, tap "+ New Chat" then "Add New Contact" to manually add someone with their phone number.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Can I delete a logged contact?</Text>
          <Text style={styles.cardText}>
            Currently, you can't delete individual logs. This ensures you maintain an accurate history of your communication patterns.
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Family Loop is designed to help you build stronger relationships with the people who matter most.
        </Text>
        <Text style={styles.footerSubtext}>
          Remember: It's not about perfect tracking, it's about staying connected.
        </Text>
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
    backgroundColor: '#3498db',
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ecf0f1',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 20,
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    color: '#34495e',
    lineHeight: 22,
  },
  highlight: {
    fontWeight: '600',
    color: '#3498db',
  },
  footer: {
    backgroundColor: '#ecf0f1',
    padding: 24,
    marginTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});