import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme';
import { setLocale, getLocale, t } from '../i18n';

export default function ProfileScreen() {
  const { theme, toggleTheme } = useTheme();
  const c = theme === 'dark' ? require('../theme').colors.dark : require('../theme').colors.light;

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.heading, { color: c.text }]}>{t('nav.profile')}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: c.card, borderColor: c.border }]} onPress={toggleTheme}>
          <Text style={[styles.btnText, { color: c.text }]}>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: c.card, borderColor: c.border }]} onPress={() => setLocale(getLocale() === 'ur' ? 'en' : 'ur')}>
          <Text style={[styles.btnText, { color: c.text }]}>Language: {getLocale() === 'ur' ? 'Urdu' : 'English'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.footer, { color: c.subtext }]}>Strideto Mobile – Phase-8</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 48 },
  heading: { fontSize: 22, fontWeight: '700' },
  actions: { padding: 20, gap: 12 },
  btn: { padding: 16, borderRadius: 12, borderWidth: 1 },
  btnText: { fontSize: 16 },
  footer: { position: 'absolute', bottom: 32, alignSelf: 'center', fontSize: 12 },
});
