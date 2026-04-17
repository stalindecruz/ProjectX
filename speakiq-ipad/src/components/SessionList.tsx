import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../constants/colors'
import { Session } from '../types'

interface SessionListProps {
  sessions: Session[]
}

function scoreColor(score: number): string {
  if (score >= 75) return Colors.green
  if (score >= 50) return Colors.amber
  return Colors.red
}

function SessionRow({ session }: { session: Session }) {
  const date = new Date(session.ts)
  const dateStr = date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })

  return (
    <View style={styles.row}>
      <View style={[styles.scoreBadge, { backgroundColor: scoreColor(session.score) }]}>
        <Text style={styles.scoreText}>{session.score}</Text>
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowHeader}>
          <Text style={styles.dateText}>{dateStr} · {timeStr}</Text>
          <Text style={styles.modeTag}>{session.mode === 'mic' ? '🎙' : '✏️'}</Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.stat}>{session.words} words</Text>
          <Text style={styles.statDot}>·</Text>
          <Text style={styles.stat}>{session.wpm} WPM</Text>
          <Text style={styles.statDot}>·</Text>
          <Text style={styles.stat}>{session.fillerPct.toFixed(1)}% fillers</Text>
        </View>
        {session.excerpt ? (
          <Text style={styles.excerpt} numberOfLines={2}>"{session.excerpt}"</Text>
        ) : null}
        {session.tip ? (
          <Text style={styles.tip} numberOfLines={1}>💡 {session.tip}</Text>
        ) : null}
      </View>
    </View>
  )
}

export function SessionList({ sessions }: SessionListProps) {
  const recent = sessions.slice(0, 10)

  if (recent.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No sessions yet. Start a coaching session to see your history.</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Recent Sessions</Text>
      {recent.map(session => (
        <SessionRow key={session.id} session={session} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.creamCard,
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  scoreBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  scoreText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  rowContent: {
    flex: 1,
    gap: 3,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  modeTag: {
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stat: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
  statDot: {
    fontSize: 12,
    color: Colors.textLight,
  },
  excerpt: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 2,
  },
  tip: {
    fontSize: 11,
    color: Colors.accent,
    lineHeight: 16,
    marginTop: 2,
  },
  empty: {
    backgroundColor: Colors.creamCard,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
})
