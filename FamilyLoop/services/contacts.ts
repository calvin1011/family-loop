import { supabase } from '@/lib/supabase';
import type { TrackedContact } from '@/types';

export async function fetchTrackedContacts(userId: string): Promise<TrackedContact[]> {
  const { data, error } = await supabase
    .from('tracked_contacts')
    .select('*')
    .eq('user_id', userId)
    .order('name');

  if (error) throw error;
  return data ?? [];
}

export async function upsertTrackedContact(params: {
  userId: string;
  deviceContactId: string;
  name: string;
  phoneNumber?: string | null;
  relationship?: string | null;
  groupLabel?: string | null;
}): Promise<TrackedContact> {
  const { data, error } = await supabase
    .from('tracked_contacts')
    .upsert(
      {
        user_id: params.userId,
        device_contact_id: params.deviceContactId,
        name: params.name,
        phone_number: params.phoneNumber ?? null,
        relationship: params.relationship ?? null,
        group_label: params.groupLabel ?? null,
      },
      { onConflict: 'user_id,device_contact_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function bulkUpsertTrackedContacts(
  rows: Array<{
    user_id: string;
    device_contact_id: string;
    name: string;
    phone_number?: string | null;
    relationship?: string | null;
    group_label?: string | null;
  }>
): Promise<TrackedContact[]> {
  const { data, error } = await supabase
    .from('tracked_contacts')
    .upsert(rows, { onConflict: 'user_id,device_contact_id' })
    .select();

  if (error) throw error;
  return data ?? [];
}

export async function deleteTrackedContact(contactId: string): Promise<void> {
  const { error } = await supabase
    .from('tracked_contacts')
    .delete()
    .eq('id', contactId);

  if (error) throw error;
}
