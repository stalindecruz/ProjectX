import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../constants/colors'
import { Metrics } from '../types'

interface MetricsRowProps {
  metrics: Metrics
}

interface ChipProps {
  label: string
  value: string | number
}

function Chip({ label, value }: ChipProps) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipValue}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  )
}

export function MetricsRow({ metrics }: MetricsRowProps) {
  const duration = metrics.duration < 60
    ? `${Math.floor(metrics.duration)}s`
    : `${Math.floor(metrics.duration / 60)}m ${Math.floor(metrics.duration % 60)}s`

  return (
    <View style={styles.row}>
      <Chip label="Words" value={metrics.words} />
      <Chip label="Fillers" value={metrics.fillers} />
      <Chip label="Filler%" value={`${metrics.fillerPct.toFixed(1)}%`} />
      <Chip label="Duration" value={duration} />
      <Chip label="WPM" value={metrics.wpm} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    flex: 1,
    minWidth: 56,
    backgroundColor: Colors.panelSurface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.panelBorder,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  chipValue: {
    color: '#e8e4df',
    fontSize: 16,
    fontWeight: '700',
  },
  chipLabel: {
    color: Colors.textLight,
    fontSize: 10,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
})
