import { supabase } from '@/lib/supabase';
import type { FamilyEvent, FamilyEventType } from '@/types';

export async function fetchEvents(userId: string): Promise<FamilyEvent[]> {
  const { data, error } = await supabase
    .from('family_events')
    .select('*')
    .eq('user_id', userId)
    .order('event_date');

  if (error) throw error;
  return data ?? [];
}

export async function createEvent(params: {
  userId: string;
  contactId?: string;
  type: FamilyEventType;
  title: string;
  eventDate: string;
  isRecurring?: boolean;
  reminderDays?: number[];
  notes?: string;
}): Promise<FamilyEvent> {
  const { data, error } = await supabase
    .from('family_events')
    .insert({
      user_id: params.userId,
      contact_id: params.contactId ?? null,
      type: params.type,
      title: params.title,
      event_date: params.eventDate,
      is_recurring: params.isRecurring ?? true,
      reminder_days: params.reminderDays ?? [1],
      notes: params.notes ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateEvent(
  eventId: string,
  updates: Partial<{
    title: string;
    event_date: string;
    is_recurring: boolean;
    reminder_days: number[];
    notes: string | null;
    last_wished_at: string | null;
    is_active: boolean;
  }>
): Promise<FamilyEvent> {
  const { data, error } = await supabase
    .from('family_events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('family_events')
    .delete()
    .eq('id', eventId);

  if (error) throw error;
}

export async function markEventWished(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('family_events')
    .update({ last_wished_at: new Date().toISOString() })
    .eq('id', eventId);

  if (error) throw error;
}
