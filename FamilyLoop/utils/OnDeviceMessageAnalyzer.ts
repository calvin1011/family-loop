/*

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SMS from 'expo-sms';
import { Platform } from 'react-native';

interface Message {
  id: string;
  contactId: string;
  text: string;
  timestamp: Date;
  isFromMe: boolean;
}

interface ConversationInsight {
  contactId: string;
  contactName: string;
  lastContactDate: Date;
  messageFrequency: number; // messages per week
  averageResponseTime: number; // hours
  topics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  ongoingThreads: string[]; // "waiting for doctor results", "planning vacation"
  suggestedFollowUp?: string;
}

interface RelationshipHealth {
  contactId: string;
  score: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
  lastContactDays: number;
  communicationConsistency: number; // 0-1, how regular is contact
  reason: string;
}

export class OnDeviceMessageAnalyzer {
  private encryptionKey: string = ''; // Should be device-specific

  constructor() {
    this.initializeEncryption();
  }

  private async initializeEncryption() {
    // Use device-specific key for encryption
    // In production, use Expo SecureStore or similar
    const key = await AsyncStorage.getItem('encryption_key');
    if (!key) {
      // Generate and store new key
      const newKey = this.generateEncryptionKey();
      await AsyncStorage.setItem('encryption_key', newKey);
      this.encryptionKey = newKey;
    } else {
      this.encryptionKey = key;
    }
  }

  private generateEncryptionKey(): string {
    // Simple key generation - use crypto library in production
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  /!**
   * Read messages from device (platform-specific)
   * This would need native module implementation for full access
   *!/
  async getMessagesForContact(contactId: string): Promise<Message[]> {
    // Platform-specific message reading
    // iOS: Would need to use Messages framework (private API, App Store limitations)
    // Android: Can access SMS database with permissions

    if (Platform.OS === 'android') {
      return this.getAndroidMessages(contactId);
    } else {
      // iOS has limitations - would need to prompt user to forward messages
      // or use iMessage app extension
      return [];
    }
  }

  private async getAndroidMessages(contactId: string): Promise<Message[]> {
    // Placeholder - would use native module to query SMS database
    // Example of what it would look like:
    /!*
    const messages = await NativeModules.SMSReader.readMessages({
      contactId: contactId,
      limit: 100,
      orderBy: 'date DESC'
    });
    return messages;
    *!/
    return [];
  }

  /!**
   * Extract topics from messages using simple NLP
   * No external API calls - all on device
   *!/
  private extractTopics(messages: Message[]): string[] {
    const topics = new Set<string>();

    // Common topic keywords (would expand this significantly)
    const topicPatterns = {
      'health': ['doctor', 'hospital', 'sick', 'medicine', 'appointment', 'health'],
      'work': ['job', 'work', 'office', 'boss', 'career', 'interview', 'meeting'],
      'family': ['kids', 'children', 'baby', 'pregnancy', 'school'],
      'travel': ['vacation', 'trip', 'travel', 'flight', 'hotel'],
      'food': ['dinner', 'lunch', 'restaurant', 'cooking', 'recipe'],
      'events': ['birthday', 'wedding', 'party', 'celebration', 'anniversary'],
      'hobbies': ['movie', 'book', 'game', 'sport', 'hobby', 'reading'],
      'finance': ['money', 'pay', 'bills', 'rent', 'mortgage', 'loan']
    };

    messages.forEach(message => {
      const text = message.text.toLowerCase();

      Object.entries(topicPatterns).forEach(([topic, keywords]) => {
        if (keywords.some(keyword => text.includes(keyword))) {
          topics.add(topic);
        }
      });
    });

    return Array.from(topics);
  }

  /!**
   * Detect ongoing conversation threads that need follow-up
   *!/
  private detectOngoingThreads(messages: Message[]): string[] {
    const threads: string[] = [];

    // Look for question patterns in recent messages from them
    const recentIncoming = messages
      .filter(m => !m.isFromMe)
      .slice(0, 10);

    recentIncoming.forEach(message => {
      const text = message.text.toLowerCase();

      // Detect questions that might need follow-up
      if (text.includes('?')) {
        // Extract context around question
        const words = text.split(' ');
        if (words.length > 3) {
          threads.push(words.slice(0, 5).join(' ') + '...');
        }
      }

      // Detect statements about future events
      const futurePatterns = [
        'will be', 'going to', 'planning to', 'scheduled',
        'waiting for', 'expecting', 'hoping to'
      ];

      futurePatterns.forEach(pattern => {
        if (text.includes(pattern)) {
          const index = text.indexOf(pattern);
          const context = text.substring(Math.max(0, index - 20), index + 40);
          threads.push(context.trim());
        }
      });
    });

    return threads.slice(0, 3); // Return top 3 threads
  }

  /!**
   * Calculate relationship health score
   *!/
  async calculateRelationshipHealth(contactId: string, contactName: string): Promise<RelationshipHealth> {
    const messages = await this.getMessagesForContact(contactId);

    if (messages.length === 0) {
      return {
        contactId,
        score: 0,
        trend: 'stable',
        lastContactDays: 999,
        communicationConsistency: 0,
        reason: 'No message history available'
      };
    }

    // Calculate metrics
    const now = new Date();
    const sortedMessages = messages.sort((a, b) =>
      b.timestamp.getTime() - a.timestamp.getTime()
    );

    const lastMessage = sortedMessages[0];
    const lastContactDays = Math.floor(
      (now.getTime() - lastMessage.timestamp.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate message frequency (messages per week over last 3 months)
    const threeMonthsAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
    const recentMessages = messages.filter(m => m.timestamp > threeMonthsAgo);
    const messageFrequency = (recentMessages.length / 12); // per week

    // Calculate consistency (how regular is communication)
    const consistency = this.calculateConsistency(messages);

    // Calculate score (0-100)
    let score = 100;

    // Penalty for time since last contact
    if (lastContactDays > 30) score -= 20;
    if (lastContactDays > 60) score -= 20;
    if (lastContactDays > 90) score -= 20;

    // Bonus for frequency
    if (messageFrequency > 3) score += 10;

    // Bonus for consistency
    score += consistency * 20;

    score = Math.max(0, Math.min(100, score));

    // Determine trend
    const recentScore = this.calculatePeriodScore(messages, 30);
    const previousScore = this.calculatePeriodScore(messages, 60, 30);

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentScore > previousScore + 10) trend = 'improving';
    if (recentScore < previousScore - 10) trend = 'declining';

    // Generate reason
    let reason = '';
    if (score > 80) reason = 'Strong, consistent communication';
    else if (score > 60) reason = 'Regular contact, could improve';
    else if (score > 40) reason = 'Infrequent contact';
    else reason = 'Relationship needs attention';

    return {
      contactId,
      score,
      trend,
      lastContactDays,
      communicationConsistency: consistency,
      reason
    };
  }

  /!**
   * Calculate how consistent communication is (0-1)
   *!/
  private calculateConsistency(messages: Message[]): number {
    if (messages.length < 2) return 0;

    // Calculate gaps between messages
    const gaps: number[] = [];
    for (let i = 0; i < messages.length - 1; i++) {
      const gap = messages[i].timestamp.getTime() - messages[i + 1].timestamp.getTime();
      gaps.push(gap / (1000 * 60 * 60 * 24)); // Convert to days
    }

    // Calculate standard deviation of gaps
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const variance = gaps.reduce((acc, gap) => acc + Math.pow(gap - mean, 2), 0) / gaps.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation = more consistent
    // Normalize to 0-1 scale (assuming 30 days as max reasonable stdDev)
    const consistency = Math.max(0, 1 - (stdDev / 30));

    return consistency;
  }

  /!**
   * Calculate score for a specific time period
   *!/
  private calculatePeriodScore(messages: Message[], days: number, offsetDays: number = 0): number {
    const now = new Date();
    const periodStart = new Date(now.getTime() - ((days + offsetDays) * 24 * 60 * 60 * 1000));
    const periodEnd = new Date(now.getTime() - (offsetDays * 24 * 60 * 60 * 1000));

    const periodMessages = messages.filter(m =>
      m.timestamp >= periodStart && m.timestamp <= periodEnd
    );

    // Simple scoring: more messages = higher score
    return Math.min(100, periodMessages.length * 5);
  }

  /!**
   * Generate conversation insights for a contact
   *!/
  async generateInsights(contactId: string, contactName: string): Promise<ConversationInsight> {
    const messages = await this.getMessagesForContact(contactId);

    if (messages.length === 0) {
      return {
        contactId,
        contactName,
        lastContactDate: new Date(0),
        messageFrequency: 0,
        averageResponseTime: 0,
        topics: [],
        sentiment: 'neutral',
        ongoingThreads: [],
        suggestedFollowUp: 'Start a conversation!'
      };
    }

    const topics = this.extractTopics(messages);
    const ongoingThreads = this.detectOngoingThreads(messages);
    const lastContactDate = messages[0].timestamp;

    // Calculate message frequency (per week)
    const oneWeekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
    const weekMessages = messages.filter(m => m.timestamp > oneWeekAgo);
    const messageFrequency = weekMessages.length;

    // Calculate average response time
    const responseTimes: number[] = [];
    for (let i = 0; i < messages.length - 1; i++) {
      if (!messages[i].isFromMe && messages[i + 1].isFromMe) {
        const responseTime = messages[i + 1].timestamp.getTime() - messages[i].timestamp.getTime();
        responseTimes.push(responseTime / (1000 * 60 * 60)); // Convert to hours
      }
    }
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    // Simple sentiment analysis
    const sentiment = this.analyzeSentiment(messages);

    // Generate follow-up suggestion
    const suggestedFollowUp = this.generateFollowUpSuggestion(
      messages,
      topics,
      ongoingThreads
    );

    return {
      contactId,
      contactName,
      lastContactDate,
      messageFrequency,
      averageResponseTime,
      topics,
      sentiment,
      ongoingThreads,
      suggestedFollowUp
    };
  }

  /!**
   * Simple sentiment analysis based on keywords
   *!/
  private analyzeSentiment(messages: Message[]): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['good', 'great', 'happy', 'love', 'thanks', 'awesome', 'excited'];
    const negativeWords = ['bad', 'sad', 'sorry', 'sick', 'problem', 'worried', 'upset'];

    let positiveCount = 0;
    let negativeCount = 0;

    messages.slice(0, 20).forEach(message => {
      const text = message.text.toLowerCase();
      positiveWords.forEach(word => {
        if (text.includes(word)) positiveCount++;
      });
      negativeWords.forEach(word => {
        if (text.includes(word)) negativeCount++;
      });
    });

    if (positiveCount > negativeCount * 1.5) return 'positive';
    if (negativeCount > positiveCount * 1.5) return 'negative';
    return 'neutral';
  }

  /!**
   * Generate intelligent follow-up suggestion
   *!/
  private generateFollowUpSuggestion(
    messages: Message[],
    topics: string[],
    ongoingThreads: string[]
  ): string {
    // If there are ongoing threads, suggest following up
    if (ongoingThreads.length > 0) {
      const thread = ongoingThreads[0];
      return `Follow up on: "${thread}"`;
    }

    // If there are recent topics, suggest discussing them
    if (topics.length > 0) {
      const topic = topics[0];
      return `Ask about ${topic}`;
    }

    // Check time since last contact
    const lastMessage = messages[0];
    const daysSince = Math.floor(
      (Date.now() - lastMessage.timestamp.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSince > 30) {
      return 'It's been a while - check in!';
    } else if (daysSince > 7) {
      return 'Catch up this week';
    }

    return 'Send a quick message';
  }

  /!**
   * Encrypt and store insights locally
   *!/
  async storeInsights(contactId: string, insights: ConversationInsight) {
    try {
      // In production, encrypt this data before storing
      const key = `insights_${contactId}`;
      await AsyncStorage.setItem(key, JSON.stringify(insights));
    } catch (error) {
      console.error('Failed to store insights:', error);
    }
  }

  /!**
   * Retrieve stored insights
   *!/
  async getStoredInsights(contactId: string): Promise<ConversationInsight | null> {
    try {
      const key = `insights_${contactId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to retrieve insights:', error);
      return null;
    }
  }

  /!**
   * Delete all data for a contact (privacy feature)
   *!/
  async deleteContactData(contactId: string) {
    try {
      await AsyncStorage.removeItem(`insights_${contactId}`);
      // Delete any other stored data for this contact
    } catch (error) {
      console.error('Failed to delete contact data:', error);
    }
  }

  /!**
   * Delete ALL stored data (nuclear option for privacy)
   *!/
  async deleteAllData() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const insightKeys = keys.filter(key => key.startsWith('insights_'));
      await AsyncStorage.multiRemove(insightKeys);
    } catch (error) {
      console.error('Failed to delete all data:', error);
    }
  }
}

// Export singleton instance
export const messageAnalyzer = new OnDeviceMessageAnalyzer();*/
