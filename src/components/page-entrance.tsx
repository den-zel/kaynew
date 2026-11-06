"use client";

import { gsap } from "gsap";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, type ComponentPropsWithoutRef } from "react";
import { usePreloaderComplete } from "@/components/site-preloader";

export function PageEntrance({ children, ...props }: ComponentPropsWithoutRef<"main">) {
  const rootRef = useRef<HTMLElement>(null);
  const ready = usePreloaderComplete();
  const initialLoad = useRef(!ready);
  const pathname = usePathname();

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const items = root.querySelectorAll<HTMLElement>("[data-enter]");
      gsap.set(items, { opacity: 0, y: 12 });
      if (!ready) return;

      // Wait for the preloader, then overlap entrances with the route ink clearing.
      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.45,
        delay: initialLoad.current ? 0.05 : 0.2,
        stagger: 0.05,
        ease: "power3.out",
        clearProps: "opacity,transform",
      });
    }, root);

    if (ready) initialLoad.current = false;
    return () => media.revert();
  }, [ready, pathname]);

  return <main ref={rootRef} {...props}>{children}</main>;
}
