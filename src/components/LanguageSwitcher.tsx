import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

export function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const languages = [
        { code: 'zh', label: '中文' },
        { code: 'en', label: 'English' },
        { code: 'ru', label: 'Русский' },
        { code: 'ja', label: '日本語' },
        { code: 'ko', label: '한국어' },
    ];

    const handleLanguageChange = (langCode: string) => {
        i18n.changeLanguage(langCode);
        localStorage.setItem('language', langCode);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
                <div className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                    <Globe size={20} />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={i18n.language === lang.code ? "bg-indigo-50 text-indigo-600" : ""}
                    >
                        {lang.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
