import { supabase } from '@/lib/supabase';
import type { Interaction, InteractionType, InteractionDirection } from '@/types';

export async function fetchInteractions(userId: string): Promise<Interaction[]> {
  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('user_id', userId)
    .order('occurred_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchInteractionsForContact(
  userId: string,
  contactId: string
): Promise<Interaction[]> {
  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('user_id', userId)
    .eq('contact_id', contactId)
    .order('occurred_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createInteraction(params: {
  userId: string;
  contactId: string;
  type: InteractionType;
  occurredAt: string;
  direction?: InteractionDirection;
  durationSeconds?: number;
  note?: string;
  autoDetected?: boolean;
}): Promise<Interaction> {
  const { data, error } = await supabase
    .from('interactions')
    .insert({
      user_id: params.userId,
      contact_id: params.contactId,
      type: params.type,
      occurred_at: params.occurredAt,
      direction: params.direction ?? null,
      duration_seconds: params.durationSeconds ?? null,
      note: params.note ?? null,
      auto_detected: params.autoDetected ?? false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteInteraction(interactionId: string): Promise<void> {
  const { error } = await supabase
    .from('interactions')
    .delete()
    .eq('id', interactionId);

  if (error) throw error;
}

export async function bulkCreateInteractions(
  rows: Array<{
    user_id: string;
    contact_id: string;
    type: InteractionType;
    occurred_at: string;
    direction?: InteractionDirection | null;
    duration_seconds?: number | null;
    note?: string | null;
    auto_detected?: boolean;
  }>
): Promise<Interaction[]> {
  const { data, error } = await supabase
    .from('interactions')
    .insert(rows)
    .select();

  if (error) throw error;
  return data ?? [];
}
