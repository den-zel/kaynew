"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { InkPreloader } from "@/components/ui/ink-preloader";

const PreloaderCompleteContext = createContext(true);

export function usePreloaderComplete() {
  return useContext(PreloaderCompleteContext);
}

export function SitePreloader({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loading) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [loading]);

  return (
    <>
      <InkPreloader
        duration={3000}
        logoSrc="/assets/zel-logo.svg"
        logoAlt="Zel"
        onComplete={() => setLoading(false)}
      />
      <div inert={loading} aria-hidden={loading || undefined}>
        <PreloaderCompleteContext value={!loading}>
          {children}
        </PreloaderCompleteContext>
      </div>
    </>
  );
}
