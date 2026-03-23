import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@familyloop/phone_otp_pending';
const MAX_AGE_MS = 15 * 60 * 1000;

export type PhoneOtpPending = {
  phoneRaw: string;
  displayName: string;
  flow: 'signup' | 'login';
  sentAt: number;
};

export async function savePhoneOtpPending(data: Omit<PhoneOtpPending, 'sentAt'>): Promise<void> {
  const payload: PhoneOtpPending = { ...data, sentAt: Date.now() };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export async function loadPhoneOtpPending(): Promise<PhoneOtpPending | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PhoneOtpPending;
    if (Date.now() - parsed.sentAt > MAX_AGE_MS) {
      await clearPhoneOtpPending();
      return null;
    }
    if (!parsed.phoneRaw?.trim()) {
      await clearPhoneOtpPending();
      return null;
    }
    return parsed;
  } catch {
    await clearPhoneOtpPending();
    return null;
  }
}

export async function clearPhoneOtpPending(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
