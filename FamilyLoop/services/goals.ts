import { supabase } from '@/lib/supabase';
import type { CommunicationGoal, GoalMethod } from '@/types';

export async function fetchGoals(userId: string): Promise<CommunicationGoal[]> {
  const { data, error } = await supabase
    .from('communication_goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createGoal(params: {
  userId: string;
  contactId: string;
  frequencyDays: number;
  frequencyLabel: string;
  method?: GoalMethod;
  customNote?: string;
}): Promise<CommunicationGoal> {
  const { data, error } = await supabase
    .from('communication_goals')
    .insert({
      user_id: params.userId,
      contact_id: params.contactId,
      frequency_days: params.frequencyDays,
      frequency_label: params.frequencyLabel,
      method: params.method ?? 'any',
      custom_note: params.customNote ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateGoal(
  goalId: string,
  updates: Partial<{
    frequency_days: number;
    frequency_label: string;
    method: GoalMethod;
    custom_note: string | null;
    is_active: boolean;
  }>
): Promise<CommunicationGoal> {
  const { data, error } = await supabase
    .from('communication_goals')
    .update(updates)
    .eq('id', goalId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGoal(goalId: string): Promise<void> {
  const { error } = await supabase
    .from('communication_goals')
    .delete()
    .eq('id', goalId);

  if (error) throw error;
}
