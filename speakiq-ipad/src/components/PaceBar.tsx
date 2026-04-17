import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import { Colors } from '../constants/colors'
import { calcPaceStatus } from '../hooks/useMetrics'

interface PaceBarProps {
  wpm: number
}

const MAX_WPM = 220

export function PaceBar({ wpm }: PaceBarProps) {
  const needleAnim = useRef(new Animated.Value(0)).current
  const status = calcPaceStatus(wpm)

  useEffect(() => {
    const pct = Math.min(wpm / MAX_WPM, 1)
    Animated.timing(needleAnim, {
      toValue: pct,
      duration: 400,
      useNativeDriver: false,
    }).start()
  }, [wpm])

  const statusLabel = status === 'slow' ? 'Too Slow' : status === 'fast' ? 'Too Fast' : 'Ideal Pace'
  const statusColor = status === 'ideal' ? Colors.green : Colors.red

  return (
    <View style={styles.container}>
      <View style={styles.barWrapper}>
        <View style={[styles.zone, styles.zoneSlow]}>
          <Text style={styles.zoneLabel}>Slow</Text>
          <Text style={styles.zoneRange}>{'<120'}</Text>
        </View>
        <View style={[styles.zone, styles.zoneIdeal]}>
          <Text style={styles.zoneLabel}>Ideal</Text>
          <Text style={styles.zoneRange}>120–160</Text>
        </View>
        <View style={[styles.zone, styles.zoneFast]}>
          <Text style={styles.zoneLabel}>Fast</Text>
          <Text style={styles.zoneRange}>{'160+'}</Text>
        </View>
        <Animated.View
          style={[
            styles.needle,
            {
              left: needleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={[styles.statusText, { color: statusColor }]}>
        {wpm > 0 ? `${wpm} WPM — ${statusLabel}` : 'Start speaking to measure pace'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  barWrapper: {
    flexDirection: 'row',
    height: 28,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  zone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneSlow: {
    backgroundColor: 'rgba(220,38,38,0.25)',
  },
  zoneIdeal: {
    backgroundColor: 'rgba(34,168,97,0.3)',
  },
  zoneFast: {
    backgroundColor: 'rgba(220,38,38,0.25)',
  },
  zoneLabel: {
    color: '#e8e4df',
    fontSize: 10,
    fontWeight: '600',
  },
  zoneRange: {
    color: Colors.textLight,
    fontSize: 8,
  },
  needle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
    marginLeft: -1.5,
    shadowColor: '#fff',
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
})
