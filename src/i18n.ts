import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en';
import ko from './locales/ko';
import ja from './locales/ja';
import zhCN from './locales/zh-CN';
import zhTW from './locales/zh-TW';
import es from './locales/es';
import fr from './locales/fr';
import de from './locales/de';
import ru from './locales/ru';
import pt from './locales/pt';
import it from './locales/it';
import id from './locales/id';
import th from './locales/th';
import vi from './locales/vi';

const resources = {
    en: { translation: en },
    ko: { translation: ko },
    ja: { translation: ja },
    'zh-CN': { translation: zhCN },
    'zh-TW': { translation: zhTW },
    es: { translation: es },
    fr: { translation: fr },
    de: { translation: de },
    ru: { translation: ru },
    pt: { translation: pt },
    it: { translation: it },
    id: { translation: id },
    th: { translation: th },
    vi: { translation: vi },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false // React already escapes
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'md_language',
        }
    });

export default i18n;
