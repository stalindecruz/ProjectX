import React, { useEffect, useRef } from 'react'
import { Animated, Text, StyleSheet, View } from 'react-native'
import { Colors } from '../constants/colors'
import { useAppContext } from '../context/AppContext'

export function Toast() {
  const { state, dispatch } = useAppContext()
  const translateY = useRef(new Animated.Value(80)).current
  const opacity = useRef(new Animated.Value(0)).current
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (state.toastMessage) {
      if (timerRef.current) clearTimeout(timerRef.current)

      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start()

      timerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: 80, duration: 250, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start(() => dispatch({ type: 'HIDE_TOAST' }))
      }, 3000)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [state.toastMessage])

  if (!state.toastMessage) return null

  const borderColor =
    state.toastType === 'success' ? Colors.green :
    state.toastType === 'error' ? Colors.red :
    Colors.accent

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }], opacity, borderLeftColor: borderColor },
      ]}
    >
      <Text style={styles.message}>{state.toastMessage}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    backgroundColor: '#1a1612',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: 380,
  },
  message: {
    color: '#f5f2ec',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
})
