import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import Link from "next/link";
import { Language } from "@/i18n/constants";

export default function Header({ lng }: { lng: Language }) {
  const { t } = useTranslation("common", {
    lng,
  });

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex">
        {/* TODO: add logo here or more header content here */}
        <div className="ml-auto">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
