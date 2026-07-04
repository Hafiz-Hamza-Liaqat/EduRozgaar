import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const LANG_KEY = 'edurozgaar-lang';
const defaultLang = () => localStorage.getItem(LANG_KEY) || 'en';

const LanguageContext = createContext(null);

const translations = {
  en: {
    nav: { home: 'Home', jobs: 'Jobs', scholarships: 'Scholarships', admissions: 'Admissions', blog: 'Blog', contact: 'Contact', dashboard: 'Dashboard', profile: 'Profile', login: 'Login', register: 'Register', resume: 'Resume', education: 'Education', examPrep: 'Exam Prep', internships: 'Internships', webinars: 'Webinars', intlScholarships: 'International Scholarships', foreign: 'Foreign Studies', schoolsAndColleges: 'Schools & Colleges', universities: 'Universities' },
    home: { heroTitle: 'Your Gateway to Jobs & Education in Pakistan', heroSub: 'Find jobs, scholarships, admissions, and study abroad opportunities — all in one place.', quickLinks: 'Quick Links', viewAll: 'View all', recommendedForYou: 'Recommended for You' },
    common: { loading: 'Loading...', save: 'Save', saved: 'Saved', apply: 'Apply', deadline: 'Deadline', search: 'Search' },
  },
  ur: {
    nav: { home: 'ہوم', jobs: 'نوکریاں', scholarships: 'اسکالرشپس', admissions: 'داخلے', blog: 'بلاگ', contact: 'رابطہ', dashboard: 'ڈیش بورڈ', profile: 'پروفائل', login: 'لاگ ان', register: 'رجسٹر', resume: 'ریزیومے', education: 'تعلیم', examPrep: 'امتحان کی تیاری', internships: 'انٹرن شپس', webinars: 'ویبینارز', intlScholarships: 'بین الاقوامی اسکالرشپس', foreign: 'غیر ملکی تعلیم', schoolsAndColleges: 'اسکول اور کالج', universities: 'یونیورسٹیز' },
    home: { heroTitle: 'پاکستان میں نوکریوں اور تعلیم تک رسائی', heroSub: 'نوکریاں، اسکالرشپس، داخلے اور بیرون ملک تعلیم — سب ایک جگہ۔', quickLinks: 'فوری لنکس', viewAll: 'سب دیکھیں', recommendedForYou: 'آپ کے لیے تجویز کردہ' },
    common: { loading: 'لوڈ ہو رہا ہے...', save: 'محفوظ کریں', saved: 'محفوظ', apply: 'اپلائی کریں', deadline: 'آخری تاریخ', search: 'تلاش' },
  },
};

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(defaultLang);

  const setLang = useCallback((l) => {
    if (l !== 'en' && l !== 'ur') return;
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored && stored !== lang) setLangState(stored);
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (urlLang === 'en' || urlLang === 'ur') {
      setLangState(urlLang);
      localStorage.setItem(LANG_KEY, urlLang);
    }
  }, []);

  const t = useCallback((key) => {
    const parts = key.split('.');
    let obj = translations[lang] || translations.en;
    for (const p of parts) {
      obj = obj?.[p];
      if (obj == null) {
        const enObj = translations.en;
        for (const q of parts) obj = (obj || enObj)?.[q];
        return typeof obj === 'string' ? obj : key;
      }
    }
    return typeof obj === 'string' ? obj : key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  return ctx || { lang: 'en', setLang: () => {}, t: (k) => k };
}
