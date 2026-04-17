import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
  Keyboard, useWindowDimensions, ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../constants/colors'
import { useRecording } from '../hooks/useRecording'
import { buildMetrics } from '../hooks/useMetrics'
import { detectFillers } from '../hooks/useMetrics'
import { analyzeSession } from '../services/anthropicService'
import { getApiKey } from '../services/storageService'
import { useAppContext } from '../context/AppContext'
import { useSessions } from '../hooks/useSessions'
import { MicButton } from '../components/MicButton'
import { TranscriptView } from '../components/TranscriptView'
import { MetricsRow } from '../components/MetricsRow'
import { PaceBar } from '../components/PaceBar'
import { FeedbackPanel } from '../components/FeedbackPanel'
import { SettingsModal } from '../components/SettingsModal'
import { Toast } from '../components/Toast'
import { Session, CoachResult, Metrics } from '../types'

type InputMode = 'mic' | 'text'

const emptyMetrics: Metrics = { words: 0, fillers: 0, fillerPct: 0, wpm: 0, duration: 0 }

export function CoachScreen() {
  const { width } = useWindowDimensions()
  const isWide = width >= 768
  const { state, dispatch } = useAppContext()
  const { addSession } = useSessions()

  const [mode, setMode] = useState<InputMode>('mic')
  const [textInput, setTextInput] = useState('')
  const [textMetrics, setTextMetrics] = useState<Metrics>(emptyMetrics)
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [result, setResult] = useState<CoachResult | null>(null)
  const [fillerCounts, setFillerCounts] = useState<Record<string, number>>({})
  const [hasAnalyzed, setHasAnalyzed] = useState(false)

  const {
    isRecording, transcript, partialTranscript, metrics: micMetrics,
    startRecording, stopRecording, resetTranscript, permissionDenied,
  } = useRecording()

  useEffect(() => {
    getApiKey().then(k => dispatch({ type: 'SET_API_KEY', payload: k }))
  }, [])

  useEffect(() => {
    if (permissionDenied) {
      Alert.alert('Microphone Permission', 'Please grant microphone access in Settings to use voice recording.')
    }
  }, [permissionDenied])

  const activeTranscript = mode === 'mic' ? transcript : textInput
  const activeMetrics = mode === 'mic' ? micMetrics : textMetrics

  useEffect(() => {
    if (mode === 'text') {
      const m = buildMetrics(textInput, 0)
      setTextMetrics(m)
      setFillerCounts(detectFillers(textInput).counts)
    }
  }, [textInput, mode])

  useEffect(() => {
    if (mode === 'mic') {
      setFillerCounts(detectFillers(transcript).counts)
    }
  }, [transcript, mode])

  const handleMicPress = useCallback(() => {
    if (isRecording) stopRecording()
    else startRecording()
  }, [isRecording, startRecording, stopRecording])

  const handleClear = useCallback(() => {
    if (mode === 'mic') resetTranscript()
    else { setTextInput(''); setTextMetrics(emptyMetrics) }
    setResult(null)
    setHasAnalyzed(false)
    setFillerCounts({})
  }, [mode, resetTranscript])

  async function handleAnalyze() {
    const text = activeTranscript.trim()
    if (!text) return

    if (!state.apiKey) {
      dispatch({ type: 'SHOW_TOAST', payload: { message: 'Please add your Anthropic API key in Settings.', toastType: 'error' } })
      setSettingsVisible(true)
      return
    }

    dispatch({ type: 'SET_ANALYZING', payload: true })
    try {
      const coachResult = await analyzeSession(text, activeMetrics, fillerCounts, state.apiKey)
      setResult(coachResult)
      setHasAnalyzed(true)
      dispatch({ type: 'SET_RESULT', payload: coachResult })

      const session: Session = {
        id: Date.now().toString(),
        ts: new Date().toISOString(),
        score: coachResult.score,
        scoreLabel: coachResult.scoreLabel,
        words: activeMetrics.words,
        duration: activeMetrics.duration,
        wpm: activeMetrics.wpm,
        fillerPct: activeMetrics.fillerPct,
        fillerCounts,
        excerpt: text.slice(0, 120),
        tip: coachResult.tip,
        mode,
      }
      await addSession(session)
      dispatch({ type: 'SHOW_TOAST', payload: { message: 'Analysis complete! Session saved.', toastType: 'success' } })
    } catch (err: any) {
      dispatch({ type: 'SHOW_TOAST', payload: { message: err.message ?? 'Analysis failed. Please try again.', toastType: 'error' } })
    } finally {
      dispatch({ type: 'SET_ANALYZING', payload: false })
    }
  }

  const canAnalyze = activeTranscript.trim().length > 0 && !state.isAnalyzing

  const leftPanel = (
    <View style={[styles.leftPanel, isWide && styles.leftPanelWide]}>
      {/* Mode toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'mic' && styles.modeBtnActive]}
          onPress={() => { setMode('mic'); setResult(null); setHasAnalyzed(false) }}
        >
          <Ionicons name="mic" size={14} color={mode === 'mic' ? '#fff' : Colors.textLight} />
          <Text style={[styles.modeBtnText, mode === 'mic' && styles.modeBtnTextActive]}>Microphone</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'text' && styles.modeBtnActive]}
          onPress={() => { setMode('text'); if (isRecording) stopRecording(); setResult(null); setHasAnalyzed(false) }}
        >
          <Ionicons name="create" size={14} color={mode === 'text' ? '#fff' : Colors.textLight} />
          <Text style={[styles.modeBtnText, mode === 'text' && styles.modeBtnTextActive]}>Type / Paste</Text>
        </TouchableOpacity>
      </View>

      {/* Mic mode content */}
      {mode === 'mic' && (
        <View style={styles.micArea}>
          <MicButton isRecording={isRecording} onPress={handleMicPress} />
          <Text style={styles.statusText}>
            {isRecording ? 'Recording... tap to stop' : 'Tap to start recording'}
          </Text>
          {/* Waveform animation placeholder */}
          {isRecording && (
            <View style={styles.waveform}>
              {Array.from({ length: 12 }).map((_, i) => (
                <View key={i} style={[styles.waveBar, { height: 8 + (i % 3) * 10 }]} />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Text mode content */}
      {mode === 'text' && (
        <TextInput
          style={styles.textArea}
          multiline
          value={textInput}
          onChangeText={setTextInput}
          placeholder="Paste or type your speech here..."
          placeholderTextColor={Colors.textLight}
          textAlignVertical="top"
        />
      )}

      {/* Metrics */}
      <MetricsRow metrics={activeMetrics} />

      {/* Pace bar */}
      <View style={styles.paceSection}>
        <PaceBar wpm={activeMetrics.wpm} />
      </View>

      {/* Transcript */}
      {mode === 'mic' && (
        <View style={styles.transcriptSection}>
          <TranscriptView
            transcript={transcript}
            partialTranscript={partialTranscript}
            onClear={handleClear}
          />
        </View>
      )}
    </View>
  )

  const rightPanel = (
    <View style={[styles.rightPanel, isWide && styles.rightPanelWide]}>
      <TouchableOpacity
        style={[styles.analyzeBtn, !canAnalyze && styles.analyzeBtnDisabled]}
        onPress={handleAnalyze}
        disabled={!canAnalyze}
        activeOpacity={0.85}
      >
        {state.isAnalyzing ? (
          <>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.analyzeBtnText}>Analyzing...</Text>
          </>
        ) : (
          <>
            <Ionicons name="search" size={16} color={canAnalyze ? '#fff' : Colors.textLight} />
            <Text style={[styles.analyzeBtnText, !canAnalyze && styles.analyzeBtnTextDisabled]}>
              {hasAnalyzed ? 'Re-analyze' : 'Analyze with AI'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {result ? (
        <FeedbackPanel result={result} fillerCounts={fillerCounts} />
      ) : (
        <View style={styles.emptyFeedback}>
          <Ionicons name="chatbubble-ellipses-outline" size={40} color={Colors.textLight} />
          <Text style={styles.emptyFeedbackTitle}>Ready to Coach</Text>
          <Text style={styles.emptyFeedbackText}>
            {mode === 'mic'
              ? 'Record your speech then tap "Analyze with AI" to receive detailed coaching feedback.'
              : 'Type or paste your speech, then tap "Analyze with AI" to get coaching.'}
          </Text>
        </View>
      )}
    </View>
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.navBar}>
        <Text style={styles.navTitle}>SpeakIQ</Text>
        <TouchableOpacity style={styles.gearBtn} onPress={() => setSettingsVisible(true)}>
          <Ionicons name="settings-outline" size={22} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {isWide ? (
            <View style={styles.wideLayout}>
              <ScrollView style={styles.leftScroll} contentContainerStyle={styles.leftScrollContent} showsVerticalScrollIndicator={false}>
                {leftPanel}
              </ScrollView>
              <ScrollView style={styles.rightScroll} contentContainerStyle={styles.rightScrollContent} showsVerticalScrollIndicator={false}>
                {rightPanel}
              </ScrollView>
            </View>
          ) : (
            <ScrollView style={styles.flex} contentContainerStyle={styles.singleColumn} showsVerticalScrollIndicator={false}>
              {leftPanel}
              {rightPanel}
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
      <Toast />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  flex: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e0d8',
  },
  navTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: -0.5,
  },
  gearBtn: {
    padding: 6,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wideLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  leftScroll: {
    flex: 0.45,
    backgroundColor: Colors.panel,
  },
  leftScrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  rightScroll: {
    flex: 0.55,
  },
  rightScrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  singleColumn: {
    flexGrow: 1,
  },
  leftPanel: {
    backgroundColor: Colors.panel,
    gap: 16,
    flex: 1,
  },
  leftPanelWide: {
    paddingBottom: 32,
  },
  rightPanel: {
    padding: 16,
    gap: 12,
  },
  rightPanelWide: {
    padding: 0,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.panelSurface,
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnActive: {
    backgroundColor: Colors.accent,
  },
  modeBtnText: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '600',
  },
  modeBtnTextActive: {
    color: '#fff',
  },
  micArea: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  statusText: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '500',
  },
  waveform: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    height: 32,
  },
  waveBar: {
    width: 3,
    backgroundColor: Colors.accent,
    borderRadius: 2,
    opacity: 0.7,
  },
  textArea: {
    backgroundColor: Colors.panelSurface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.panelBorder,
    padding: 12,
    color: '#e8e4df',
    fontSize: 14,
    lineHeight: 22,
    minHeight: 140,
    maxHeight: 220,
  },
  paceSection: {
    gap: 6,
  },
  transcriptSection: {
    flex: 1,
    minHeight: 120,
  },
  analyzeBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  analyzeBtnDisabled: {
    backgroundColor: Colors.panelBorder,
  },
  analyzeBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  analyzeBtnTextDisabled: {
    color: Colors.textLight,
  },
  emptyFeedback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyFeedbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyFeedbackText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
})
