import React, { useEffect, useRef } from 'react'
import { TouchableOpacity, StyleSheet, Animated, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../constants/colors'

interface MicButtonProps {
  isRecording: boolean
  onPress: () => void
}

export function MicButton({ isRecording, onPress }: MicButtonProps) {
  const ripples = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current]
  const opacities = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current]
  const animRef = useRef<Animated.CompositeAnimation | null>(null)

  useEffect(() => {
    if (isRecording) {
      const animations = ripples.map((scale, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(i * 650),
            Animated.parallel([
              Animated.timing(scale, { toValue: 2.5, duration: 1500, useNativeDriver: true }),
              Animated.timing(opacities[i], { toValue: 0, duration: 1500, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scale, { toValue: 0, duration: 0, useNativeDriver: true }),
              Animated.timing(opacities[i], { toValue: 0.6, duration: 0, useNativeDriver: true }),
            ]),
          ])
        )
      )
      animRef.current = Animated.parallel(animations)
      ripples.forEach((s, i) => { s.setValue(1); opacities[i].setValue(0.6) })
      animRef.current.start()
    } else {
      animRef.current?.stop()
      ripples.forEach((s, i) => { s.setValue(1); opacities[i].setValue(0) })
    }
  }, [isRecording])

  return (
    <View style={styles.container}>
      {ripples.map((scale, i) => (
        <Animated.View
          key={i}
          style={[
            styles.ripple,
            { transform: [{ scale }], opacity: opacities[i] },
          ]}
        />
      ))}
      <TouchableOpacity
        onPress={onPress}
        style={[styles.button, isRecording && styles.buttonRecording]}
        activeOpacity={0.85}
      >
        <Ionicons
          name={isRecording ? 'stop' : 'mic'}
          size={32}
          color="#fff"
        />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accent,
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  buttonRecording: {
    backgroundColor: '#991b1b',
  },
})
