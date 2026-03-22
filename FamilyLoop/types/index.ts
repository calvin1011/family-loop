// ============================================================================
// Shared TypeScript interfaces for the entire app
// ============================================================================

// ---- Auth / Profile ----

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  timezone: string | null;
  notification_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  provider?: string | null;
}

// ---- Contacts ----

export interface TrackedContact {
  id: string;
  user_id: string;
  device_contact_id: string | null;
  name: string;
  phone_number: string | null;
  relationship: string | null;
  group_label: string | null;
  created_at: string;
}

export interface DeviceContact {
  id: string;
  name?: string;
  phoneNumbers?: Array<{ number: string }>;
  relationship?: string;
  group?: string;
  lastInteraction?: Date;
  interactionType?: InteractionType;
  interactionNote?: string;
  daysSinceContact?: number;
}

export interface GroupedContacts {
  [groupName: string]: DeviceContact[];
}

// ---- Interactions ----

export type InteractionType = 'call' | 'text' | 'in-person' | 'video-call' | 'other';
export type InteractionDirection = 'outgoing' | 'incoming' | 'both';

export interface Interaction {
  id: string;
  user_id: string;
  contact_id: string;
  type: InteractionType;
  direction: InteractionDirection | null;
  duration_seconds: number | null;
  note: string | null;
  auto_detected: boolean;
  occurred_at: string;
  created_at: string;
}

export interface LocalInteraction {
  id: string;
  contactId: string;
  type: InteractionType;
  date: Date;
  note?: string;
}

// ---- Communication Goals ----

export type GoalFrequency = 'daily' | 'every-2-days' | 'every-3-days' | 'weekly' | 'bi-weekly' | 'monthly';
export type GoalMethod = 'call' | 'text' | 'any';

export interface CommunicationGoal {
  id: string;
  user_id: string;
  contact_id: string;
  frequency_days: number;
  frequency_label: string;
  method: GoalMethod;
  custom_note: string | null;
  is_active: boolean;
  created_at: string;
}

export interface LocalCommunicationGoal {
  id: string;
  contactId: string;
  contactName: string;
  frequency: GoalFrequency;
  frequencyDays: number;
  method: GoalMethod;
  isActive: boolean;
  lastContacted?: Date;
  nextDue?: Date;
  customNote?: string;
}

// ---- Family Events ----

export type FamilyEventType = 'birthday' | 'anniversary' | 'wedding' | 'graduation' | 'custom';

export interface FamilyEvent {
  id: string;
  user_id: string;
  contact_id: string | null;
  type: FamilyEventType;
  title: string;
  event_date: string;
  is_recurring: boolean;
  reminder_days: number[];
  notes: string | null;
  last_wished_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface LocalFamilyEvent {
  id: string;
  contactId: string;
  contactName: string;
  type: FamilyEventType;
  title: string;
  date: Date;
  isRecurring: boolean;
  reminderDays: number[];
  notes?: string;
  lastWished?: Date;
  isActive: boolean;
}

// ---- Family Groups ----

export type GroupRole = 'admin' | 'member';

export interface FamilyGroup {
  id: string;
  name: string;
  created_by: string;
  invite_code: string;
  created_at: string;
}

export interface FamilyGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
}

// ---- Notifications ----

export type NotificationType =
  | 'goal_due'
  | 'goal_overdue'
  | 'event_reminder'
  | 'streak_encouragement'
  | 'inactivity_nudge';

export interface NotificationLogEntry {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  sent_at: string;
  read_at: string | null;
}

// ---- Analytics / Insights ----

export interface RelationshipInsight {
  contactId: string;
  contactName: string;
  score: number;
  trend: 'improving' | 'stable' | 'declining';
  lastContactDays: number;
  totalInteractions: number;
  averageDaysBetween: number;
  suggestedAction: string;
  reason: string;
}

export interface HealthSummary {
  totalContacts: number;
  strongRelationships: number;
  needsAttention: number;
  averageScore: number;
  improving: number;
  declining: number;
}

// ---- Auto-Detection ----

export interface DetectedInteraction {
  id: string;
  contactId: string;
  contactName: string;
  contactNumber: string;
  type: 'call' | 'text';
  date: Date;
  duration?: number;
  isOutgoing: boolean;
  autoDetected: true;
}
