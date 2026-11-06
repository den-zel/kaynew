"use client";

import type { InkReveal } from "@/anim/ink-preloader";
import { gsap } from "gsap";
import Image from "next/image";
import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from "react";

interface InkPreloaderProps {
    onComplete?: () => void;
    /** Time in milliseconds before the ink reveal starts. */
    duration?: number;
    logo?: ReactNode;
    logoSrc?: string;
    logoAlt?: string;
}

function InkPreloader({
    onComplete,
    duration = 3000,
    logo,
    logoSrc = "/assets/zel-logo.svg",
    logoAlt = "Zel",
}: InkPreloaderProps) {
    const [isVisible, setIsVisible] = useState(true);
    const rootRef = useRef<HTMLDivElement>(null);
    const backgroundRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const logoRef = useRef<HTMLDivElement>(null);
    const complete = useEffectEvent(() => {
        setIsVisible(false);
        onComplete?.();
    });

    useEffect(() => {
        const root = rootRef.current;
        const background = backgroundRef.current;
        const canvas = canvasRef.current;
        const logoElement = logoRef.current;
        if (!root || !background || !canvas || !logoElement) return;

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        let ink: InkReveal | null = null;
        let cancelled = false;
        let finished = false;
        let exiting = false;
        let exitAnimation: gsap.core.Timeline | gsap.core.Tween | undefined;

        const entrance = reducedMotion.matches ? null : gsap.fromTo(
            logoElement,
            { opacity: 0, scale: 0.94 },
            { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" },
        );

        const finish = () => {
            if (cancelled || finished) return;
            finished = true;
            ink?.dispose();
            ink = null;
            complete();
        };

        const fade = () => {
            exitAnimation?.kill();
            exitAnimation = gsap.to(root, { opacity: 0, duration: 0.2, onComplete: finish });
        };

        // Keep the CSS cover visible while the shader loads; slow or unavailable
        // graphics never extend the requested loading time.
        if (!reducedMotion.matches) {
            void import("@/anim/ink-preloader")
                .then(async ({ createInkReveal }) => {
                    if (cancelled || finished || exiting) return;
                    const created = await createInkReveal(canvas, background);
                    if (cancelled || finished || exiting) created?.dispose();
                    else ink = created;
                })
                .catch(() => { /* The CSS cover fades if the shader cannot load. */ });
        }

        const timer = window.setTimeout(() => {
            exiting = true;
            entrance?.kill();

            if (reducedMotion.matches || !ink?.draw(1)) {
                fade();
                return;
            }

            const reveal = { progress: 1 };
            exitAnimation = gsap.timeline({ onComplete: finish })
                .to(logoElement, { opacity: 0, duration: 0.2, ease: "power2.out" })
                .set(canvas, { opacity: 1 })
                .set(background, { opacity: 0 })
                .to(reveal, {
                    progress: 0,
                    duration: 1.1,
                    ease: "power2.out",
                    onUpdate: () => {
                        if (!ink?.draw(reveal.progress)) fade();
                    },
                });
        }, Math.max(0, duration));

        const handleMotionChange = () => {
            if (!reducedMotion.matches) return;
            entrance?.kill();
            gsap.set(logoElement, { opacity: 1, scale: 1 });
            if (exiting) fade();
        };
        reducedMotion.addEventListener("change", handleMotionChange);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
            reducedMotion.removeEventListener("change", handleMotionChange);
            entrance?.kill();
            exitAnimation?.kill();
            ink?.dispose();
            gsap.set([root, background, canvas, logoElement], { clearProps: "all" });
        };
    }, [duration]);

    if (!isVisible) return null;

    return (
        <div
            ref={rootRef}
            role="status"
            aria-label="Loading"
            className="fixed inset-0 z-2147483000 overflow-hidden"
        >
            <div ref={backgroundRef} className="absolute inset-0 bg-primary" />
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                className="absolute inset-0 h-full w-full opacity-0"
            />
            <div ref={logoRef} className="absolute inset-0 flex items-center justify-center text-primary-foreground">
                {logo ?? (logoSrc ? (
                    <div className="relative w-12 h-12 md:h-18 md:w-18">
                        <Image
                            src={logoSrc}
                            alt={logoAlt}
                            fill
                            className="object-contain brightness-0 invert dark:invert-0"
                            preload
                            sizes="(max-width: 768px) 128px, (max-width: 1024px) 160px, 192px"
                        />
                    </div>
                ) : null)}
            </div>
        </div>
    );
}

export { InkPreloader, type InkPreloaderProps };

