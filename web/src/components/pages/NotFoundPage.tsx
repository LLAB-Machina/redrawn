import Layout from "@/components/layouts/Layout";
import { DEFAULT_LANGUAGE, Language } from "@/i18n/constants";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function NotFoundPage({ lng }: { lng: Language }) {
  const { t } = useTranslation("common", {
    lng,
  });

  return (
    <Layout lng={lng}>
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">{t("404.title")}</h1>
        <p className="text-xl text-gray-600 mb-4">{t("404.message")}</p>
        <Link
          href={`/${lng === DEFAULT_LANGUAGE ? "" : lng}`}
          className="text-blue-500 hover:text-blue-700 underline"
        >
          {t("404.returnHome")}
        </Link>
      </div>
    </Layout>
  );
}
