import React from 'react';
import { X, Moon, Sun, Monitor, Trash2, Globe, Book, Shield } from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [theme, setTheme] = usePersistentState<'light' | 'dark' | 'system'>('theme', 'system');
  const { t, i18n } = useTranslation();

  if (!isOpen) return null;

  const handleClearData = () => {
    if (confirm(t('common.confirm'))) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ko', label: '한국어' },
    { code: 'ja', label: '日本語' },
    { code: 'zh-CN', label: '简体中文' },
    { code: 'zh-TW', label: '繁體中文' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'ru', label: 'Русский' },
    { code: 'pt', label: 'Português' },
    { code: 'it', label: 'Italiano' },
    { code: 'id', label: 'Bahasa Indonesia' },
    { code: 'th', label: 'ไทย' },
    { code: 'vi', label: 'Tiếng Việt' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-[500px] max-w-[90%] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-lg text-slate-800">{t('settings.title')}</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Appearance Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Monitor size={12} /> {t('settings.appearance')}
            </h3>

            {/* Theme Selector */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-sm font-medium text-slate-700">{t('settings.theme')}</span>
              <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                {(['light', 'dark', 'system'] as const).map((tMode) => (
                  <button
                    key={tMode}
                    onClick={() => setTheme(tMode)}
                    className={clsx(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                      theme === tMode
                        ? "bg-slate-800 text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    {tMode === 'light' && <Sun size={12} />}
                    {tMode === 'dark' && <Moon size={12} />}
                    {tMode === 'system' && <Monitor size={12} />}
                    <span>
                      {tMode === 'light' && t('settings.themeLight')}
                      {tMode === 'dark' && t('settings.themeDark')}
                      {tMode === 'system' && t('settings.themeAuto')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Language Selector */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-sm font-medium text-slate-700">{t('settings.language')}</span>
              <select
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className="text-sm bg-white border border-slate-200 rounded px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Storage Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Trash2 size={12} /> {t('settings.storage')}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700">{t('settings.clearLocalData')}</span>
                  <span className="text-xs text-slate-400">{t('settings.clearDataDescription')}</span>
                </div>
                <button
                  onClick={handleClearData}
                  className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors"
                >
                  {t('settings.clearButton')}
                </button>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Globe size={12} /> {t('settings.about')}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col gap-1">
                <span className="text-xs text-slate-400">{t('settings.version')}</span>
                <span className="text-sm font-mono font-medium text-slate-700">v1.1.0</span>
              </div>
              <a href="#" className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col gap-1 hover:bg-slate-100 transition-colors group">
                <span className="text-xs text-slate-400 flex items-center gap-1 group-hover:text-indigo-500 transition-colors">
                  <Book size={10} /> {t('settings.documentation')}
                </span>
                <span className="text-sm font-medium text-slate-700">{t('settings.viewDocs')} &rarr;</span>
              </a>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1">
              <Shield size={10} />
              <span>{t('settings.privacyNote')}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
