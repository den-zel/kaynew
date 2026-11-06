"use client";

import type { InkReveal } from "@/anim/ink-preloader";
import { ROUTE_REVEAL_DURATION } from "@/lib/motion";
import { gsap } from "gsap";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

export function RouteTransition() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const rootRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inkRef = useRef<InkReveal | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const background = backgroundRef.current;
    if (!canvas || !background) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cancelled = false;
    let preparing = false;

    // Prepare once during the initial preloader and reuse the renderer so
    // subsequent navigations can reveal immediately, without a loading delay.
    const prepare = async () => {
      if (reducedMotion.matches || preparing || inkRef.current) return;
      preparing = true;
      try {
        const { createInkReveal } = await import("@/anim/ink-preloader");
        if (cancelled) return;
        const ink = await createInkReveal(canvas, background);
        if (cancelled) ink?.dispose();
        else inkRef.current = ink;
      } catch {
        // A short CSS fade handles unavailable graphics or shader imports.
      } finally {
        preparing = false;
      }
    };

    void prepare();
    reducedMotion.addEventListener("change", prepare);

    return () => {
      cancelled = true;
      reducedMotion.removeEventListener("change", prepare);
      inkRef.current?.dispose();
      inkRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;

    const root = rootRef.current;
    const background = backgroundRef.current;
    const canvas = canvasRef.current;
    if (!root || !background || !canvas) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    let animation: gsap.core.Tween | undefined;
    const finish = () => { gsap.set(root, { autoAlpha: 0 }); };
    const fade = () => {
      animation?.kill();
      animation = gsap.to(root, {
        opacity: 0,
        duration: 0.18,
        onComplete: finish,
      });
    };

    // Cover the committed route before paint, including browser back/forward.
    // The first visit belongs to SitePreloader and never runs this transition.
    gsap.set(root, { autoAlpha: 1 });
    gsap.set(background, { opacity: 1 });
    gsap.set(canvas, { opacity: 0 });

    const ink = inkRef.current;
    if (ink?.draw(1)) {
      gsap.set(canvas, { opacity: 1 });
      gsap.set(background, { opacity: 0 });
      const reveal = { progress: 1 };
      animation = gsap.to(reveal, {
        progress: 0,
        duration: ROUTE_REVEAL_DURATION,
        ease: "power2.out",
        onUpdate: () => {
          if (!ink.draw(reveal.progress)) fade();
        },
        onComplete: finish,
      });
    } else {
      fade();
    }

    const handleMotionChange = () => {
      if (!reducedMotion.matches) return;
      animation?.kill();
      finish();
    };
    reducedMotion.addEventListener("change", handleMotionChange);

    return () => {
      animation?.kill();
      reducedMotion.removeEventListener("change", handleMotionChange);
      finish();
    };
  }, [pathname]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-slot="route-transition"
      className="pointer-events-none invisible fixed inset-0 z-2147482999 overflow-hidden opacity-0"
    >
      <div ref={backgroundRef} className="absolute inset-0 bg-primary" />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-0"
      />
    </div>
  );
}
