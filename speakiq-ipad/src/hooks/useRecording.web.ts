import { useState, useRef, useCallback, useEffect } from 'react'
import { buildMetrics } from './useMetrics'
import { Metrics } from '../types'

const emptyMetrics: Metrics = { words: 0, fillers: 0, fillerPct: 0, wpm: 0, duration: 0 }

export function useRecording() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [partialTranscript, setPartialTranscript] = useState('')
  const [metrics, setMetrics] = useState<Metrics>(emptyMetrics)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const recognitionRef = useRef<any>(null)
  const finalTranscriptRef = useRef('')
  const startTimeRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedRef = useRef(0)
  const shouldContinueRef = useRef(false)

  useEffect(() => {
    return () => {
      shouldContinueRef.current = false
      recognitionRef.current?.stop()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startRecording = useCallback(async () => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      alert('Speech recognition is not supported. Please use Chrome, Edge, or Safari.')
      return
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setPermissionDenied(true)
      return
    }

    finalTranscriptRef.current = ''
    elapsedRef.current = 0
    shouldContinueRef.current = true
    setTranscript('')
    setPartialTranscript('')
    setMetrics(emptyMetrics)
    startTimeRef.current = Date.now()

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognitionRef.current = recognition

    recognition.onstart = () => setIsRecording(true)

    recognition.onresult = (e: any) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) {
          finalTranscriptRef.current += r[0].transcript + ' '
        } else {
          interim += r[0].transcript
        }
      }
      setTranscript(finalTranscriptRef.current.trim())
      setPartialTranscript(interim)
      const secs = (Date.now() - startTimeRef.current) / 1000
      setMetrics(buildMetrics(finalTranscriptRef.current, secs))
    }

    // Chrome stops recognition after silence — restart if user hasn't stopped
    recognition.onend = () => {
      if (shouldContinueRef.current) {
        try { recognition.start() } catch {}
      } else {
        setIsRecording(false)
        setPartialTranscript('')
        if (timerRef.current) clearInterval(timerRef.current)
        setMetrics(buildMetrics(finalTranscriptRef.current, elapsedRef.current))
      }
    }

    recognition.onerror = (e: any) => {
      if (e.error === 'not-allowed') setPermissionDenied(true)
      if (e.error !== 'no-speech') {
        shouldContinueRef.current = false
        setIsRecording(false)
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }

    timerRef.current = setInterval(() => {
      elapsedRef.current = (Date.now() - startTimeRef.current) / 1000
      setMetrics(buildMetrics(finalTranscriptRef.current, elapsedRef.current))
    }, 500)

    recognition.start()
  }, [])

  const stopRecording = useCallback(async () => {
    shouldContinueRef.current = false
    recognitionRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)
    const secs = elapsedRef.current || (Date.now() - startTimeRef.current) / 1000
    setMetrics(buildMetrics(finalTranscriptRef.current, secs))
    setPartialTranscript('')
  }, [])

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
