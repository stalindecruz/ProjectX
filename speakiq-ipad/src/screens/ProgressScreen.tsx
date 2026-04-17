import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from '../constants/colors'
import { useSessions } from '../hooks/useSessions'
import { ProgressCharts } from '../components/ProgressCharts'
import { SessionList } from '../components/SessionList'
import { Toast } from '../components/Toast'
import { useAppContext } from '../context/AppContext'

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function scoreColor(score: number): string {
  if (score >= 75) return Colors.green
  if (score >= 50) return Colors.amber
  return Colors.red
}

export function ProgressScreen() {
  const { sessions, deleteAllSessions } = useSessions()
  const { dispatch } = useAppContext()

  const totalSessions = sessions.length
  const avgScore = totalSessions > 0
    ? Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / totalSessions)
    : 0
  const avgFillerPct = totalSessions > 0
    ? (sessions.reduce((sum, s) => sum + s.fillerPct, 0) / totalSessions)
    : 0
  const bestScore = totalSessions > 0
    ? Math.max(...sessions.map(s => s.score))
    : 0

  function confirmClear() {
    if (totalSessions === 0) return
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your session history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await deleteAllSessions()
            dispatch({ type: 'SHOW_TOAST', payload: { message: 'All session data cleared.', toastType: 'default' } })
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.navBar}>
        <Text style={styles.navTitle}>Progress</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats summary */}
        <View style={styles.statsRow}>
          <StatCard label="Sessions" value={String(totalSessions)} />
          <StatCard label="Avg Score" value={totalSessions > 0 ? String(avgScore) : '—'} color={totalSessions > 0 ? scoreColor(avgScore) : undefined} />
          <StatCard label="Avg Filler%" value={totalSessions > 0 ? `${avgFillerPct.toFixed(1)}%` : '—'} />
          <StatCard label="Best Score" value={totalSessions > 0 ? String(bestScore) : '—'} color={totalSessions > 0 ? scoreColor(bestScore) : undefined} />
        </View>

        {/* Charts */}
        {totalSessions > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Trends</Text>
            <ProgressCharts sessions={sessions} />
          </View>
        )}

        {totalSessions === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No Sessions Yet</Text>
            <Text style={styles.emptyText}>
              Complete a coaching session on the Coach tab to see your progress trends here.
            </Text>
          </View>
        )}

        {/* Session list */}
        <View style={styles.section}>
          <SessionList sessions={sessions} />
        </View>

        {/* Clear data */}
        {totalSessions > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={confirmClear}>
            <Text style={styles.clearBtnText}>Clear All Data</Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
      <Toast />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  navBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e0d8',
  },
  navTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.creamCard,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 3,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  emptyState: {
    backgroundColor: Colors.creamCard,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  clearBtn: {
    backgroundColor: 'rgba(220,38,38,0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.25)',
    marginTop: 8,
  },
  clearBtnText: {
    color: Colors.red,
    fontWeight: '700',
    fontSize: 14,
  },
  bottomPad: {
    height: 24,
  },
})
