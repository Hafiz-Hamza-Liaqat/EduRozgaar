import { useTranslation } from 'react-i18next';
import { getLanguageConfig } from '../i18n/config.js';

export function formatLocalizedDate(date, options = {}) {
  const lang = (typeof window !== 'undefined' && localStorage.getItem('edurozgaar-lang')) || 'en';
  const locale = getLanguageConfig(lang).locale;
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  }).format(d);
}

export function formatLocalizedNumber(value, options = {}) {
  const lang = (typeof window !== 'undefined' && localStorage.getItem('edurozgaar-lang')) || 'en';
  const locale = getLanguageConfig(lang).locale;
  return new Intl.NumberFormat(locale, options).format(value);
}

export function useLocalizedFormat() {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').split('-')[0];
  const locale = getLanguageConfig(lang).locale;

  return {
    formatDate: (date, options) => formatLocalizedDate(date, { ...options, locale }),
    formatNumber: (value, options) => new Intl.NumberFormat(locale, options).format(value),
    locale,
    lang,
  };
}
