import React, { useRef, useEffect } from 'react'
import { ScrollView, Text, View, StyleSheet, TouchableOpacity } from 'react-native'
import { Colors } from '../constants/colors'
import { FILLER_WORDS } from '../constants/fillerWords'

interface TranscriptViewProps {
  transcript: string
  partialTranscript?: string
  onClear: () => void
}

function isFillerWord(word: string): boolean {
  const clean = word.toLowerCase().replace(/[^a-z\s]/g, '').trim()
  return FILLER_WORDS.includes(clean)
}

function tokenize(text: string): { word: string; isFiller: boolean }[] {
  if (!text.trim()) return []
  const lower = text.toLowerCase()
  const tokens: { word: string; isFiller: boolean }[] = []

  const multiWordFillers = FILLER_WORDS.filter(f => f.includes(' '))
  let remaining = text
  let lowerRemaining = lower

  const parts: { text: string; isFiller: boolean }[] = []
  let cursor = 0

  while (cursor < text.length) {
    let matched = false
    for (const filler of multiWordFillers) {
      if (lowerRemaining.startsWith(filler, cursor - (text.length - remaining.length))) {
        parts.push({ text: text.slice(cursor, cursor + filler.length), isFiller: true })
        cursor += filler.length
        matched = true
        break
      }
    }
    if (!matched) {
      const spaceIdx = text.indexOf(' ', cursor)
      const end = spaceIdx === -1 ? text.length : spaceIdx + 1
      const word = text.slice(cursor, end)
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '')
      parts.push({ text: word, isFiller: FILLER_WORDS.includes(cleanWord) })
      cursor = end
    }
  }

  for (const part of parts) {
    const words = part.text.split(/(\s+)/)
    for (const w of words) {
      if (w.trim()) {
        tokens.push({ word: w, isFiller: part.isFiller })
      } else if (w) {
        tokens.push({ word: w, isFiller: false })
      }
    }
  }
  return tokens
}

export function TranscriptView({ transcript, partialTranscript, onClear }: TranscriptViewProps) {
  const scrollRef = useRef<ScrollView>(null)
  const displayText = transcript + (partialTranscript ? ' ' + partialTranscript : '')
  const tokens = tokenize(displayText)

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true })
  }, [displayText])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Transcript</Text>
        {displayText.trim() !== '' && (
          <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.content}>
        {displayText.trim() === '' ? (
          <Text style={styles.placeholder}>Start speaking and your transcript will appear here...</Text>
        ) : (
          <Text style={styles.transcriptText}>
            {tokens.map((token, i) =>
              token.isFiller ? (
                <Text key={i} style={styles.fillerWord}>{token.word}</Text>
              ) : (
                <Text key={i}>{token.word}</Text>
              )
            )}
            {partialTranscript ? <Text style={styles.partial}> ...</Text> : null}
          </Text>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.panelBorder,
  },
  clearText: {
    color: Colors.textLight,
    fontSize: 12,
  },
  scroll: {
    flex: 1,
    maxHeight: 180,
  },
  content: {
    paddingBottom: 8,
  },
  placeholder: {
    color: Colors.textLight,
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 22,
  },
  transcriptText: {
    color: '#e8e4df',
    fontSize: 15,
    lineHeight: 24,
  },
  fillerWord: {
    backgroundColor: 'rgba(245,158,11,0.18)',
    borderBottomWidth: 2,
    borderBottomColor: Colors.filler,
    fontWeight: 'bold',
    color: Colors.filler,
  },
  partial: {
    color: Colors.textLight,
    fontStyle: 'italic',
  },
})
