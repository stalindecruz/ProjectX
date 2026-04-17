import React, { useState, useEffect } from 'react'
import {
  Modal, View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../constants/colors'
import { useAppContext } from '../context/AppContext'
import { getApiKey, setApiKey } from '../services/storageService'

interface SettingsModalProps {
  visible: boolean
  onClose: () => void
}

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { state, dispatch } = useAppContext()
  const [draftKey, setDraftKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (visible) {
      getApiKey().then(k => {
        setDraftKey(k)
        setSaved(false)
      })
    }
  }, [visible])

  async function handleSave() {
    await setApiKey(draftKey.trim())
    dispatch({ type: 'SET_API_KEY', payload: draftKey.trim() })
    setSaved(true)
    setTimeout(onClose, 600)
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Text style={styles.label}>Anthropic API Key</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={draftKey}
                onChangeText={setDraftKey}
                placeholder="sk-ant-..."
                placeholderTextColor={Colors.textLight}
                secureTextEntry={!showKey}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                fontFamily={Platform.OS === 'ios' ? 'Menlo' : 'monospace'}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowKey(v => !v)}>
                <Ionicons name={showKey ? 'eye-off' : 'eye'} size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.infoText}>
              Key stored securely on device using iOS Keychain. Never transmitted except to Anthropic.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saved && styles.saveBtnSuccess]}
            onPress={handleSave}
            disabled={saved}
          >
            <Text style={styles.saveBtnText}>{saved ? '✓ Saved' : 'Save API Key'}</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.label}>About SpeakIQ</Text>
            <Text style={styles.aboutText}>
              SpeakIQ is an AI-powered speech coaching app that analyzes your speaking style using Apple's on-device speech recognition and Anthropic's Claude AI.
              {'\n\n'}
              Version 1.0.0
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e0d8',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  closeBtn: {
    padding: 6,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e0d8',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 13,
    color: Colors.text,
  },
  eyeBtn: {
    padding: 6,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnSuccess: {
    backgroundColor: Colors.green,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e0d8',
  },
  aboutText: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
  },
})
