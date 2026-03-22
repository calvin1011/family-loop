import type { DeviceContact, LocalInteraction, RelationshipInsight, HealthSummary } from '@/types';

function calculateTrend(interactions: LocalInteraction[]): 'improving' | 'stable' | 'declining' {
  if (interactions.length < 4) return 'stable';

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const recentCount = interactions.filter((i) => i.date > thirtyDaysAgo).length;
  const previousCount = interactions.filter(
    (i) => i.date > sixtyDaysAgo && i.date <= thirtyDaysAgo
  ).length;

  if (recentCount > previousCount * 1.2) return 'improving';
  if (recentCount < previousCount * 0.8) return 'declining';
  return 'stable';
}

function generateSuggestion(daysSince: number, avgDays: number, contact: DeviceContact): string {
  const name = contact.name || 'them';

  if (avgDays > 0 && daysSince > avgDays * 1.5) {
    return `You usually contact ${name} every ${Math.round(avgDays)} days. It's been ${daysSince} days - reach out soon!`;
  }

  if (contact.relationship === 'Mother' || contact.relationship === 'Father') {
    if (daysSince > 7) return `Call ${name} - it's been ${daysSince} days`;
    return `Send ${name} a quick message`;
  }

  if (contact.relationship === 'Sister' || contact.relationship === 'Brother') {
    if (daysSince > 14) return `Check in with ${name}`;
    return `Catch up with ${name} soon`;
  }

  if (daysSince > 30) return `It's been a while - reconnect with ${name}`;
  if (daysSince > 14) return `Send a quick message to ${name}`;
  if (daysSince > 7) return `Time to catch up with ${name}`;
  return `Keep the momentum going with ${name}`;
}

function generateReason(score: number, daysSince: number, total: number): string {
  if (score >= 80) return `Strong relationship - regular contact (${total} interactions logged)`;
  if (score >= 60) return 'Good contact frequency, keep it up!';
  if (score >= 40) return 'Could use more regular contact';
  if (daysSince > 60) return `Haven't connected in ${daysSince} days - time to reach out`;
  return 'Relationship needs attention';
}

export function calculateInsight(
  contact: DeviceContact,
  allInteractions: LocalInteraction[]
): RelationshipInsight {
  const contactInteractions = allInteractions
    .filter((i) => i.contactId === contact.id)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

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
      reason: 'No interactions logged yet',
    };
  }

  const lastContactDays = Math.floor(
    (Date.now() - contactInteractions[0].date.getTime()) / (1000 * 60 * 60 * 24)
  );

  let totalDaysBetween = 0;
  for (let i = 0; i < contactInteractions.length - 1; i++) {
    totalDaysBetween += Math.floor(
      (contactInteractions[i].date.getTime() - contactInteractions[i + 1].date.getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }
  const averageDaysBetween =
    contactInteractions.length > 1 ? totalDaysBetween / (contactInteractions.length - 1) : 0;

  let score = 100;
  if (lastContactDays > 7) score -= 10;
  if (lastContactDays > 14) score -= 15;
  if (lastContactDays > 30) score -= 20;
  if (lastContactDays > 60) score -= 25;
  if (contactInteractions.length > 10) score += 10;
  if (contactInteractions.length > 20) score += 5;
  if (averageDaysBetween > 0 && averageDaysBetween < 7) score += 10;
  score = Math.max(0, Math.min(100, score));

  return {
    contactId: contact.id,
    contactName: contact.name || 'Unknown',
    score,
    trend: calculateTrend(contactInteractions),
    lastContactDays,
    totalInteractions: contactInteractions.length,
    averageDaysBetween,
    suggestedAction: generateSuggestion(lastContactDays, averageDaysBetween, contact),
    reason: generateReason(score, lastContactDays, contactInteractions.length),
  };
}

export function getContactsNeedingAttention(
  contacts: DeviceContact[],
  allInteractions: LocalInteraction[],
  limit = 5
): RelationshipInsight[] {
  return contacts
    .map((c) => calculateInsight(c, allInteractions))
    .filter((insight) => insight.score < 70 || insight.lastContactDays > 14)
    .sort((a, b) => {
      const aPriority = 100 - a.score + a.lastContactDays * 0.5;
      const bPriority = 100 - b.score + b.lastContactDays * 0.5;
      return bPriority - aPriority;
    })
    .slice(0, limit);
}

export function getHealthSummary(
  contacts: DeviceContact[],
  allInteractions: LocalInteraction[]
): HealthSummary {
  const insights = contacts.map((c) => calculateInsight(c, allInteractions));
  const total = insights.length;
  const avg = total > 0 ? insights.reduce((sum, i) => sum + i.score, 0) / total : 0;

  return {
    totalContacts: total,
    strongRelationships: insights.filter((i) => i.score >= 80).length,
    needsAttention: insights.filter((i) => i.score < 50).length,
    averageScore: Math.round(avg),
    improving: insights.filter((i) => i.trend === 'improving').length,
    declining: insights.filter((i) => i.trend === 'declining').length,
  };
}
