import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en'

// English-only. The language toggle has been removed; the app is served in English.
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
    },
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: ['en'],
    interpolation: { escapeValue: false },
  })

if (typeof document !== 'undefined') document.documentElement.lang = 'en'

export default i18n
