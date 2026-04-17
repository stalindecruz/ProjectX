import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import { Session } from '../types'

const SESSIONS_KEY = 'speakiq-sessions'
const API_KEY_KEY = 'speakiq-api-key'

export async function getSessions(): Promise<Session[]> {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Session[]
  } catch {
    return []
  }
}

export async function saveSession(session: Session): Promise<void> {
  const existing = await getSessions()
  const updated = [session, ...existing]
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updated))
}

export async function clearSessions(): Promise<void> {
  await AsyncStorage.removeItem(SESSIONS_KEY)
}

export async function getApiKey(): Promise<string> {
  try {
    const key = await SecureStore.getItemAsync(API_KEY_KEY)
    return key ?? ''
  } catch {
    return ''
  }
}

export async function setApiKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(API_KEY_KEY, key)
}
