import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { Colors } from '../constants/colors'

interface ScoreRingProps {
  score: number
  label: string
  size?: number
}

const RADIUS = 46
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function scoreColor(score: number): string {
  if (score >= 75) return Colors.green
  if (score >= 50) return Colors.amber
  return Colors.red
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

export function ScoreRing({ score, label, size = 110 }: ScoreRingProps) {
  const animOffset = useRef(new Animated.Value(CIRCUMFERENCE)).current
  const color = scoreColor(score)

  useEffect(() => {
    const targetOffset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE
    Animated.timing(animOffset, {
      toValue: targetOffset,
      duration: 800,
      useNativeDriver: false,
    }).start()
  }, [score])

  const cx = size / 2
  const cy = size / 2

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={cx}
          cy={cy}
          r={RADIUS}
          stroke={Colors.bg}
          strokeWidth={8}
          fill="none"
        />
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={RADIUS}
          stroke={color}
          strokeWidth={8}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={animOffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      <View style={[styles.center, { width: size, height: size }]}>
        <Text style={[styles.scoreText, { color }]}>{score}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  svg: {},
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 22,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    fontWeight: '600',
  },
})
