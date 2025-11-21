import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    en: {
        translation: {
            "Perplexity": {
                "Error": {
                    "404": "Resource not found. This often happens when the daily search quota is exceeded or the API endpoint has changed.",
                    "403": "Access forbidden. Please check your login status or pass the security check on perplexity.ai.",
                    "429": "Too many requests. You have exceeded your rate limit. Please try again later.",
                    "500": "Server error. Perplexity is experiencing issues. Please try again later.",
                    "QuotaExceeded": "Deep Research quota exceeded for {{tier}} tier. Switching to Quick Search or upgrade your plan.",
                    "Generic": "An error occurred: {{message}}"
                },
                "Tier": {
                    "Free": "Free",
                    "Pro": "Pro"
                }
            }
        }
    },
    ko: {
        translation: {
            "Perplexity": {
                "Error": {
                    "404": "리소스를 찾을 수 없습니다. 일일 검색 쿼터를 초과했거나 API 엔드포인트가 변경되었을 수 있습니다.",
                    "403": "접근이 거부되었습니다. 로그인 상태를 확인하거나 perplexity.ai에서 보안 점검을 통과해주세요.",
                    "429": "요청이 너무 많습니다. 사용 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
                    "500": "서버 오류입니다. Perplexity 서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
                    "QuotaExceeded": "{{tier}} 티어의 심층 연구(Deep Research) 쿼터를 초과했습니다. 일반 검색으로 전환하거나 플랜을 업그레이드하세요.",
                    "Generic": "오류가 발생했습니다: {{message}}"
                },
                "Tier": {
                    "Free": "무료",
                    "Pro": "프로"
                }
            }
        }
    },
    ja: {
        translation: {
            "Perplexity": {
                "Error": {
                    "404": "リソースが見つかりません。1日の検索クォータを超過したか、APIエンドポイントが変更された可能性があります。",
                    "403": "アクセスが拒否されました。ログイン状態を確認するか、perplexity.aiでセキュリティチェックを通過してください。",
                    "429": "リクエストが多すぎます。利用制限を超えました。しばらくしてから再試行してください。",
                    "500": "サーバーエラーです。Perplexityサーバーで問題が発生しました。しばらくしてから再試行してください。",
                    "QuotaExceeded": "{{tier}}ティアのDeep Researchクォータを超過しました。クイック検索に切り替えるか、プランをアップグレードしてください。",
                    "Generic": "エラーが発生しました: {{message}}"
                },
                "Tier": {
                    "Free": "無料",
                    "Pro": "プロ"
                }
            }
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
