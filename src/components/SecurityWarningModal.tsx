import React, { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const SecurityWarningModal: React.FC = () => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const hasAgreed = localStorage.getItem('security_consent_agreed');
        if (!hasAgreed) {
            setIsVisible(true);
        }
    }, []);

    const handleAgree = () => {
        localStorage.setItem('security_consent_agreed', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-[400px] max-w-[90%] p-6 rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl shadow-2xl border border-white/20 dark:border-slate-700 ring-1 ring-black/5 flex flex-col items-center text-center animate-in zoom-in-95 duration-300 delay-150">

                {/* Icon with glowing effect */}
                <div className="mb-6 relative">
                    <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                    <div className="relative bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 p-4 rounded-2xl border border-red-200/50 dark:border-red-700/50 shadow-inner">
                        <Shield className="w-10 h-10 text-red-500 dark:text-red-400" />
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    {t('securityWarning.title')}
                </h2>

                {/* Message */}
                <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                    {t('securityWarning.message')}
                </p>

                {/* Action Button */}
                <button
                    onClick={handleAgree}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                    {t('securityWarning.agree')}
                </button>
            </div>
        </div>
    );
};
