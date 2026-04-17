import { useState, useEffect, useRef, useCallback } from 'react'
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice'
import { Audio } from 'expo-av'
import { buildMetrics } from './useMetrics'
import { Metrics } from '../types'

interface RecordingState {
  isRecording: boolean
  transcript: string
  partialTranscript: string
  metrics: Metrics
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  resetTranscript: () => void
  permissionDenied: boolean
}

const emptyMetrics: Metrics = { words: 0, fillers: 0, fillerPct: 0, wpm: 0, duration: 0 }

export function useRecording(): RecordingState {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [partialTranscript, setPartialTranscript] = useState('')
  const [metrics, setMetrics] = useState<Metrics>(emptyMetrics)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const finalTranscriptRef = useRef('')
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedRef = useRef(0)

  useEffect(() => {
    Voice.onSpeechStart = () => setIsRecording(true)
    Voice.onSpeechEnd = () => finalizeRecording()
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      const result = e.value?.[0] ?? ''
      finalTranscriptRef.current = result
      setTranscript(result)
      const secs = (Date.now() - startTimeRef.current) / 1000
      setMetrics(buildMetrics(result, secs))
    }
    Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
      setPartialTranscript(e.value?.[0] ?? '')
    }
    Voice.onSpeechError = (_e: SpeechErrorEvent) => {
      setIsRecording(false)
      clearInterval(timerRef.current ?? undefined)
    }

    return () => {
      Voice.destroy().then(() => Voice.removeAllListeners())
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const finalizeRecording = useCallback(() => {
    setIsRecording(false)
    setPartialTranscript('')
    if (timerRef.current) clearInterval(timerRef.current)
    const secs = elapsedRef.current
    setMetrics(buildMetrics(finalTranscriptRef.current, secs))
  }, [])

  const startRecording = useCallback(async () => {
    const { granted } = await Audio.requestPermissionsAsync()
    if (!granted) {
      setPermissionDenied(true)
      return
    }

    try {
      finalTranscriptRef.current = ''
      elapsedRef.current = 0
      setTranscript('')
      setPartialTranscript('')
      setMetrics(emptyMetrics)
      startTimeRef.current = Date.now()

      timerRef.current = setInterval(() => {
        elapsedRef.current = (Date.now() - startTimeRef.current) / 1000
        setMetrics(buildMetrics(finalTranscriptRef.current, elapsedRef.current))
      }, 500)

      await Voice.start('en-US')
    } catch (e) {
      if (timerRef.current) clearInterval(timerRef.current)
      setIsRecording(false)
    }
  }, [])

  const stopRecording = useCallback(async () => {
    try {
      await Voice.stop()
    } catch {
      finalizeRecording()
    }
  }, [finalizeRecording])

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = ''
    setTranscript('')
    setPartialTranscript('')
    setMetrics(emptyMetrics)
    elapsedRef.current = 0
  }, [])

  return {
    isRecording,
    transcript,
    partialTranscript,
    metrics,
    startRecording,
    stopRecording,
    resetTranscript,
    permissionDenied,
  }
}
