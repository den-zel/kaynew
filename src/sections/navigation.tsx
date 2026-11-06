"use client";

import { Dialog } from "@base-ui/react/dialog";
import { PreviewCard } from "@base-ui/react/preview-card";
import { usePreloaderComplete } from "@/components/site-preloader";
import { HamburgerMenu, StickyCursor } from "@/components/ui/hamburger-menu";
import { ROUTE_REVEAL_DURATION } from "@/lib/motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { getCalApi } from "@calcom/embed-react";
import { useTheme } from "next-themes";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
];

const underlineTransition = { type: "spring" as const, duration: 0.5, bounce: 0 };
const underlineTravelDelay = ROUTE_REVEAL_DURATION * 0.55 * 1000;

function isCurrentPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isNavPath(pathname: string) {
  return navigationItems.some(({ href }) => isCurrentPath(pathname, href));
}

type NavigationProps = {
  bookingUrl?: string;
  className?: string;
};

function NavigationLinks({
  bookingUrl,
  onBook,
  onNavigate,
  mobile = false,
}: Pick<NavigationProps, "bookingUrl"> & {
  onNavigate?: () => void;
  onBook?: (event: MouseEvent<HTMLButtonElement>) => void;
  mobile?: boolean;
}) {
  const calLink = bookingUrl?.replace(/^https?:\/\/(?:www\.)?cal\.com\//, "").replace(/\/+$/, "");
  const pathname = usePathname();
  const reducedMotion = useReducedMotion() === true;
  const preloaderComplete = usePreloaderComplete();
  const [indicatedPath, setIndicatedPath] = useState<string | null>(null);
  const [drawEntrance, setDrawEntrance] = useState(false);
  const hasIndicated = useRef(false);
  const entrancePending = useRef(true);

  useEffect(() => {
    if (mobile || !preloaderComplete) return;

    const settle = (path: string) => {
      const draw = !reducedMotion && entrancePending.current && isNavPath(path);
      entrancePending.current = !isNavPath(path);
      hasIndicated.current = true;
      setDrawEntrance(draw);
      setIndicatedPath(path);
    };

    if (reducedMotion) {
      settle(pathname);
      return;
    }

    // The route ink covers the header. Keep the rule on the previous link,
    // then let it travel once the nav is visible again. Leaving the nav
    // drops it immediately, while the cover is still opaque.
    const delay = !hasIndicated.current ? 80 : isNavPath(pathname) ? underlineTravelDelay : 0;
    const timeout = window.setTimeout(() => settle(pathname), delay);
    return () => window.clearTimeout(timeout);
  }, [mobile, pathname, preloaderComplete, reducedMotion]);

  return (
    <LayoutGroup id={mobile ? "mobile-nav" : "desktop-nav"}>
    <ul
      className={cn(
        "m-0 flex list-none gap-4 p-0 text-[13px] font-normal text-muted-foreground uppercase",
        !mobile && "md:text-white",
        mobile && "flex-col gap-2 text-[clamp(24px,7.5vw,40px)]",
      )}
    >
      {navigationItems.map(({ label, href }) => {
        const indicated = !mobile && indicatedPath !== null && isCurrentPath(indicatedPath, href);

        return (
          <li key={href}>
            <Link
              href={href}
              onNavigate={onNavigate}
              aria-current={isCurrentPath(pathname, href) ? "page" : undefined}
              className={cn(
                "block py-2 text-inherit uppercase no-underline whitespace-nowrap hover:text-foreground focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
                !mobile && "md:hover:text-white/70 md:focus-visible:outline-white",
                mobile && "w-full rounded-[8px] p-3 text-left hover:bg-muted",
              )}
            >
              {mobile ? `/ ${label}` : (
                <span className="relative inline-block">{`/ ${label}`}{indicated && (
                  <motion.span
                    layoutId="desktop-nav-underline"
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-full mt-1 h-px bg-white"
                    initial={drawEntrance ? { clipPath: "inset(0 100% 0 0)" } : false}
                    animate={drawEntrance ? { clipPath: "inset(0 0% 0 0)" } : undefined}
                    transition={reducedMotion ? { duration: 0 } : underlineTransition}
                  />
                )}</span>
              )}
            </Link>
          </li>
        );
      })}
      <li>
        <button
          type="button"
          onClick={onBook}
          data-cal-namespace="30min"
          data-cal-link={calLink}
          data-cal-config='{"layout":"month_view","theme":"auto"}'
          disabled={!bookingUrl}
          title={bookingUrl ? undefined : "Booking link coming soon"}
          className={cn(
            "block border-0 bg-transparent py-2 text-inherit uppercase whitespace-nowrap hover:text-foreground focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:cursor-default",
            !mobile && "md:hover:text-white/70 md:focus-visible:outline-white",
            mobile && "w-full rounded-[8px] p-3 text-left hover:bg-muted",
          )}
        >
          / Book a Call
        </button>
      </li>
    </ul>
    </LayoutGroup>
  );
}

function VantaPreview() {
  return (
    <PreviewCard.Root>
      <PreviewCard.Trigger
        href="https://vantaui.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center rounded focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground md:focus-visible:outline-white"
        aria-label="Vanta UI website (opens in a new tab)"
        delay={250}
        closeDelay={150}
      >
        <Image
          src="/assets/vantaui.svg"
          alt="Vanta UI"
          width={86}
          height={24}
          className="h-5 w-auto brightness-0 dark:invert md:invert"
          unoptimized
        />
      </PreviewCard.Trigger>
      <PreviewCard.Portal>
        <PreviewCard.Positioner
          className="z-70 max-w-(--available-width)"
          side="bottom"
          align="start"
          sideOffset={12}
          collisionPadding={12}
        >
          <PreviewCard.Popup className="box-border w-[min(256px,calc(100vw-24px))] origin-(--transform-origin) overflow-hidden rounded-[16px] bg-muted p-1 text-popover-foreground ring-1 ring-border transition-[opacity,transform] duration-160 ease-out outline-none data-ending-style:transform-[translateY(-4px)_scale(0.98)] data-ending-style:opacity-0 data-starting-style:transform-[translateY(-4px)_scale(0.98)] data-starting-style:opacity-0 motion-reduce:transition-none">
            <Image
              src="/assets/vantaui-preview.jpg"
              alt="Preview of the Vanta UI homepage"
              width={1440}
              height={900}
              sizes="(max-width: 280px) 90vw, 240px"
              className="block h-auto w-full rounded-[12px] bg-background border"
            />
            <div className="flex items-center justify-between px-2 pt-2 pb-2 text-xs text-muted-foreground">
              <span>vantaui.com</span>
            </div>
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
}

function NavigationDescription({ className }: { className?: string }) {
  return (
    <div className={cn("mt-2.5 flex max-w-88 flex-col gap-3", className)}>
        <p className="m-0 text-pretty">
        Been making things on the internet for 5 years. From small basement projects to owning my design/dev agency to startups to products used by 100k+ people. Now I&apos;m building. Welcome to my small world.
        </p>
        <p className="m-0 flex items-center gap-2 text-pretty">
          Co-creating <VantaPreview />
        </p>
        <ul className="m-0 list-none p-0 text-muted-foreground md:text-inherit" aria-label="Services">
          <li>App Design</li>
          <li>Product Design</li>
          <li>Web Development</li>
          <li>Interaction Design</li>
        </ul>
      </div>
  );
}

export default function Navigation({ bookingUrl, className }: NavigationProps) {
  const isHome = usePathname() === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const [pendingBooking, setPendingBooking] = useState(false);
  const openMobileBooking = (event: MouseEvent<HTMLButtonElement>) => {
    // Let the navigation finish closing before Cal opens its native popup.
    event.stopPropagation();
    setPendingBooking(true);
    setMenuOpen(false);
  };

  useEffect(() => {
    let cancelled = false;
    void getCalApi({ namespace: "30min" }).then((cal) => {
      if (cancelled) return;
      const brandColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--foreground").trim();
      cal("ui", {
        styles: { branding: { brandColor } },
        hideEventTypeDetails: false,
        layout: "month_view",
        theme: "auto",
      });
    });
    return () => { cancelled = true; };
  }, [resolvedTheme]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <>
    {/* White content with a transparent backdrop inverts the imagery beneath it. */}
    <header
      data-slot="navigation"
      className={cn(
        "sticky top-0 z-40 flex flex-col gap-8 bg-linear-to-b from-background to-transparent px-2 pt-2 pb-2 font-camera text-[13px] text-foreground md:grid md:grid-cols-[44px_minmax(0,1fr)_minmax(220px,288px)_clamp(24px,8vw,160px)] md:items-start md:gap-2 md:bg-none md:pb-0 md:text-white md:leading-[1.3] md:mix-blend-difference",
        isHome && "md:fixed md:inset-x-0 md:top-0",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/"
          className="block w-11 shrink-0 focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring md:focus-visible:outline-white"
          aria-label="Zel home"
        >
          <Image
            src="/assets/zel-logo.svg"
            alt="Zel"
            width={48}
            height={48}
            className="block size-12 dark:invert md:invert"
            unoptimized
          />
        </Link>
        <Dialog.Root
          open={menuOpen}
          onOpenChange={setMenuOpen}
          onOpenChangeComplete={(open) => {
            if (!open && pendingBooking) {
              setPendingBooking(false);
              if (bookingUrl) {
                const calLink = bookingUrl.replace(/^https?:\/\/(?:www\.)?cal\.com\//, "").replace(/\/+$/, "");
                void getCalApi({ namespace: "30min" }).then((cal) => {
                  cal("modal", { calLink, config: { layout: "month_view", theme: "auto" } });
                });
              }
            }
          }}
        >
          <Dialog.Trigger
            render={<HamburgerMenu open={menuOpen} className="md:hidden" />}
          />
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-70 bg-overlay/30 transition-opacity duration-250 data-starting-style:opacity-0 data-ending-style:opacity-0 motion-reduce:transition-none" />
            <Dialog.Popup
              className="fixed inset-0 z-80 flex h-dvh w-full flex-col overflow-y-auto bg-background p-2 font-camera text-foreground outline-none transition-transform duration-250 ease-out data-starting-style:translate-x-full data-ending-style:translate-x-full motion-reduce:transition-none"
            >
              <Dialog.Title className="sr-only">Navigation menu</Dialog.Title>
              <div className="flex shrink-0 items-center justify-between gap-2">
                <Link
                  href="/"
                  aria-label="Zel home"
                  onNavigate={() => setMenuOpen(false)}
                  className="block shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  <Image src="/assets/zel-logo.svg" alt="Zel" width={48} height={48} className="block size-12 dark:invert" unoptimized />
                </Link>
                <Dialog.Close render={<HamburgerMenu open={menuOpen} />} />
              </div>
              <nav className="flex flex-1 flex-col justify-center px-2 py-12" aria-label="Mobile navigation">
                <NavigationLinks mobile bookingUrl={bookingUrl} onBook={openMobileBooking} onNavigate={() => setMenuOpen(false)} />
              </nav>
              <StickyCursor />
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
        {!menuOpen && <StickyCursor className="md:hidden" />}

      </div>

      <nav className="hidden md:block md:pt-2 ml-2" aria-label="Main navigation">
        <NavigationLinks bookingUrl={bookingUrl} />
      </nav>

      <NavigationDescription className="hidden md:flex md:justify-self-start" />
    </header>
    <div className="px-2 pt-6 pb-12 font-camera text-[13px] text-foreground md:hidden">
      <NavigationDescription />
    </div>
    </>
  );
}
