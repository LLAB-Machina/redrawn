import { Language } from "@/i18n/constants";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

export default function Layout({
  children,
  lng,
}: {
  children: React.ReactNode;
  lng: Language;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gray-100">
      <Header lng={lng} />
      <main className="container mx-auto px-4 py-6 overflow-x-hidden">
        {children}
      </main>
      <Footer lng={lng} />
    </div>
  );
}
