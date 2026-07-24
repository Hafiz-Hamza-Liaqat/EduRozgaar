/**
 * Strideto Mobile – Phase-8 scaffold.
 * Screens: Home, Jobs, Scholarships, Admissions, Saved, Profile.
 * Uses /api/v1, dark/light theme placeholder, EN/UR i18n.
 */
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeContext } from './theme';
import HomeScreen from './screens/HomeScreen';
import JobsScreen from './screens/JobsScreen';
import ScholarshipsScreen from './screens/ScholarshipsScreen';
import AdmissionsScreen from './screens/AdmissionsScreen';
import SavedScreen from './screens/SavedScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Tabs() {
  const { t } = require('./i18n');
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('nav.home') }} />
      <Tab.Screen name="Jobs" component={JobsScreen} options={{ title: t('nav.jobs') }} />
      <Tab.Screen name="Scholarships" component={ScholarshipsScreen} options={{ title: t('nav.scholarships') }} />
      <Tab.Screen name="Admissions" component={AdmissionsScreen} options={{ title: t('nav.admissions') }} />
      <Tab.Screen name="Saved" component={SavedScreen} options={{ title: t('nav.saved') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('nav.profile') }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [theme, setTheme] = useState('light');
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Tabs" component={Tabs} />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      </SafeAreaProvider>
    </ThemeContext.Provider>
  );
}
