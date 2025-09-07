import { Language } from "@/i18n/constants";
import { useTranslation } from "react-i18next";

export default function Footer({ lng }: { lng: Language }) {
  const { t } = useTranslation("common", {
    lng,
  });

  return (
    <footer className="bg-gray-100">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col items-center gap-2 text-sm text-gray-500">
          <p>{t("footer.copyright")}</p>
          <p className="text-xs">
            {t("footer.oneclick")}
            <a
              href="https://oneclick.nu"
              target="_blank"
              rel="noopener noreferrer"
            >
              OneClick
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
