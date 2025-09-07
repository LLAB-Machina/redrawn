import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/router";
import { Globe } from "lucide-react";
import { DEFAULT_LANGUAGE, Language, LANGUAGES } from "@/i18n/constants";

const languageNames: Record<string, string> = {
  en: "English",
  sv: "Svenska",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  nl: "Nederlands",
  ru: "Русский",
  ja: "日本語",
  ko: "한국어",
  zh: "中文",
  ar: "العربية",
  hi: "हिन्दी",
  da: "Dansk",
  no: "Norsk",
  fi: "Suomi",
};

export default function LanguageSwitcher() {
  const router = useRouter();

  const getCurrentLanguage = () => {
    const pathSegments = router.pathname.split("/");
    const potentialLang = pathSegments[1];
    return LANGUAGES.includes(potentialLang as Language)
      ? potentialLang
      : DEFAULT_LANGUAGE;
  };

  const currentLanguage = getCurrentLanguage();

  const getLanguageUrl = (lang: string) => {
    const currentPath = router.pathname;
    const currentLang = getCurrentLanguage();

    let basePath = currentPath;
    if (currentLang !== DEFAULT_LANGUAGE) {
      basePath = currentPath.replace(`/${currentLang}`, "") || "/";
    }

    return lang === DEFAULT_LANGUAGE ? basePath : `/${lang}${basePath}`;
  };

  if (LANGUAGES.length === 1) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-4">
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem key={lang} asChild>
            <Link
              href={getLanguageUrl(lang)}
              className={`w-full ${
                currentLanguage === lang ? "bg-accent" : ""
              }`}
            >
              {languageNames[lang] || lang.toUpperCase()}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
