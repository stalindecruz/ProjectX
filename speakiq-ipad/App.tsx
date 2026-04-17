import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppProvider } from './src/context/AppContext'
import { CoachScreen } from './src/screens/CoachScreen'
import { ProgressScreen } from './src/screens/ProgressScreen'
import { Colors } from './src/constants/colors'

const Tab = createBottomTabNavigator()

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarStyle: {
                backgroundColor: Colors.panel,
                borderTopColor: Colors.panelBorder,
                borderTopWidth: 1,
                height: 60,
              },
              tabBarActiveTintColor: Colors.accent,
              tabBarInactiveTintColor: '#555',
              tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: '600',
                marginBottom: 4,
              },
              tabBarIcon: ({ focused, color, size }) => {
                let iconName: keyof typeof Ionicons.glyphMap = 'mic'
                if (route.name === 'Coach') {
                  iconName = focused ? 'mic' : 'mic-outline'
                } else if (route.name === 'Progress') {
                  iconName = focused ? 'bar-chart' : 'bar-chart-outline'
                }
                return <Ionicons name={iconName} size={size} color={color} />
              },
            })}
          >
            <Tab.Screen name="Coach" component={CoachScreen} />
            <Tab.Screen name="Progress" component={ProgressScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  )
}
