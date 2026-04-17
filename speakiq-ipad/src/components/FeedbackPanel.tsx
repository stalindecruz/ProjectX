import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { Colors } from '../constants/colors'
import { CoachResult } from '../types'
import { ScoreRing } from './ScoreRing'

interface FeedbackPanelProps {
  result: CoachResult
  fillerCounts: Record<string, number>
}

export function FeedbackPanel({ result, fillerCounts }: FeedbackPanelProps) {
  const fillerEntries = Object.entries(fillerCounts).filter(([, count]) => count > 0)

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Score + Summary */}
      <View style={styles.card}>
        <View style={styles.scoreRow}>
          <ScoreRing score={result.score} label={result.scoreLabel} />
          <Text style={styles.summary}>{result.summary}</Text>
        </View>
      </View>

      {/* Strengths */}
      {result.strengths.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Strengths</Text>
          {result.strengths.map((s, i) => (
            <View key={i} style={styles.listRow}>
              <Text style={styles.checkMark}>✓</Text>
              <Text style={styles.listText}>{s}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Improvements */}
      {result.improvements.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Improvements</Text>
          {result.improvements.map((s, i) => (
            <View key={i} style={styles.listRow}>
              <Text style={styles.arrow}>→</Text>
              <Text style={styles.listText}>{s}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Filler words */}
      {fillerEntries.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Filler Words</Text>
          <Text style={styles.fillerAnalysis}>{result.fillerAnalysis}</Text>
          <View style={styles.chipsRow}>
            {fillerEntries.map(([word, count]) => (
              <View key={word} style={styles.fillerChip}>
                <Text style={styles.fillerChipText}>"{word}" × {count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Tip */}
      <View style={[styles.card, styles.tipCard]}>
        <Text style={styles.sectionTitle}>Next Session Tip</Text>
        <Text style={styles.tipText}>{result.tip}</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: Colors.creamCard,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  summary: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  listRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  checkMark: {
    color: Colors.green,
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 22,
  },
  arrow: {
    color: Colors.accent,
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 22,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  fillerAnalysis: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fillerChip: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.amber,
  },
  fillerChipText: {
    color: Colors.amber,
    fontSize: 12,
    fontWeight: '600',
  },
  tipCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  tipText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
})
