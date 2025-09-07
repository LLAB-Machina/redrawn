import "@/index.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppProps } from "next/app";
import { useState } from "react";
import "@/i18n";
import Head from "next/head";
import { MotionConfig } from "motion/react";
import { Provider } from "react-redux";
import { store } from "@/services/store";

function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Head>
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="/apple-touch-icon.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="/favicon-32x32.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="/favicon-16x16.png"
          />
          <link rel="manifest" href="/site.webmanifest" />
          <link rel="icon" href="/favicon.ico" />
          <meta name="theme-color" content="#ffffff" />
        </Head>
        <MotionConfig reducedMotion="user">
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Component {...pageProps} />
          </TooltipProvider>
        </MotionConfig>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
