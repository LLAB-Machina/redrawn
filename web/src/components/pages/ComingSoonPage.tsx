import Layout from "@/components/layouts/Layout";
import { Language } from "@/i18n/constants";
import { scaleIn, staggerContainer, staggerItem } from "@/lib/animations";
import { Construction, Hammer } from "lucide-react";
import { motion } from "motion/react";
import Head from "next/head";
import { useTranslation } from "react-i18next";

export default function ComingSoonPage({ lng }: { lng: Language }) {
  const { t } = useTranslation("common", {
    lng,
  });
  return (
    <Layout lng={lng}>
      <Head>
        <title>
          {t("coming_soon.title")} - {t("home.title")}
        </title>
      </Head>

      <div className="py-20 lg:py-32 min-h-[80vh] flex items-center">
        <div className="container mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto space-y-8"
          >
            {/* Construction Icon */}
            <motion.div variants={scaleIn} className="flex justify-center mb-8">
              <div className="relative">
                <div className="bg-primary/10 p-8 rounded-full">
                  <Construction className="h-16 w-16 text-primary" />
                </div>
                <motion.div
                  className="absolute -top-2 -right-2 bg-secondary p-2 rounded-full"
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Hammer className="h-6 w-6 text-primary" />
                </motion.div>
              </div>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              variants={staggerItem}
              className="text-4xl lg:text-6xl font-serif font-bold text-primary leading-tight"
            >
              We&apos;re Building Something
              <br />
              <span className="text-3xl lg:text-5xl text-muted-foreground">
                Beautiful
              </span>
            </motion.h1>

            {/* Description */}
            <motion.div variants={staggerItem} className="space-y-4">
              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Our website is currently undergoing reconstruction by the
                talented team at
                <a
                  href="https://oneclick.nu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary underline hover:text-primary/80 transition-colors"
                >
                  OneClick
                </a>
                .
              </p>
              {/* Feel free to add more text here, but nothing fancy */}
            </motion.div>

            {/* Status Badge */}
            <motion.div variants={staggerItem} className="flex justify-center">
              <div className="bg-secondary/20 border border-secondary/30 rounded-full px-6 py-3 flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-primary rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="text-primary font-medium">
                  Currently Under Development
                </span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              variants={staggerItem}
              className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
            >
              {/* Add buttons here, if any are relevant */}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
