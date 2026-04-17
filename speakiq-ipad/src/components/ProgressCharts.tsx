import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg'
import { Colors } from '../constants/colors'
import { Session } from '../types'

interface ProgressChartsProps {
  sessions: Session[]
}

interface BarChartProps {
  data: { label: string; value: number; color: string }[]
  maxValue: number
  title: string
  unit?: string
}

const CHART_HEIGHT = 120
const CHART_WIDTH = 280
const BAR_PADDING = 6

function BarChart({ data, maxValue, title, unit = '' }: BarChartProps) {
  const anims = useRef(data.map(() => new Animated.Value(0))).current

  useEffect(() => {
    Animated.stagger(
      60,
      data.map((d, i) =>
        Animated.timing(anims[i], {
          toValue: maxValue > 0 ? d.value / maxValue : 0,
          duration: 600,
          useNativeDriver: false,
        })
      )
    ).start()
  }, [JSON.stringify(data)])

  if (data.length === 0) {
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        <Text style={styles.emptyChart}>No data yet</Text>
      </View>
    )
  }

  const barWidth = Math.max(12, (CHART_WIDTH - BAR_PADDING * (data.length + 1)) / data.length)

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.chartArea}>
        {data.map((d, i) => {
          const barH = anims[i].interpolate({
            inputRange: [0, 1],
            outputRange: [0, CHART_HEIGHT - 24],
          })
          return (
            <View key={i} style={[styles.barCol, { width: barWidth }]}>
              <View style={styles.barBackground}>
                <Animated.View
                  style={[
                    styles.bar,
                    { height: barH, backgroundColor: d.color, width: barWidth - 4 },
                  ]}
                />
              </View>
              <Text style={styles.barLabel} numberOfLines={1}>{d.label}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

function scoreBarColor(score: number): string {
  if (score >= 75) return Colors.green
  if (score >= 50) return Colors.amber
  return Colors.red
}

export function ProgressCharts({ sessions }: ProgressChartsProps) {
  const recent = sessions.slice(0, 10).reverse()

  const scoreData = recent.map(s => ({
    label: new Date(s.ts).toLocaleDateString('en', { month: 'numeric', day: 'numeric' }),
    value: s.score,
    color: scoreBarColor(s.score),
  }))

  const fillerData = recent.map(s => ({
    label: new Date(s.ts).toLocaleDateString('en', { month: 'numeric', day: 'numeric' }),
    value: s.fillerPct,
    color: Colors.amber,
  }))

  const wpmData = recent.map(s => ({
    label: new Date(s.ts).toLocaleDateString('en', { month: 'numeric', day: 'numeric' }),
    value: s.wpm,
    color: s.wpm >= 120 && s.wpm <= 160 ? Colors.green : '#3b82f6',
  }))

  return (
    <View style={styles.container}>
      <BarChart data={scoreData} maxValue={100} title="Score (last 10 sessions)" unit="pts" />
      <BarChart data={fillerData} maxValue={Math.max(20, ...fillerData.map(d => d.value))} title="Filler Rate (last 10 sessions)" unit="%" />
      <BarChart data={wpmData} maxValue={Math.max(200, ...wpmData.map(d => d.value))} title="Pace WPM (last 10 sessions)" unit="wpm" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  chartContainer: {
    backgroundColor: Colors.creamCard,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
    gap: 4,
  },
  barCol: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
  },
  bar: {
    borderRadius: 3,
    minHeight: 2,
  },
  barLabel: {
    fontSize: 9,
    color: Colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyChart: {
    color: Colors.textLight,
    fontStyle: 'italic',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 24,
  },
})
