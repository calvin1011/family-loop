
interface Interaction {
  id: string;
  contactId: string;
  type: 'call' | 'text' | 'in-person' | 'video-call' | 'other';
  date: Date;
  note?: string;
}

interface Contact {
  id: string;
  name?: string;
  relationship?: string;
  group?: string;
}

export interface RelationshipInsight {
  contactId: string;
  contactName: string;
  score: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
  lastContactDays: number;
  totalInteractions: number;
  averageDaysBetween: number;
  suggestedAction: string;
  reason: string;
}

export class RelationshipAnalyzer {

  /**
   * Calculate relationship health score based on your existing interaction logs
   */
  calculateInsight(
    contact: Contact,
    allInteractions: Interaction[]
  ): RelationshipInsight {

    // Get all interactions for this contact
    const contactInteractions = allInteractions
      .filter(i => i.contactId === contact.id)
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    // If no interactions, return default
    if (contactInteractions.length === 0) {
      return {
        contactId: contact.id,
        contactName: contact.name || 'Unknown',
        score: 0,
        trend: 'stable',
        lastContactDays: 999,
        totalInteractions: 0,
        averageDaysBetween: 0,
        suggestedAction: 'Start tracking your interactions!',
        reason: 'No interactions logged yet'
      };
    }

    // Calculate days since last contact
    const lastInteraction = contactInteractions[0];
    const now = new Date();
    const lastContactDays = Math.floor(
      (now.getTime() - lastInteraction.date.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate average days between interactions
    let totalDaysBetween = 0;
    for (let i = 0; i < contactInteractions.length - 1; i++) {
      const daysDiff = Math.floor(
        (contactInteractions[i].date.getTime() - contactInteractions[i + 1].date.getTime())
        / (1000 * 60 * 60 * 24)
      );
      totalDaysBetween += daysDiff;
    }
    const averageDaysBetween = contactInteractions.length > 1
      ? totalDaysBetween / (contactInteractions.length - 1)
      : 0;

    // Calculate health score (0-100)
    let score = 100;

    // Penalty based on days since last contact
    if (lastContactDays > 7) score -= 10;
    if (lastContactDays > 14) score -= 15;
    if (lastContactDays > 30) score -= 20;
    if (lastContactDays > 60) score -= 25;

    // Bonus for total interactions
    if (contactInteractions.length > 10) score += 10;
    if (contactInteractions.length > 20) score += 5;

    // Bonus for consistency
    if (averageDaysBetween > 0 && averageDaysBetween < 7) score += 10;

    score = Math.max(0, Math.min(100, score));

    // Calculate trend (comparing recent vs older interactions)
    const trend = this.calculateTrend(contactInteractions);

    // Generate suggested action
    const suggestedAction = this.generateSuggestion(
      lastContactDays,
      averageDaysBetween,
      contact
    );

    // Generate reason text
    const reason = this.generateReason(score, lastContactDays, contactInteractions.length);

    return {
      contactId: contact.id,
      contactName: contact.name || 'Unknown',
      score,
      trend,
      lastContactDays,
      totalInteractions: contactInteractions.length,
      averageDaysBetween,
      suggestedAction,
      reason
    };
  }

  /**
   * Calculate if relationship is improving, stable, or declining
   */
  private calculateTrend(interactions: Interaction[]): 'improving' | 'stable' | 'declining' {
    if (interactions.length < 4) return 'stable';

    // Compare recent interactions (last 30 days) vs previous period
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    const sixtyDaysAgo = new Date(Date.now() - (60 * 24 * 60 * 60 * 1000));

    const recentCount = interactions.filter(i => i.date > thirtyDaysAgo).length;
    const previousCount = interactions.filter(i =>
      i.date > sixtyDaysAgo && i.date <= thirtyDaysAgo
    ).length;

    if (recentCount > previousCount * 1.2) return 'improving';
    if (recentCount < previousCount * 0.8) return 'declining';
    return 'stable';
  }

  /**
   * Generate smart suggestion based on interaction patterns
   */
  private generateSuggestion(
    daysSince: number,
    avgDays: number,
    contact: Contact
  ): string {
    const name = contact.name || 'them';

    // If it's been longer than usual
    if (avgDays > 0 && daysSince > avgDays * 1.5) {
      return `You usually contact ${name} every ${Math.round(avgDays)} days. It's been ${daysSince} days - reach out soon!`;
    }

    // Based on relationship type
    if (contact.relationship === 'Mother' || contact.relationship === 'Father') {
      if (daysSince > 7) return `Call ${name} - it's been ${daysSince} days`;
      return `Send ${name} a quick message`;
    }

    if (contact.relationship === 'Sister' || contact.relationship === 'Brother') {
      if (daysSince > 14) return `Check in with ${name}`;
      return `Catch up with ${name} soon`;
    }

    // Generic suggestions
    if (daysSince > 30) return `It's been a while - reconnect with ${name}`;
    if (daysSince > 14) return `Send a quick message to ${name}`;
    if (daysSince > 7) return `Time to catch up with ${name}`;

    return `Keep the momentum going with ${name}`;
  }

  /**
   * Generate explanation for the score
   */
  private generateReason(score: number, daysSince: number, totalInteractions: number): string {
    if (score >= 80) {
      return `Strong relationship - regular contact (${totalInteractions} interactions logged)`;
    }
    if (score >= 60) {
      return `Good contact frequency, keep it up!`;
    }
    if (score >= 40) {
      return `Could use more regular contact`;
    }
    if (daysSince > 60) {
      return `Haven't connected in ${daysSince} days - time to reach out`;
    }
    return `Relationship needs attention`;
  }

  /**
   * Get contacts that need attention (sorted by priority)
   */
  getContactsNeedingAttention(
    contacts: Contact[],
    allInteractions: Interaction[],
    limit: number = 5
  ): RelationshipInsight[] {

    const insights = contacts.map(contact =>
      this.calculateInsight(contact, allInteractions)
    );

    // Sort by priority (low score or long time since contact)
    return insights
      .filter(insight => insight.score < 70 || insight.lastContactDays > 14)
      .sort((a, b) => {
        // Prioritize by combination of low score and time since contact
        const aPriority = (100 - a.score) + (a.lastContactDays * 0.5);
        const bPriority = (100 - b.score) + (b.lastContactDays * 0.5);
        return bPriority - aPriority;
      })
      .slice(0, limit);
  }

  /**
   * Get overall relationship health summary
   */
  getHealthSummary(contacts: Contact[], allInteractions: Interaction[]) {
    const insights = contacts.map(contact =>
      this.calculateInsight(contact, allInteractions)
    );

    const totalContacts = insights.length;
    const strongRelationships = insights.filter(i => i.score >= 80).length;
    const needsAttention = insights.filter(i => i.score < 50).length;
    const averageScore = insights.reduce((sum, i) => sum + i.score, 0) / totalContacts || 0;

    return {
      totalContacts,
      strongRelationships,
      needsAttention,
      averageScore: Math.round(averageScore),
      improving: insights.filter(i => i.trend === 'improving').length,
      declining: insights.filter(i => i.trend === 'declining').length
    };
  }
}

// Export singleton instance
export const relationshipAnalyzer = new RelationshipAnalyzer();